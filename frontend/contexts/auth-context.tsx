"use client";

import {
  createContext, useCallback, useContext,
  useEffect, useMemo, useState, type ReactNode,
} from "react";
import { API_BASE, clearToken, getToken, setToken } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  xp_to_next_level: number;
  streak: number;
  rank: number;
  challenges_solved: number;
  total_challenges: number;
  badges_count: number;
  avatar?: string;
  created_at: string;
}

interface AuthState {
  user:      AuthUser | null;
  token:     string | null;
  isLoading: boolean;
  error:     string | null;
}

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout:   () => void;
  refresh:  () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null, token: null, isLoading: true, error: null,
  });

  // Fetch /users/me and merge into state
  const fetchMe = useCallback(async (token: string): Promise<AuthUser | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const data = await res.json();
      // Normalise fields from Go model
      return {
        id:                data.id       ?? data.ID,
        username:          data.username,
        email:             data.email,
        level:             data.level    ?? 1,
        xp:                data.xp       ?? 0,
        xp_to_next_level:  data.xp_to_next_level   ?? 1000,
        streak:            data.streak   ?? 0,
        rank:              data.rank     ?? 0,
        challenges_solved: data.challenges_solved   ?? 0,
        total_challenges:  data.total_challenges    ?? 0,
        badges_count:      data.badges_count        ?? 0,
        avatar:            data.avatar_url,
        created_at:        data.created_at,
      };
    } catch {
      return null;
    }
  }, []);

  // On mount: rehydrate from localStorage
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setState(s => ({ ...s, isLoading: false }));
      return;
    }
    fetchMe(token).then(user => {
      if (user) setState({ user, token, isLoading: false, error: null });
      else {
        clearToken();
        setState({ user: null, token: null, isLoading: false, error: null });
      }
    });
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username_or_email: email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setState(s => ({ ...s, isLoading: false, error: body?.error ?? "Login failed" }));
      throw new Error(body?.error ?? "Login failed");
    }
    const { access_token } = await res.json();
    setToken(access_token);
    const user = await fetchMe(access_token);
    setState({ user, token: access_token, isLoading: false, error: null });
  }, [fetchMe]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    setState(s => ({ ...s, isLoading: true, error: null }));
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setState(s => ({ ...s, isLoading: false, error: body?.error ?? "Registration failed" }));
      throw new Error(body?.error ?? "Registration failed");
    }
    // auto-login after registration
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, token: null, isLoading: false, error: null });
  }, []);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const user = await fetchMe(token);
    if (user) setState(s => ({ ...s, user }));
  }, [fetchMe]);

  const value = useMemo(() => ({ ...state, login, register, logout, refresh }), [state, login, register, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
};
