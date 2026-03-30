"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, CheckSquare, X } from "lucide-react";

type TaskItem = {
  id: string;
  type: "stale" | "pain" | "checkin";
  priority: "high" | "medium" | "low";
  client: { id: string; name: string };
  label: string;
  detail: string;
  href: string;
};

const STORAGE_KEY = "fittrack_dismissed_tasks";

function getDismissed(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function dismiss(id: string) {
  const current = getDismissed();
  if (!current.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, id]));
  }
}

const priorityConfig = {
  high: {
    icon: AlertTriangle,
    iconColor: "text-red-500",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    badge: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400",
  },
  medium: {
    icon: Clock,
    iconColor: "text-orange-500",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400",
  },
  low: {
    icon: CheckSquare,
    iconColor: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400",
  },
};

export default function TaskList({
  tasks,
  priorityLabel,
  allClearTitle,
  allClearSub,
}: {
  tasks: TaskItem[];
  priorityLabel: Record<string, string>;
  allClearTitle: string;
  allClearSub: string;
}) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    setDismissed(getDismissed());
  }, []);

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismiss(id);
    setDismissed((prev) => [...prev, id]);
  };

  const visible = tasks
    .filter((t) => !dismissed.includes(t.id))
    .sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

  if (visible.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckSquare className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">{allClearTitle}</h3>
        <p className="text-muted-foreground text-sm">{allClearSub}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {visible.map((task) => {
        const config = priorityConfig[task.priority];
        const Icon = config.icon;
        return (
          <div key={task.id} className={`relative flex items-center gap-4 p-4 rounded-2xl border ${config.border} ${config.bg}`}>
            <Link href={task.href} className="flex items-center gap-4 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-card rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-foreground text-sm">{task.client.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.badge}`}>
                    {priorityLabel[task.priority]}
                  </span>
                </div>
                <p className="text-sm text-foreground">{task.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.detail}</p>
              </div>
              <span className="text-muted-foreground flex-shrink-0">&#8594;</span>
            </Link>
            <button
              onClick={(e) => handleDismiss(task.id, e)}
              className="ml-1 flex-shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
