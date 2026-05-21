"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { useUserStats, useUserProgress } from "@/hooks/use-user-data";
import { getLevelName } from "@/lib/utils";
import { API_BASE, getAuthHeaders } from "@/lib/auth";

// ─── Recent activity is fetched from progress data ──────────────────────────

const KNOWN_CHALLENGES: Record<string, string> = {
  "1": "SQL Injection 101",
  "2": "XSS Discovery",
  "3": "Broken Authentication",
  "4": "IDOR Challenge",
  "5": "Command Injection",
  "6": "Secure Coding: Input Validation",
  "7": "Fintech Race Condition",
};

// ─── Skeleton loaders ───────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted/60 rounded animate-pulse ${className}`} />;
}

// ─── Main sidebar ───────────────────────────────────────────────────────────

export function DashboardSidebar() {
  const { user, token } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const { progress, isLoading: progressLoading } = useUserProgress();
  const [challengeNames, setChallengeNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`${API_BASE}/api/v1/challenges?page=1&size=50`, { headers });
        if (res.ok) {
          const body = await res.json();
          const mapping: Record<string, string> = {};
          (body.data || []).forEach((c: any) => {
            mapping[c.id] = c.title;
          });
          setChallengeNames(mapping);
        }
      } catch (err) {
        console.error("Failed to fetch challenges in sidebar:", err);
      }
    };
    if (token) {
      fetchChallenges();
    }
  }, [token]);

  const xpPct = stats ? Math.min(100, Math.round((stats.xp / stats.xp_to_next_level) * 100)) : 0;

  const recentActivity = progress
    .filter(p => p.status !== "unsolved")
    .slice(0, 4)
    .map(p => ({
      challenge: challengeNames[p.challenge_id] ?? KNOWN_CHALLENGES[p.challenge_id] ?? `Challenge #${p.challenge_id.slice(0, 8)}`,
      status:    p.status,
      when:      p.solved_at ? formatRelative(p.solved_at) : "Recently",
    }));

  const solvedCount    = progress.filter(p => p.status === "solved").length;
  const attemptedCount = progress.filter(p => p.status === "attempted").length;

  return (
    <div className="space-y-5">

      {/* Level & XP */}
      <section className="border border-border rounded-lg p-4 bg-card">
        {statsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">
                Level {stats?.level ?? user?.level ?? 1}
              </span>
              <span className="text-xs text-muted-foreground">
                {getLevelName(stats?.level ?? user?.level ?? 1)}
              </span>
            </div>
            <div className="xp-bar mb-1">
              <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              {(stats?.xp ?? user?.xp ?? 0).toLocaleString()} / {(stats?.xp_to_next_level ?? user?.xp_to_next_level ?? 1000).toLocaleString()} XP
            </p>
          </>
        )}
      </section>

      {/* Quick stats */}
      <section className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Stats</h3>
        {statsLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
          </div>
        ) : (
          <div className="space-y-2.5">
            <Row label="Streak"      value={`${stats?.streak ?? 0} days`} />
            <Row label="Global Rank" value={stats?.rank ? `#${stats.rank}` : "Unranked"} />
            <Row label="Solved"      value={`${solvedCount || stats?.challenges_solved || 0}`} />
            <Row label="Attempted"   value={`${attemptedCount}`} />
            <Row label="Badges"      value={`${stats?.badges_count ?? 0}`} />
          </div>
        )}
      </section>

      {/* Recent activity */}
      <section className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Recent Activity</h3>
        {progressLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : recentActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground">No activity yet. Start a challenge!</p>
        ) : (
          <div className="space-y-2.5">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-foreground leading-snug">{a.challenge}</p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${
                  a.status === "solved" ? "diff-beginner" : "diff-medium"
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Continue pathway CTA */}
      <section className="border border-primary/30 rounded-lg p-4 bg-primary/5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Continue Learning</h3>
        <p className="text-sm font-semibold text-foreground mb-0.5">SAST &amp; DAST Mastery</p>
        <p className="text-xs text-muted-foreground mb-3">Next: DAST Scanning Protocols</p>
        <Link
          href="/pathways"
          className="block w-full text-center text-xs font-semibold py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Continue Pathway
        </Link>
      </section>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold text-foreground font-mono">{value}</span>
    </div>
  );
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs  < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
