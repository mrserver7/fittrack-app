"use client";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ApproveRejectButtons({ clientId }: { clientId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();

  const action = async (type: "approve" | "reject") => {
    setLoading(type);
    const res = await fetch(`/api/clients/${clientId}/${type}`, { method: "POST" });
    setLoading(null);
    if (res.ok) {
      toast.success(type === "approve" ? "Subscriber approved!" : "Request rejected.");
      router.refresh();
    } else {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={() => action("reject")}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-2 border border-red-200 text-red-600 rounded-xl text-xs font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
        <XCircle className="w-3.5 h-3.5" />
        {loading === "reject" ? "..." : "Reject"}
      </button>
      <button
        onClick={() => action("approve")}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">
        <CheckCircle className="w-3.5 h-3.5" />
        {loading === "approve" ? "..." : "Approve"}
      </button>
    </div>
  );
}
