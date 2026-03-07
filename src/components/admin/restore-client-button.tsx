"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

export default function RestoreClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function restore() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/restore`, { method: "PATCH" });
      if (!res.ok) { toast.error("Failed to restore client."); return; }
      toast.success("Client restored to pending.");
      router.refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={restore}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors disabled:opacity-50"
    >
      <RotateCcw className="w-3.5 h-3.5" />
      {loading ? "Restoring…" : "Restore"}
    </button>
  );
}
