"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, AlertTriangle } from "lucide-react";

export default function DeleteProgramButton({
  programId,
  programName,
  activeClientCount,
}: {
  programId: string;
  programName: string;
  activeClientCount: number;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/programs/${programId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Program deleted.");
        router.push("/programs");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete program.");
        setShowConfirm(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="flex items-center gap-2 px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium hover:bg-red-50 dark:hover:bg-red-950 transition-colors flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" /> Delete
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-gray-900 dark:text-gray-50 mb-3">
              Delete &ldquo;{programName}&rdquo;?
            </h2>

            {activeClientCount > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  This program is currently assigned to{" "}
                  <span className="font-semibold">
                    {activeClientCount} active client{activeClientCount !== 1 ? "s" : ""}
                  </span>
                  . They will lose access to it immediately.
                </p>
              </div>
            )}

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
