// Pathway progress tracking — persisted in localStorage per user, syncs to API when available
import { API_BASE, getToken } from "@/lib/auth";

const STORAGE_KEY = "sc_pathway_progress";

export interface StepCompletion {
  pathwayId: string;
  stepIndex: number;
  completedAt: string;    // ISO string
  timeSpent: number;      // seconds
  xpEarned?: number;
}

export interface ActivityEvent {
  type: "step_completed" | "step_started" | "lab_started" | "lab_stopped" | "flag_submitted" | "pathway_opened" | "challenge_opened";
  pathwayId?: string;
  stepIndex?: number;
  challengeSlug?: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

interface PathwayStore {
  completions: StepCompletion[];
  activity: ActivityEvent[];
}

// ─── Read/Write from localStorage ─────────────────────────────────────────

function getStore(): PathwayStore {
  if (typeof window === "undefined") return { completions: [], activity: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completions: [], activity: [] };
    return JSON.parse(raw);
  } catch {
    return { completions: [], activity: [] };
  }
}

function setStore(store: PathwayStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// ─── Public API ───────────────────────────────────────────────────────────

export function isStepCompleted(pathwayId: string, stepIndex: number): boolean {
  const store = getStore();
  return store.completions.some(c => c.pathwayId === pathwayId && c.stepIndex === stepIndex);
}

export function getPathwayCompletions(pathwayId: string): StepCompletion[] {
  return getStore().completions.filter(c => c.pathwayId === pathwayId);
}

export function getAllCompletions(): StepCompletion[] {
  return getStore().completions;
}

export function completeStep(pathwayId: string, stepIndex: number, timeSpent = 0, xpEarned = 0): void {
  const store = getStore();
  // Don't duplicate
  if (store.completions.some(c => c.pathwayId === pathwayId && c.stepIndex === stepIndex)) return;
  const completion: StepCompletion = {
    pathwayId,
    stepIndex,
    completedAt: new Date().toISOString(),
    timeSpent,
    xpEarned,
  };
  store.completions.push(completion);
  store.activity.push({
    type: "step_completed",
    pathwayId,
    stepIndex,
    timestamp: completion.completedAt,
  });
  setStore(store);
  // Fire-and-forget API sync
  syncCompletionToAPI(completion);
}


export function trackActivity(event: Omit<ActivityEvent, "timestamp">): void {
  const store = getStore();
  const fullEvent: ActivityEvent = { ...event, timestamp: new Date().toISOString() };
  store.activity.push(fullEvent);
  // Cap activity log at 200 entries
  if (store.activity.length > 200) store.activity = store.activity.slice(-200);
  setStore(store);
}

export function getActivity(limit = 20): ActivityEvent[] {
  return getStore().activity.slice(-limit).reverse();
}

export function getActivityByType(type: ActivityEvent["type"], limit = 20): ActivityEvent[] {
  return getStore().activity.filter(a => a.type === type).slice(-limit).reverse();
}

// ─── Stats ────────────────────────────────────────────────────────────────

export function getPathwayStats(pathwayId: string, totalSteps: number) {
  const completions = getPathwayCompletions(pathwayId);
  const completed = completions.length;
  const totalTime = completions.reduce((sum, c) => sum + c.timeSpent, 0);
  return {
    completed,
    total: totalSteps,
    percent: totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0,
    totalTimeSpent: totalTime,
    isComplete: completed >= totalSteps,
    lastActivity: completions.length > 0
      ? completions.sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0].completedAt
      : null,
  };
}

export function getGlobalStats() {
  const store = getStore();
  const uniquePathways = new Set(store.completions.map(c => c.pathwayId));
  return {
    totalStepsCompleted: store.completions.length,
    pathwaysStarted: uniquePathways.size,
    totalEvents: store.activity.length,
    totalTimeSpent: store.completions.reduce((s, c) => s + c.timeSpent, 0),
  };
}

// ─── API Sync (fire-and-forget) ───────────────────────────────────────────

async function syncCompletionToAPI(completion: StepCompletion): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE}/api/v1/users/me/pathway-progress`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(completion),
    });
  } catch {
    // Silently fail — localStorage is the source of truth for now
  }
}

export async function fetchAndSyncProgress(): Promise<void> {
  const token = getToken();
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/v1/users/me/pathway-progress`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return;
    const backendCompletions: StepCompletion[] = await res.json();
    
    const store = getStore();
    let updated = false;
    
    for (const bc of backendCompletions) {
      const exists = store.completions.some(
        c => c.pathwayId === bc.pathwayId && c.stepIndex === bc.stepIndex
      );
      if (!exists) {
        store.completions.push({
          pathwayId: bc.pathwayId,
          stepIndex: bc.stepIndex,
          completedAt: bc.completedAt,
          timeSpent: bc.timeSpent,
          xpEarned: bc.xpEarned,
        });
        updated = true;
      }
    }
    
    if (updated) {
      setStore(store);
    }
  } catch {
    // Silently ignore network failures
  }
}
