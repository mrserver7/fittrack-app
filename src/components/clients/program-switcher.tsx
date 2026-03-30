"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardList, CheckCircle } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type Program = {
  id: string; // ClientProgram id
  name: string;
  startDate: string;
  durationWeeks: number;
  weekCount: number;
};

export default function ProgramSwitcher({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState<string | null>(null);

  async function choose(clientProgramId: string) {
    setLoading(clientProgramId);
    try {
      const res = await fetch(`/api/clients/programs/${clientProgramId}/activate`, { method: "POST" });
      if (!res.ok) { toast.error(t.common.somethingWentWrong); return; }
      toast.success(t.schedule.programActivated);
      router.refresh();
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{t.schedule.chooseYourPlan}</h1>
        <p className="text-muted-foreground text-sm">{t.schedule.multipleProgramsSub}</p>
      </div>

      <div className="space-y-3">
        {programs.map((p) => (
          <div key={p.id}
            className="bg-card rounded-2xl border border-border p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {p.durationWeeks} {t.schedule.weekProgram} · {p.weekCount} {p.weekCount !== 1 ? t.schedule.weeksContent : t.schedule.weekContent} · {t.schedule.started} {p.startDate}
              </p>
            </div>
            <button
              disabled={!!loading}
              onClick={() => choose(p.id)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {loading === p.id ? (
                <span className="animate-pulse">{t.schedule.choosing}</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  {t.schedule.choosePlan}
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
