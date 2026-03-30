"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface EngagementData {
  score: number;
  breakdown: { sessions: { count: number }; checkIns: { count: number }; messages: { count: number }; habits: { count: number } };
  lastActive: string | null;
}

export default function EngagementBadge({ clientId, showDetail = false }: { clientId: string; showDetail?: boolean }) {
  const [data, setData] = useState<EngagementData | null>(null);

  useEffect(() => {
    fetch(`/api/engagement-score/${clientId}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [clientId]);

  if (!data) return null;

  const { score } = data;
  const color = score >= 70 ? "emerald" : score >= 40 ? "amber" : "red";
  const Icon = score >= 70 ? TrendingUp : score >= 40 ? TrendingDown : AlertTriangle;

  if (!showDetail) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-${color}-100 dark:bg-${color}-900/30 text-${color}-700 dark:text-${color}-400`}>
        <Icon className="w-3 h-3" /> {score}
      </span>
    );
  }

  return (
    <div className={`p-4 rounded-xl border bg-${color}-50 dark:bg-${color}-950/20 border-${color}-200 dark:border-${color}-800`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/50`}>
          <span className={`text-xl font-bold text-${color}-600 dark:text-${color}-400`}>{score}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Engagement Score</p>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { label: "Workouts", value: data.breakdown.sessions.count },
          { label: "Check-ins", value: data.breakdown.checkIns.count },
          { label: "Messages", value: data.breakdown.messages.count },
          { label: "Habits", value: data.breakdown.habits.count },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-lg font-bold text-foreground">{item.value}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      {data.lastActive && (
        <p className="text-xs text-muted-foreground mt-2">
          Last active: {new Date(data.lastActive).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </p>
      )}
    </div>
  );
}
