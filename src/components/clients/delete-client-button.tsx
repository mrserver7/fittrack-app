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
        className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors">
        <Trash2 className="w-4 h-4" /> Delete Client
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 dark:text-gray-50 mb-2">Delete {clientName}?</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This will archive the client and hide them from your client list. This action cannot be easily undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
