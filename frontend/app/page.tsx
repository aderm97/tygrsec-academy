"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ChallengeGrid } from "@/components/challenge-grid";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useAuth } from "@/contexts/auth-context";
import { useUserStats } from "@/hooks/use-user-data";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`bg-muted/60 rounded animate-pulse ${className}`} />;
}

function StatCard({
  label, value, sub, accent, loading,
}: {
  label: string; value: string; sub: string; accent?: boolean; loading?: boolean;
}) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">{label}</p>
      {loading ? (
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      ) : (
        <>
          <p className={`text-2xl font-bold ${accent ? "text-primary" : "text-foreground"}`}>{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </>
      )}
    </div>
  );
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { stats, isLoading: statsLoading } = useUserStats();
  const router = useRouter();

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  if (authLoading) return null;
  if (!user) return null;

  const loading = statsLoading;
  const level   = stats?.level ?? user.level;
  const xp      = stats?.xp   ?? user.xp;
  const solved  = stats?.challenges_solved ?? user.challenges_solved;
  const total   = stats?.total_challenges  ?? user.total_challenges ?? 50;
  const rank    = stats?.rank  ?? user.rank;

  const xpRemaining = (stats?.xp_to_next_level ?? user.xp_to_next_level) - xp;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, <span className="text-foreground font-medium">{user.username}</span>. Pick up where you left off.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Challenges Solved" value={`${solved}`}   sub={`of ${total} total`}   loading={loading} />
          <StatCard label="Current Level"      value={`${level}`}   sub={getLevelName(level)}   loading={loading} />
          <StatCard label="XP Earned"          value={xp.toLocaleString()} sub={`${xpRemaining.toLocaleString()} to next level`} accent loading={loading} />
          <StatCard label="Global Rank"        value={rank > 0 ? `#${rank}` : "—"} sub={rank > 0 ? "Top performer" : "Unranked"} loading={loading} />
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ChallengeGrid />
          </div>
          <div>
            <DashboardSidebar />
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}

function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: "Rookie", 2: "Apprentice", 3: "Developer", 4: "Analyst",
    5: "Journeyman", 6: "Hacker", 7: "Expert", 8: "Elite",
    9: "Master", 10: "Grandmaster",
  };
  return names[level] ?? `Level ${level}`;
}