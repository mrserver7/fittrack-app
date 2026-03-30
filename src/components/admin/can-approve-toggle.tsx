"use client";
import { useState } from "react";
import { toast } from "sonner";

export default function CanApproveToggle({ trainerId, initialValue }: { trainerId: string; initialValue: boolean }) {
  const [enabled, setEnabled] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    const newValue = !enabled;
    try {
      const res = await fetch(`/api/trainers/${trainerId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canApproveClients: newValue }),
      });
      if (res.ok) {
        setEnabled(newValue);
        toast.success(newValue ? "Can now approve clients" : "Permission removed");
      } else {
        toast.error("Failed to update permission.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
          enabled ? "bg-emerald-500" : "bg-muted-foreground/30"
        }`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-[18px]" : "translate-x-0.5"
        }`} />
      </button>
      <span className="text-xs text-muted-foreground">Can approve</span>
    </div>
  );
}
