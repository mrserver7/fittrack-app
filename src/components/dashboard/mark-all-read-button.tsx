"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MarkAllReadButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const markAll = async () => {
    setLoading(true);
    const res = await fetch("/api/notifications", { method: "PATCH" });
    setLoading(false);
    if (res.ok) {
      toast.success("All notifications cleared.");
      router.refresh();
    }
  };

  return (
    <button
      onClick={markAll}
      disabled={loading}
      className="text-xs text-orange-500 hover:text-orange-700 font-medium mt-1 disabled:opacity-50"
    >
      {loading ? "Clearing…" : "Mark all read"}
    </button>
  );
}
