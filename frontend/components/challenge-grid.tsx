"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getAuthHeaders, API_BASE } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";
import { useUserProgress } from "@/hooks/use-user-data";

const challenges = [
  {
    id: "1", title: "SQL Injection 101",    slug: "sqli-101",
    description: "Bypass login authentication using raw SQL string injection.",
    difficulty: "beginner", points: 100,
    category: "SQL Injection",
    solves_count: 1234, is_solved: true,
    tags: ["OWASP", "Injection"],
  },
  {
    id: "2", title: "XSS Discovery",  slug: "xss-discovery",
    description: "Identify and exploit reflected cross-site scripting in a search endpoint.",
    difficulty: "easy", points: 200,
    category: "XSS",
    solves_count: 856, is_solved: false,
    tags: ["OWASP", "XSS"],
  },
  {
    id: "3", title: "Broken Authentication", slug: "broken-auth",
    description: "Exploit session fixation to hijack an authenticated user account.",
    difficulty: "medium", points: 400,
    category: "Authentication",
    solves_count: 432, is_solved: false,
    tags: ["OWASP", "Auth"],
  },
  {
    id: "4", title: "IDOR Challenge", slug: "idor-challenge",
    description: "Access other users' profiles through insecure object references.",
    difficulty: "medium", points: 400,
    category: "Access Control",
    solves_count: 567, is_solved: false,
    tags: ["OWASP", "IDOR"],
  },
  {
    id: "5", title: "Command Injection", slug: "cmd-injection",
    description: "Chain OS commands through an unvalidated shell execution path.",
    difficulty: "hard", points: 800,
    category: "Injection",
    solves_count: 234, is_solved: false,
    tags: ["OWASP", "RCE"],
  },
  {
    id: "6", title: "Secure Coding: Input Validation", slug: "secure-input",
    description: "Exploit path traversal in a file retrieval endpoint.",
    difficulty: "easy", points: 200,
    category: "Secure Coding",
    solves_count: 789, is_solved: false,
    tags: ["SAST", "Python"],
  },
  {
    id: "7", title: "Fintech Race Condition", slug: "fintech-bank",
    description: "Overdraft a banking ledger via concurrent transactions and missing mutexes.",
    difficulty: "medium", points: 500,
    category: "Secure Coding",
    solves_count: 142, is_solved: false,
    tags: ["Concurrency", "Fintech"],
  },
];

const difficultyClass: Record<string, string> = {
  beginner: "diff-beginner",
  easy:     "diff-easy",
  medium:   "diff-medium",
  hard:     "diff-hard",
  expert:   "diff-expert",
};

const categories = ["All", "SQL Injection", "XSS", "Authentication", "Access Control", "Injection", "Secure Coding"];
const difficulties = ["All", "beginner", "easy", "medium", "hard", "expert"];

export function ChallengeGrid() {
  const { token } = useAuth();
  const { progress, isSolved, isLoading: progressLoading } = useUserProgress();
  const [dbChallenges, setDbChallenges] = useState<any[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  const [search,     setSearch]     = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [category,   setCategory]   = useState("All");

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/v1/challenges?page=1&size=50`, { headers });
        if (res.ok) {
          const body = await res.json();
          setDbChallenges(body.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      } finally {
        setDbLoading(false);
      }
    };
    if (token) {
      fetchChallenges();
    } else {
      setDbLoading(false);
    }
  }, [token]);

  const challengesToRender = (dbChallenges.length > 0 ? dbChallenges : challenges).map(dbc => {
    const local = challenges.find(c => c.slug === dbc.slug);
    return {
      id: dbc.id || local?.id,
      title: dbc.title || local?.title,
      slug: dbc.slug || local?.slug,
      description: dbc.description || local?.description || "",
      difficulty: dbc.difficulty || local?.difficulty || "medium",
      points: dbc.points || local?.points || 200,
      category: typeof dbc.category === "object" && dbc.category ? dbc.category.name : (dbc.category || local?.category || "Secure Coding"),
      is_solved: isSolved(dbc.id) || local?.is_solved || false,
      tags: local?.tags || ["OWASP"],
    };
  });

  const filtered = challengesToRender.filter((c) => {
    const q = search.toLowerCase();
    if (search && !c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
    if (difficulty !== "All" && c.difficulty !== difficulty) return false;
    if (category   !== "All" && c.category   !== category)   return false;
    return true;
  });

  if (dbLoading || progressLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-32 bg-muted rounded animate-pulse" />
        <div className="h-32 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Challenges</h2>
        <span className="text-xs text-muted-foreground">{filtered.length} of {challengesToRender.length}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search challenges..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 h-8 px-3 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {difficulties.map(d => <option key={d}>{d}</option>)}
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 px-2 rounded border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Challenge table-like list */}
      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">No challenges match your filters.</div>
        ) : filtered.map((c) => (
          <Link
            key={c.id}
            href={`/challenges/${c.slug}`}
            className="flex items-center gap-4 px-4 py-3 bg-card hover:bg-muted/50 transition-colors group"
          >
            {/* Solved indicator */}
            <div className={cn(
              "h-2 w-2 rounded-full shrink-0",
              c.is_solved ? "bg-emerald-500" : "bg-border"
            )} />

            {/* Title + description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {c.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>
            </div>

            {/* Tags */}
            <div className="hidden md:flex gap-1.5 shrink-0">
              {c.tags.map(t => (
                <span key={t} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                  {t}
                </span>
              ))}
            </div>

            {/* Category */}
            <span className="hidden lg:block text-xs text-muted-foreground shrink-0 w-32 truncate text-right">
              {c.category}
            </span>

            {/* Difficulty */}
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded shrink-0", difficultyClass[c.difficulty])}>
              {c.difficulty}
            </span>

            {/* Points */}
            <span className="text-xs font-mono font-semibold text-foreground shrink-0 w-16 text-right">
              {c.points} pts
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}