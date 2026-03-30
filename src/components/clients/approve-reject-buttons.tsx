"use client";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

type TrainerOption = { id: string; name: string; businessName: string | null };

interface Props {
  clientId: string;
  clientTrainerId?: string | null;
  trainers?: TrainerOption[];
}

export default function ApproveRejectButtons({ clientId, clientTrainerId, trainers }: Props) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState("");
  const router = useRouter();

  const approve = async () => {
    if (trainers && !clientTrainerId && !selectedTrainerId) {
      toast.error("Please select a trainer before approving.");
      return;
    }
    setLoading("approve");
    const body: Record<string, string> = {};
    if (selectedTrainerId) body.trainerId = selectedTrainerId;
    const res = await fetch(`/api/clients/${clientId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(null);
    if (res.ok) {
      toast.success("Subscriber approved!");
      router.refresh();
    } else {
      toast.error("Something went wrong.");
    }
  };

  const reject = async () => {
    setLoading("reject");
    const res = await fetch(`/api/clients/${clientId}/reject`, { method: "POST" });
    setLoading(null);
    if (res.ok) {
      toast.success("Request rejected.");
      router.refresh();
    } else {
      toast.error("Something went wrong.");
    }
  };

  return (
    <div className="flex flex-col gap-2 flex-shrink-0">
      {trainers && (
        <select
          value={selectedTrainerId}
          onChange={(e) => setSelectedTrainerId(e.target.value)}
          className="text-xs border border-border rounded-lg px-2 py-1.5 bg-card text-foreground w-full"
        >
          <option value="">{clientTrainerId ? "-- Keep current --" : "-- Select trainer --"}</option>
          {trainers.map((tr) => (
            <option key={tr.id} value={tr.id}>
              {tr.name}{tr.businessName ? ` · ${tr.businessName}` : ""}
            </option>
          ))}
        </select>
      )}
      <div className="flex gap-2">
        <button
          onClick={reject}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50">
          <XCircle className="w-3.5 h-3.5" />
          {loading === "reject" ? "..." : "Reject"}
        </button>
        <button
          onClick={approve}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50">
          <CheckCircle className="w-3.5 h-3.5" />
          {loading === "approve" ? "..." : "Approve"}
        </button>
      </div>
    </div>
  );
}
