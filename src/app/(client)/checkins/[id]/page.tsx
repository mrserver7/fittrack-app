"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

type Question = { id: string; type: string; label: string; required: boolean };

export default function CheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const [checkIn, setCheckIn] = useState<{ checkInForm: { name: string; questions: string }; status: string } | null>(null);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/checkins/${id}`).then(r => r.json()).then(d => {
      setCheckIn(d.checkIn);
      setLoading(false);
    });
  }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch(`/api/checkins/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ responses }),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success(t.checkins.submitted);
      router.push("/checkins");
    } else {
      toast.error(t.checkins.failed);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 dark:text-gray-500">{t.checkins.loading}</div>;
  if (!checkIn) return <div className="p-8 text-center text-red-500">{t.checkins.notFound}</div>;
  if (checkIn.status === "completed") {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center py-20">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">{t.checkins.alreadySubmitted}</h2>
      </div>
    );
  }

  const questions: Question[] = JSON.parse(checkIn.checkInForm.questions || "[]");

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{checkIn.checkInForm.name}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.checkins.completeWeekly}</p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {questions.map((q) => (
          <div key={q.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <label className="block font-medium text-gray-900 dark:text-gray-50 mb-3">
              {q.label}
              {q.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {(q.type === "scale_1_5" || q.type === "scale_1_10") && (
              <div className="flex gap-2 flex-wrap">
                {Array.from({ length: q.type === "scale_1_5" ? 5 : 10 }, (_, i) => i + 1).map((v) => (
                  <button key={v} type="button" onClick={() => setResponses((r) => ({ ...r, [q.id]: v.toString() }))}
                    className={`w-12 h-12 rounded-xl font-bold text-sm transition-colors ${responses[q.id] === v.toString() ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                    {v}
                  </button>
                ))}
              </div>
            )}
            {q.type === "number" && (
              <input type="number" value={responses[q.id] || ""} onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))}
                required={q.required} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            )}
            {(q.type === "short_text" || q.type === "long_text") && (
              <textarea rows={q.type === "long_text" ? 4 : 2} value={responses[q.id] || ""}
                onChange={(e) => setResponses((r) => ({ ...r, [q.id]: e.target.value }))}
                required={q.required} className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
            )}
          </div>
        ))}

        <button type="submit" disabled={submitting}
          className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60">
          {submitting ? t.checkins.submitting : t.checkins.submit}
        </button>
      </form>
    </div>
  );
}
