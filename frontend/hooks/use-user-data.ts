"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/auth";
import { useAuth } from "@/contexts/auth-context";

export interface UserStats {
  level: number;
  xp: number;
  xp_to_next_level: number;
  streak: number;
  rank: number;
  challenges_solved: number;
  total_challenges: number;
  badges_count: number;
  username: string;
  email: string;
}

export interface ChallengeProgress {
  challenge_id: string;
  status: "unsolved" | "attempted" | "solved";
  solved_at?: string;
  attempts: number;
  points_earned: number;
}

export function useUserStats() {
  const { token, user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      // Use auth context user data as fallback
      if (user) {
        setStats({
          level: user.level, xp: user.xp, xp_to_next_level: user.xp_to_next_level,
          streak: user.streak, rank: user.rank,
          challenges_solved: user.challenges_solved,
          total_challenges: user.total_challenges,
          badges_count: user.badges_count,
          username: user.username, email: user.email,
        });
      }
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE}/api/v1/users/me/stats`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(data => {
        setStats({
          level:             data.level             ?? user?.level          ?? 1,
          xp:                data.xp                ?? user?.xp             ?? 0,
          xp_to_next_level:  data.xp_to_next_level  ?? user?.xp_to_next_level ?? 1000,
          streak:            data.streak            ?? user?.streak          ?? 0,
          rank:              data.rank              ?? user?.rank            ?? 0,
          challenges_solved: data.challenges_solved ?? user?.challenges_solved ?? 0,
          total_challenges:  data.total_challenges  ?? user?.total_challenges  ?? 0,
          badges_count:      data.badges_count      ?? user?.badges_count      ?? 0,
          username:          data.username          ?? user?.username          ?? "",
          email:             data.email             ?? user?.email             ?? "",
        });
        setIsLoading(false);
      })
      .catch(e => {
        // Fallback to context data on API error
        if (user) setStats({
          level: user.level, xp: user.xp, xp_to_next_level: user.xp_to_next_level,
          streak: user.streak, rank: user.rank,
          challenges_solved: user.challenges_solved,
          total_challenges: user.total_challenges,
          badges_count: user.badges_count,
          username: user.username, email: user.email,
        });
        setError(String(e));
        setIsLoading(false);
      });
  }, [token, user]);

  return { stats, isLoading, error };
}

export function useUserProgress() {
  const { token } = useAuth();
  const [progress, setProgress] = useState<ChallengeProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) { setIsLoading(false); return; }

    fetch(`${API_BASE}/api/v1/users/me/progress`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setProgress(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => { setIsLoading(false); });
  }, [token]);

  const getProgress = (challengeId: string): ChallengeProgress | null =>
    progress.find(p => p.challenge_id === challengeId) ?? null;

  const isSolved = (challengeId: string): boolean =>
    getProgress(challengeId)?.status === "solved";

  return { progress, isLoading, getProgress, isSolved };
}
