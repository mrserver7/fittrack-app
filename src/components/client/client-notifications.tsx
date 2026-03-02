"use client";
import { useState } from "react";
import { X } from "lucide-react";

type Notif = { id: string; title: string; body: string | null };

export default function ClientNotifications({ initialNotifications }: { initialNotifications: Notif[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const dismiss = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  if (notifications.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{n.title}</p>
            {n.body && <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">{n.body}</p>}
          </div>
          <button onClick={() => dismiss(n.id)}
            className="text-blue-300 hover:text-blue-600 dark:hover:text-blue-200 transition-colors flex-shrink-0 p-0.5 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
