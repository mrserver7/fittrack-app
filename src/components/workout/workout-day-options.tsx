"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, X } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type Props = {
  workoutDayId: string;
  weekStartDate: string;
  originalDay: string;
  availableDays: string[];
  /** The weekday this workout is currently scheduled for (after overrides). Defaults to originalDay. */
  scheduledDay?: string;
};

export default function WorkoutDayOptions({ workoutDayId, weekStartDate, originalDay, availableDays, scheduledDay }: Props) {
  const router = useRouter();
  const { t } = useLanguage();
  const displayDay = scheduledDay ?? originalDay;
  const [open, setOpen] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [pendingDay, setPendingDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Translate day names using programs section keys
  const dayKeys: Record<string, keyof typeof t.programs> = {
    Sunday: "sunday", Monday: "monday", Tuesday: "tuesday",
    Wednesday: "wednesday", Thursday: "thursday", Friday: "friday", Saturday: "saturday",
  };
  const tDay = (day: string): string => (t.programs[dayKeys[day]] ?? day) as string;

  function reset() { setOpen(false); setMoveMode(false); setPendingDay(null); }

  async function submitOverride(action: "skipped" | "moved", newDay?: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/workout/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutDayId, weekStartDate, originalDay, action, newDay }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || t.common.somethingWentWrong);
        return;
      }
      toast.success(
        action === "skipped"
          ? t.workout.workoutSkipped
          : `${t.workout.workoutMovedTo} ${newDay ? tDay(newDay) : ""}.`
      );
      router.refresh();
    } catch {
      toast.error(t.common.networkError);
    } finally {
      setLoading(false);
      reset();
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => { setOpen((v) => !v); setMoveMode(false); setPendingDay(null); }}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-medium transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
        {t.workout.options}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 z-30 mb-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tDay(displayDay)}</span>
            <button onClick={reset} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {!moveMode && !pendingDay && (
            <div className="space-y-1">
              <button
                disabled={loading}
                onClick={() => submitOverride("skipped")}
                className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left disabled:opacity-60"
              >
                <span className="text-base mt-0.5">😴</span>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{t.workout.skipWorkout}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.workout.markAsRest}</p>
                </div>
              </button>

              {availableDays.length > 0 && (
                <button
                  onClick={() => setMoveMode(true)}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span className="text-base mt-0.5">📅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{t.workout.moveToAnotherDay}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.workout.trainerWillBeNotified}</p>
                  </div>
                </button>
              )}
            </div>
          )}

          {moveMode && !pendingDay && (
            <div>
              <button onClick={() => setMoveMode(false)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-2 px-1 transition-colors">
                {t.workout.backBtn}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 px-1">{t.workout.moveTo}</p>
              <div className="flex flex-wrap gap-2 px-1">
                {availableDays.map((day) => (
                  <button
                    key={day}
                    onClick={() => setPendingDay(day)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    {tDay(day)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {pendingDay && (
            <div className="px-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                {t.workout.moveToAnotherDay}:{" "}
                <strong>{tDay(displayDay)}</strong> → <strong>{tDay(pendingDay)}</strong>?{" "}
                {t.workout.trainerWillBeNotified}.
              </p>
              <div className="flex gap-2">
                <button
                  disabled={loading}
                  onClick={() => submitOverride("moved", pendingDay)}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {loading ? t.workout.moving : t.workout.confirm}
                </button>
                <button
                  onClick={() => setPendingDay(null)}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t.common.cancel}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
