"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquare } from "lucide-react";

export default function TrainerCheckinReview({
  checkinId,
  clientId,
  existingComment,
}: {
  checkinId: string;
  clientId: string;
  existingComment: string;
}) {
  const router = useRouter();
  const [comment, setComment] = useState(existingComment);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/checkins/${checkinId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainerComment: comment }),
      });
      if (!res.ok) { toast.error("Failed to save comment."); return; }
      toast.success("Comment saved.");
      router.refresh();
    } catch {
      toast.error("Network error.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-emerald-600" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Your Comment</h3>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        placeholder="Write feedback for the client…"
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
      />
      <div className="flex justify-end gap-3 mt-3">
        <button
          onClick={() => { setComment(existingComment); }}
          className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Comment"}
        </button>
      </div>
    </div>
  );
}
