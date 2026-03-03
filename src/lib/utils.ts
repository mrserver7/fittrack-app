import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function getWeekStart(date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export function generateToken(): string {
  return (
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Math.random().toString(36).slice(2) +
    Date.now().toString(36)
  );
}

export function computeReadinessScore(sleep: number, soreness: number, motivation: number): number {
  return Math.round(((sleep + (6 - soreness) + motivation) / 3) * 2 * 10) / 10;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-yellow-100 text-yellow-700",
    archived: "bg-gray-100 text-gray-500",
    invited: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    skipped: "bg-red-100 text-red-700",
    pending: "bg-gray-100 text-gray-600",
    in_progress: "bg-blue-100 text-blue-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-600";
}
