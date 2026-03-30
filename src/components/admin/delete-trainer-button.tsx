"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, UserX } from "lucide-react";

interface Props {
  trainerId: string;
  trainerName: string;
  clientCount: number;
}

export default function DeleteTrainerButton({ trainerId, trainerName, clientCount }: Props) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trainers/${trainerId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${trainerName} has been removed.`);
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to remove trainer.");
        setShowConfirm(false);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
      >
        <UserX className="w-3.5 h-3.5" />
        Remove
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="font-bold text-foreground text-center mb-1">Remove {trainerName}?</h2>
            <p className="text-sm text-muted-foreground text-center mb-2">
              This trainer will be deactivated and can no longer log in.
            </p>
            {clientCount > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 text-center mb-4">
                ⚠️ This trainer has {clientCount} active subscriber{clientCount !== 1 ? "s" : ""}. Their data will be preserved.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm hover:bg-muted/60 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors"
              >
                {loading ? "Removing..." : "Remove Trainer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
