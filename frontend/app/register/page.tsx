"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

const inputCls = "w-full h-9 px-3 rounded border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  );
}

export default function RegisterPage() {
  const { register, isLoading } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [error,    setError]    = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters"); return; }
    try {
      await register(username, email, password);
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <span className="text-primary font-mono font-bold text-xl tracking-tight">SC</span>
        <span className="text-base font-semibold text-foreground">Tygrsec Academy</span>
      </Link>

      <div className="w-full max-w-sm">
        <div className="border border-border rounded-lg bg-card p-8">
          <h1 className="text-lg font-semibold text-foreground mb-1">Create account</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Username">
              <input
                type="text" value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="hacker123"
                required minLength={3} maxLength={30}
                pattern="[a-zA-Z0-9_-]+"
                title="Letters, numbers, underscores and hyphens only"
                className={inputCls}
              />
            </Field>
            <Field label="Email">
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required className={inputCls}
              />
            </Field>
            <Field label="Password">
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required minLength={8}
                className={inputCls}
              />
            </Field>
            <Field label="Confirm password">
              <input
                type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                required className={inputCls}
              />
            </Field>

            {error && (
              <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 rounded bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By registering you agree to our{" "}
          <span className="text-foreground">Terms of Service</span> and{" "}
          <span className="text-foreground">Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
