import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty.toLowerCase()) {
    case "beginner":
      return "bg-green-500/20 text-green-400 border-green-500/50";
    case "easy":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "medium":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    case "hard":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "expert":
      return "bg-red-500/20 text-red-400 border-red-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
}

export function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: "Script Kiddie",
    2: "Padawan",
    3: "Hacker",
    4: "Security Analyst",
    5: "Penetration Tester",
    6: "Security Engineer",
    7: "Security Architect",
    8: "Elite Hacker",
  };
  return names[level] || "Legend";
}