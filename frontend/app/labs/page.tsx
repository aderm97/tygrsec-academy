"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { cn } from "@/lib/utils";
import { trackActivity } from "@/lib/pathway-progress";
import { toast } from "react-hot-toast";

interface Lab {
  slug: string;
  title: string;
  category: string;
  port: string;
  description: string;
  state: "stopped" | "starting" | "running";
}

const initialLabs: Lab[] = [
  { slug: "sqli-101",      title: "SQL Injection 101",             category: "SQL Injection",  port: "8081", description: "Vulnerable login endpoint with raw SQL string interpolation.", state: "stopped" },
  { slug: "xss-discovery", title: "XSS Discovery",                 category: "XSS",            port: "8082", description: "Reflected XSS via unsanitised search query parameter.", state: "stopped" },
  { slug: "secure-input",  title: "Secure Coding: Input Validation",category: "Secure Coding", port: "8086", description: "Path traversal in a file retrieval endpoint.", state: "stopped" },
  { slug: "fintech-bank",  title: "Fintech Race Condition",         category: "Secure Coding", port: "8087", description: "Concurrent transaction handler missing mutex locking.", state: "stopped" },
];

export default function LabsPage() {
  const [labs, setLabs] = useState<Lab[]>(initialLabs);

  const toggle = async (index: number) => {
    const lab = labs[index];
    const isRunning = lab.state === "running";
    const action = isRunning ? "stop" : "start";

    setLabs(prev => prev.map((l, i) => i === index ? { ...l, state: "starting" } : l));

    try {
      const res = await fetch("http://localhost:8080/api/v1/public/labs/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, challenge: lab.slug }),
      });
      if (!res.ok) throw new Error("Request failed");
      setLabs(prev => prev.map((l, i) => i === index ? { ...l, state: isRunning ? "stopped" : "running" } : l));
      trackActivity({ type: isRunning ? "lab_stopped" : "lab_started", challengeSlug: lab.slug });
    } catch {
      setLabs(prev => prev.map((l, i) => i === index ? { ...l, state: isRunning ? "running" : "stopped" } : l));
      toast.error("Failed to control container. Ensure Docker Desktop is running.");
    }
  };

  const activeCount = labs.filter(l => l.state === "running").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Lab Sandboxes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start and stop isolated Docker containers for each challenge.
          </p>
        </div>

        {/* Status bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Active Containers" value={`${activeCount} / ${labs.length}`} />
          <StatCard label="Memory Allocated"  value={`${activeCount * 256} MB`} />
          <StatCard label="CPU Cores"         value={`${activeCount * 0.5}`} />
          <StatCard label="Network"           value="bridge0" mono />
        </div>

        {/* Labs list */}
        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {labs.map((lab, i) => (
            <div key={lab.slug} className="bg-card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">

              {/* Status dot */}
              <span className={cn("pulse-dot shrink-0", lab.state === "running" ? "online" : lab.state === "starting" ? "pending" : "offline")} />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground">{lab.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{lab.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{lab.description}</p>
                <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">tygrsec-academy-{lab.slug} · :{lab.port}</p>
              </div>

              {/* State label */}
              <span className={cn(
                "text-xs font-medium shrink-0 hidden sm:block w-20 text-right",
                lab.state === "running"  ? "status-online"  :
                lab.state === "starting" ? "status-pending"  : "status-offline"
              )}>
                {lab.state === "running" ? "Online" : lab.state === "starting" ? "Pending" : "Offline"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {lab.state === "running" && (
                  <a
                    href={`http://localhost:${lab.port}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors font-medium"
                  >
                    Open
                  </a>
                )}
                <button
                  onClick={() => toggle(i)}
                  disabled={lab.state === "starting"}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded font-semibold transition-colors disabled:opacity-50",
                    lab.state === "running"
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                >
                  {lab.state === "starting" ? "Wait..." : lab.state === "running" ? "Stop" : "Start"}
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
}

function StatCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border border-border rounded-lg p-4 bg-card">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5">{label}</p>
      <p className={cn("text-xl font-bold text-foreground", mono && "font-mono")}>{value}</p>
    </div>
  );
}
