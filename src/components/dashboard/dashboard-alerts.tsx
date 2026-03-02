"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, TrendingUp, X } from "lucide-react";

const STORAGE_KEY = "fittrack_dismissed_tasks";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

type StaleClient = { id: string; name: string };
type PainFlag = { id: string; clientId: string; bodyRegion: string; severity: number; client: { id: string; name: string } };

export default function DashboardAlerts({
  staleClients,
  recentPainFlags,
  allClearLabel,
  allClearSub,
  noSessions7DaysLabel,
  painFlagLabel,
  severityLabel,
}: {
  staleClients: StaleClient[];
  recentPainFlags: PainFlag[];
  allClearLabel: string;
  allClearSub: string;
  noSessions7DaysLabel: string;
  painFlagLabel: string;
  severityLabel: string;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const dismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const current = getDismissed();
    if (!current.includes(id)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
    }
    setDismissed((prev) => [...prev, id]);
  };

  const visiblePainFlags = recentPainFlags.filter((pf) => !dismissed.includes(`pain-${pf.id}`));
  const visibleStaleClients = staleClients.filter((c) => !dismissed.includes(`stale-${c.id}`));
  const total = visiblePainFlags.length + visibleStaleClients.length;

  if (total === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="w-8 h-8 text-emerald-300 mx-auto mb-2" />
        <p className="text-emerald-600 text-sm font-medium">{allClearLabel}</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{allClearSub}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visiblePainFlags.map((pf) => (
        <div key={pf.id} className="relative flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-xl">
          <Link href={`/clients/${pf.clientId}`} className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800 dark:text-red-300">{pf.client.name}</p>
              <p className="text-xs text-red-600 dark:text-red-400">{painFlagLabel}: {pf.bodyRegion} — {severityLabel} {pf.severity}/5</p>
            </div>
          </Link>
          <button onClick={(e) => dismiss(`pain-${pf.id}`, e)}
            className="flex-shrink-0 p-1 rounded-lg text-red-300 hover:text-red-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
      {visibleStaleClients.map((c) => (
        <div key={c.id} className="relative flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/30 rounded-xl">
          <Link href={`/clients/${c.id}`} className="flex items-start gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">{c.name}</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">{noSessions7DaysLabel}</p>
            </div>
          </Link>
          <button onClick={(e) => dismiss(`stale-${c.id}`, e)}
            className="flex-shrink-0 p-1 rounded-lg text-orange-300 hover:text-orange-500 transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
