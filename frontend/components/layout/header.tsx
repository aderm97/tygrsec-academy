"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",            label: "Dashboard"   },
  { href: "/pathways",    label: "Pathways"    },
  { href: "/labs",        label: "Labs"        },
  { href: "/leaderboard", label: "Leaderboard" },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const pathname  = usePathname();
  const router    = useRouter();
  const { user, logout, isLoading } = useAuth();

  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const xpPct = user
    ? Math.min(100, Math.round((user.xp / user.xp_to_next_level) * 100))
    : 0;

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between gap-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="text-primary font-mono font-bold text-lg tracking-tight">SC</span>
          <span className="text-sm font-semibold text-foreground hidden sm:block">Tygrsec Academy</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {!isLoading && user ? (
            <>
              {/* Streak */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-muted-foreground border border-border rounded px-2 py-1">
                <span className="text-amber-500 font-bold">{user.streak}d</span>
                <span>streak</span>
              </div>

              {/* XP pill */}
              <div className="hidden md:flex flex-col items-end gap-0.5 min-w-[90px]">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-semibold text-foreground">Lvl {user.level}</span>
                  <span className="text-muted-foreground font-mono">{user.xp.toLocaleString()} XP</span>
                </div>
                <div className="xp-bar w-full">
                  <div className="xp-bar-fill" style={{ width: `${xpPct}%` }} />
                </div>
              </div>

              {/* Theme toggle */}
              <ThemeToggle theme={theme} setTheme={setTheme} />

              {/* User menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="h-7 w-7 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center uppercase font-mono hover:bg-primary/30 transition-colors"
                  aria-label="User menu"
                >
                  {user.username.charAt(0)}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-9 w-52 border border-border rounded-lg bg-card shadow-lg py-1.5 z-50">
                    {/* User info */}
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs font-semibold text-foreground">{user.username}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    </div>

                    <MenuItem onClick={() => { router.push("/"); setUserMenuOpen(false); }}>
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { router.push("/leaderboard"); setUserMenuOpen(false); }}>
                      Leaderboard
                    </MenuItem>

                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : !isLoading && (
            <>
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <Link
                href="/login"
                className="text-xs font-semibold px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}

          {/* Mobile toggle */}
          <button
            className="md:hidden p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="4" y1="8" x2="20" y2="8"/><line x1="4" y1="16" x2="20" y2="16"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background">
          <nav className="max-w-screen-xl mx-auto px-6 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 rounded text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded text-sm font-medium text-destructive hover:bg-destructive/10 text-left transition-colors mt-1 border-t border-border"
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function ThemeToggle({ theme, setTheme }: { theme: string | undefined; setTheme: (t: string) => void }) {
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label="Toggle theme"
    >
      <svg className="h-4 w-4 dark:hidden" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
      <svg className="h-4 w-4 hidden dark:block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
    </button>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted transition-colors"
    >
      {children}
    </button>
  );
}