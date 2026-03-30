"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function DeleteClientButton({ clientId, clientName, redirectTo = "/clients" }: { clientId: string; clientName: string; redirectTo?: string }) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Client deleted.");
        router.push(redirectTo);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete client.");
        setShowConfirm(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
        <Trash2 className="w-4 h-4" /> Delete Client
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-2">Delete {clientName}?</h2>
            <p className="text-sm text-muted-foreground mb-5">
              This will archive the client and hide them from your client list. This action cannot be easily undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm hover:bg-muted/60 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60 transition-colors">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
