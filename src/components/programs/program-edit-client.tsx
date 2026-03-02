"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, Save, X } from "lucide-react";
import ExerciseSelect from "@/components/programs/exercise-select";

type ExerciseOption = { id: string; name: string };

type ExerciseState = {
  id?: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds: number;
  rpeMin: number;
  rpeMax: number;
  tempo: string;
  coachingNote: string;
};

type DayState = {
  id: string;       // "" for newly added days (not yet in DB)
  weekId: string;   // parent week ID — needed when creating new days
  dayLabel: string;
  exercises: ExerciseState[];
};

type WeekState = {
  id: string;
  weekNumber: number;
  isDeload: boolean;
  days: DayState[];
};

type ProgramData = {
  id: string;
  name: string;
  weeks: Array<{
    id: string;
    weekNumber: number;
    isDeload: boolean;
    days: Array<{
      id: string;
      dayLabel: string;
      dayOrder: number;
      exercises: Array<{
        id: string;
        exerciseId: string;
        sets: number;
        repsMin: number | null;
        repsMax: number | null;
        restSeconds: number;
        rpeMin: number | null;
        rpeMax: number | null;
        tempo: string | null;
        coachingNote: string | null;
        exercise: { id: string; name: string };
      }>;
    }>;
  }>;
};

const DAY_LABELS = ["Day A", "Day B", "Day C", "Day D", "Day E", "Day F", "Day G"];

const exerciseFields: { label: string; field: keyof ExerciseState; min: number; max: number }[] = [
  { label: "Sets", field: "sets", min: 1, max: 20 },
  { label: "Reps Min", field: "repsMin", min: 1, max: 100 },
  { label: "Reps Max", field: "repsMax", min: 1, max: 100 },
  { label: "Rest (s)", field: "restSeconds", min: 0, max: 600 },
  { label: "RPE Min", field: "rpeMin", min: 1, max: 10 },
  { label: "RPE Max", field: "rpeMax", min: 1, max: 10 },
];

export default function ProgramEditClient({
  program,
  exercises,
}: {
  program: ProgramData;
  exercises: ExerciseOption[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);

  const [weeks, setWeeks] = useState<WeekState[]>(() =>
    program.weeks.map((w) => ({
      id: w.id,
      weekNumber: w.weekNumber,
      isDeload: w.isDeload,
      days: w.days.map((d) => ({
        id: d.id,
        weekId: w.id,
        dayLabel: d.dayLabel,
        exercises: d.exercises.map((ex) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          exerciseName: ex.exercise.name,
          sets: ex.sets,
          repsMin: ex.repsMin ?? 8,
          repsMax: ex.repsMax ?? 12,
          restSeconds: ex.restSeconds,
          rpeMin: ex.rpeMin ?? 7,
          rpeMax: ex.rpeMax ?? 8,
          tempo: ex.tempo ?? "",
          coachingNote: ex.coachingNote ?? "",
        })),
      })),
    }))
  );

  const currentDay = weeks[activeWeek]?.days[activeDay];

  const addDay = () => {
    setWeeks((prev) =>
      prev.map((w, wi) => {
        if (wi !== activeWeek || w.days.length >= 7) return w;
        const nextLabel = DAY_LABELS[w.days.length] ?? `Day ${w.days.length + 1}`;
        return {
          ...w,
          days: [...w.days, { id: "", weekId: w.id, dayLabel: nextLabel, exercises: [] }],
        };
      })
    );
    setActiveDay(weeks[activeWeek].days.length); // switch to the new day
  };

  const removeDay = (di: number) => {
    setWeeks((prev) =>
      prev.map((w, wi) => {
        if (wi !== activeWeek || w.days.length <= 1) return w;
        return { ...w, days: w.days.filter((_, i) => i !== di) };
      })
    );
    setActiveDay((prev) => Math.min(prev, weeks[activeWeek].days.length - 2));
  };

  const updateExercise = (exIdx: number, field: keyof ExerciseState, value: string | number) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== activeWeek ? w : {
          ...w,
          days: w.days.map((d, di) =>
            di !== activeDay ? d : {
              ...d,
              exercises: d.exercises.map((ex, ei) =>
                ei !== exIdx ? ex : { ...ex, [field]: value }
              ),
            }
          ),
        }
      )
    );
  };

  const addExercise = () => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== activeWeek ? w : {
          ...w,
          days: w.days.map((d, di) =>
            di !== activeDay ? d : {
              ...d,
              exercises: [
                ...d.exercises,
                { exerciseId: "", exerciseName: "", sets: 3, repsMin: 8, repsMax: 12, restSeconds: 60, rpeMin: 7, rpeMax: 8, tempo: "", coachingNote: "" },
              ],
            }
          ),
        }
      )
    );
  };

  const removeExercise = (exIdx: number) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== activeWeek ? w : {
          ...w,
          days: w.days.map((d, di) =>
            di !== activeDay ? d : {
              ...d,
              exercises: d.exercises.filter((_, ei) => ei !== exIdx),
            }
          ),
        }
      )
    );
  };

  const save = async () => {
    for (const w of weeks) {
      for (const d of w.days) {
        for (const ex of d.exercises) {
          if (!ex.exerciseId) {
            toast.error("Please select an exercise for all rows, or remove empty ones.");
            return;
          }
        }
      }
    }

    setSaving(true);

    // Build the days payload — new days have id: ""
    const days = weeks.flatMap((w) =>
      w.days.map((d) => ({
        dayId: d.id || undefined,        // undefined = new day
        weekId: d.weekId,               // needed for new days
        dayLabel: d.dayLabel,           // needed for new days
        exercises: d.exercises.map((ex) => ({
          id: ex.id,
          exerciseId: ex.exerciseId,
          sets: ex.sets,
          repsMin: ex.repsMin,
          repsMax: ex.repsMax,
          restSeconds: ex.restSeconds,
          rpeMin: ex.rpeMin,
          rpeMax: ex.rpeMax,
          tempo: ex.tempo || null,
          coachingNote: ex.coachingNote || null,
        })),
      }))
    );

    // Also send which existing day IDs to keep (so the API can delete removed ones)
    const keptDayIds = weeks.flatMap((w) => w.days.filter((d) => d.id).map((d) => d.id));

    const res = await fetch(`/api/programs/${program.id}/exercises`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days, keptDayIds }),
    });

    setSaving(false);
    if (res.ok) {
      toast.success("Program saved!");
      router.push(`/programs/${program.id}`);
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Failed to save changes.");
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href={`/programs/${program.id}`}>
            <button className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{program.name}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500">Edit exercises per day</p>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Week tabs */}
        <div className="flex gap-2 p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 overflow-x-auto">
          {weeks.map((w, wi) => (
            <button
              key={wi}
              type="button"
              onClick={() => { setActiveWeek(wi); setActiveDay(0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeWeek === wi
                  ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                  : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300"
              }`}
            >
              Week {w.weekNumber}{w.isDeload ? " 🔄" : ""}
            </button>
          ))}
        </div>

        {/* Day tabs + add day button */}
        <div className="flex items-stretch border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
          {weeks[activeWeek]?.days.map((d, di) => (
            <div key={di} className="flex items-stretch flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveDay(di)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeDay === di
                    ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                }`}
              >
                {d.dayLabel}
                {!d.id && <span className="ml-1 text-xs text-emerald-500">•</span>}
              </button>
              {weeks[activeWeek].days.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDay(di)}
                  className="pr-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Remove day"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          {(weeks[activeWeek]?.days.length ?? 0) < 7 && (
            <button
              type="button"
              onClick={addDay}
              className="px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-1 border-l border-gray-100 dark:border-gray-800 flex-shrink-0"
            >
              <Plus className="w-3 h-3" /> Day
            </button>
          )}
        </div>

        {/* Exercises */}
        <div className="p-5">
          {currentDay?.exercises.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
              No exercises yet — add one below.
            </p>
          )}
          <div className="space-y-4">
            {currentDay?.exercises.map((ex, exIdx) => (
              <div key={exIdx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold text-gray-400 w-5">{exIdx + 1}</span>
                  <div className="flex-1">
                    <ExerciseSelect
                      value={ex.exerciseId}
                      exercises={exercises}
                      onChange={(id, name) => {
                        updateExercise(exIdx, "exerciseId", id);
                        updateExercise(exIdx, "exerciseName", name);
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeExercise(exIdx)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {exerciseFields.map((f) => (
                    <div key={f.field}>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                      <input
                        type="number"
                        min={f.min}
                        max={f.max}
                        value={(ex as Record<string, unknown>)[f.field] as number}
                        onChange={(e) => updateExercise(exIdx, f.field, +e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tempo</label>
                    <input
                      value={ex.tempo}
                      onChange={(e) => updateExercise(exIdx, "tempo", e.target.value)}
                      placeholder="3-1-1-0"
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Coaching Note</label>
                  <input
                    value={ex.coachingNote}
                    onChange={(e) => updateExercise(exIdx, "coachingNote", e.target.value)}
                    placeholder="Tips for the client…"
                    className="w-full px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addExercise}
            className="mt-4 w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Exercise
          </button>
        </div>
      </div>
    </div>
  );
}
