"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    try {
      const res = await fetch("/api/settings/account", { method: "DELETE" });
      if (res.ok) {
        toast.success("Account deleted. Goodbye!");
        await signOut({ callbackUrl: "/login" });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete account.");
        setShowConfirm(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
        <Trash2 className="w-4 h-4" /> Delete Account
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConfirm(false)}>
          <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-foreground mb-2">Delete your account?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently archive your account and all your data. You will be signed out immediately.
            </p>
            <p className="text-sm font-medium text-foreground mb-2">
              Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                className="flex-1 py-2.5 border border-border text-foreground rounded-xl text-sm hover:bg-muted/60">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting || confirmText !== "DELETE"}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {deleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
