import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="max-w-screen-xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-foreground">SC</span>
          <span>Tygrsec Academy — Learn. Exploit. Defend.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/pathways" className="hover:text-foreground transition-colors">Pathways</Link>
          <Link href="/labs" className="hover:text-foreground transition-colors">Labs</Link>
          <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
        </div>
      </div>
    </footer>
  );
}