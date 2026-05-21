"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const router = useRouter();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [localErr, setLocalErr] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalErr(null);
    try {
      await login(email, password);
      router.push("/");
    } catch (err: unknown) {
      setLocalErr(err instanceof Error ? err.message : "Login failed");
    }
  };

  const displayError = localErr ?? error;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="text-primary font-mono font-bold text-xl tracking-tight">SC</span>
        <span className="text-base font-semibold text-foreground">Tygrsec Academy</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="border border-border rounded-lg bg-card p-8">
          <h1 className="text-lg font-semibold text-foreground mb-1">Sign in</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">Register</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </Field>

            <Field label="Password">
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className={inputCls}
              />
            </Field>

            {displayError && (
              <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                {displayError}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Demo hint removed */}
      </div>
    </div>
  );
}

const inputCls = "w-full h-9 px-3 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}
