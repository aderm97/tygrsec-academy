"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { API_BASE, getAuthHeaders } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";

type Filter = "global" | "sqli" | "xss" | "secure-coding";

interface LeaderboardEntry {
  rank: number;
  username: string;
  level: number;
  xp: number;
  solved: number;
  streak: number;
}

const filters: { key: Filter; label: string }[] = [
  { key: "global",       label: "Global"       },
  { key: "sqli",         label: "SQL Injection" },
  { key: "xss",          label: "XSS"          },
  { key: "secure-coding",label: "Secure Coding" },
];

export default function LeaderboardPage() {
  const [filter, setFilter] = useState<Filter>("global");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setIsLoading(true);
    const url = filter === "global"
      ? `${API_BASE}/api/v1/leaderboard`
      : `${API_BASE}/api/v1/leaderboard/categories/${filter}`;
    fetch(url, { headers: getAuthHeaders(), cache: 'no-store' })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        setLeaderboard(Array.isArray(data) ? data : []);
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [filter]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Top performers ranked by XP earned.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit mb-6">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-4 py-1.5 rounded text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-16">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-20">Level</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Solved</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24">Streak</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide w-32">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-card">
                    <td className="px-4 py-4 w-16"><div className="h-4 bg-muted rounded w-6"></div></td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-6 w-6 rounded-full bg-muted"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center"><div className="h-4 bg-muted rounded w-8 mx-auto"></div></td>
                    <td className="px-4 py-4 text-center"><div className="h-4 bg-muted rounded w-8 mx-auto"></div></td>
                    <td className="px-4 py-4 text-center"><div className="h-4 bg-muted rounded w-8 mx-auto"></div></td>
                    <td className="px-4 py-4 text-right"><div className="h-4 bg-muted rounded w-16 ml-auto"></div></td>
                  </tr>
                ))
              ) : leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground font-mono text-xs">
                    No users found on the leaderboard yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((row) => {
                  const isMe = row.username === user?.username;
                  return (
                    <tr
                      key={row.username}
                      className={cn(
                        "bg-card transition-colors",
                        isMe ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {row.rank <= 3
                          ? <span className={cn("font-bold", row.rank === 1 ? "text-amber-500" : row.rank === 2 ? "text-zinc-400" : "text-amber-700")}>#{row.rank}</span>
                          : `#${row.rank}`
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center uppercase font-mono shrink-0">
                            {row.username.charAt(0)}
                          </div>
                          <span className={cn("font-medium", isMe ? "text-primary" : "text-foreground")}>
                            {row.username}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-semibold">you</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono">{row.level}</td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground font-mono">{row.solved}</td>
                      <td className="px-4 py-3 text-center text-xs font-mono">
                        <span className={row.streak > 0 ? "text-amber-500 font-semibold" : "text-muted-foreground"}>
                          {row.streak}d
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-foreground">
                        {row.xp.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </main>
      <Footer />
    </div>
  );
}
