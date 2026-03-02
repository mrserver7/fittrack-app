"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

export default function ApproveTrainerButton({ trainerId }: { trainerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const approve = async () => {
    setLoading(true);
    const res = await fetch(`/api/trainers/${trainerId}/approve`, { method: "PATCH" });
    setLoading(false);
    if (res.ok) {
      toast.success("Trainer approved!");
      router.refresh();
    } else {
      toast.error("Failed to approve trainer.");
    }
  };

  return (
    <button onClick={approve} disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60">
      <CheckCircle className="w-3.5 h-3.5" />
      {loading ? "Approving..." : "Approve"}
    </button>
  );
}
