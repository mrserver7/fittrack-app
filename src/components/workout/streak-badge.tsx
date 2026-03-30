"use client";
import { useEffect, useState } from "react";
import { Flame, Shield } from "lucide-react";

interface StreakBadgeProps {
  clientId?: string;
  size?: "sm" | "md" | "lg";
}

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  freezesUsed: number;
  freezesAllowed: number;
}

export default function StreakBadge({ size = "md" }: StreakBadgeProps) {
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    fetch("/api/streak")
      .then((r) => r.json())
      .then((d) => setStreak(d.streak))
      .catch(() => {});
  }, []);

  if (!streak) return null;

  const s = streak.currentStreak;

  if (size === "sm") {
    return (
      <span className="inline-flex items-center gap-1 text-sm font-semibold">
        <Flame className={`w-4 h-4 ${s > 0 ? "text-orange-500" : "text-gray-400"}`} />
        <span className={s > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-500"}>{s}</span>
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center gap-2 p-5 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-2xl border border-orange-100 dark:border-orange-900/50">
        <Flame className={`w-10 h-10 ${s > 0 ? "text-orange-500" : "text-gray-400"}`} />
        <span className="text-4xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">{s}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {s === 0 ? "Start your streak!" : s === 1 ? "week streak" : "week streak"}
        </span>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
          <span>Best: {streak.longestStreak}</span>
          <span>-</span>
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            {streak.freezesAllowed - streak.freezesUsed} freeze left
          </span>
        </div>
      </div>
    );
  }

  // Default "md"
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 rounded-xl border border-orange-100 dark:border-orange-900/50">
      <Flame className={`w-6 h-6 ${s > 0 ? "text-orange-500" : "text-gray-400"}`} />
      <div>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-50 tabular-nums">{s}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 ml-1.5">
          {s === 0 ? "Start your streak!" : "week streak"}
        </span>
      </div>
    </div>
  );
}
