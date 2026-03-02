"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";

type Exercise = {
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

type Day = { dayLabel: string; dayOrder: number; exercises: Exercise[] };
type Week = { weekNumber: number; isDeload: boolean; days: Day[] };

export default function NewProgramPage() {
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [goalTag, setGoalTag] = useState("");
  const [weeks, setWeeks] = useState<Week[]>([
    {
      weekNumber: 1, isDeload: false,
      days: [
        { dayLabel: "Day A", dayOrder: 0, exercises: [] },
        { dayLabel: "Day B", dayOrder: 1, exercises: [] },
        { dayLabel: "Day C", dayOrder: 2, exercises: [] },
      ],
    },
  ]);
  const [exercises, setExercises] = useState<{ id: string; name: string }[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeWeek, setActiveWeek] = useState(0);
  const [activeDay, setActiveDay] = useState(0);
  const router = useRouter();

  const DAY_LABELS = ["Day A", "Day B", "Day C", "Day D", "Day E", "Day F", "Day G"];
  const dayDisplayLabels: Record<string, string> = {
    "Day A": t.programs.dayA,
    "Day B": t.programs.dayB,
    "Day C": t.programs.dayC,
    "Day D": t.programs.dayD ?? "Day D",
    "Day E": t.programs.dayE ?? "Day E",
    "Day F": t.programs.dayF ?? "Day F",
    "Day G": t.programs.dayG ?? "Day G",
  };

  const addDay = () => {
    const updated = [...weeks];
    const currentDays = updated[activeWeek].days;
    if (currentDays.length >= 7) return;
    const nextLabel = DAY_LABELS[currentDays.length];
    updated[activeWeek].days.push({ dayLabel: nextLabel, dayOrder: currentDays.length, exercises: [] });
    setWeeks(updated);
    setActiveDay(updated[activeWeek].days.length - 1);
  };

  const removeDay = (di: number) => {
    const updated = [...weeks];
    if (updated[activeWeek].days.length <= 1) return;
    updated[activeWeek].days.splice(di, 1);
    updated[activeWeek].days.forEach((d, i) => { d.dayOrder = i; });
    setWeeks([...updated]);
    setActiveDay(Math.min(activeDay, updated[activeWeek].days.length - 1));
  };

  const loadExercises = async () => {
    if (exercises.length > 0) return;
    setLoadingExercises(true);
    const res = await fetch("/api/exercises");
    const data = await res.json();
    setExercises(data.exercises || []);
    setLoadingExercises(false);
  };

  const addExercise = () => {
    const updated = [...weeks];
    updated[activeWeek].days[activeDay].exercises.push({
      exerciseId: "", exerciseName: "", sets: 3, repsMin: 8, repsMax: 12,
      restSeconds: 60, rpeMin: 7, rpeMax: 8, tempo: "", coachingNote: "",
    });
    setWeeks(updated);
  };

  const updateExercise = (exIdx: number, field: keyof Exercise, value: string | number) => {
    const updated = [...weeks];
    (updated[activeWeek].days[activeDay].exercises[exIdx] as Record<string, unknown>)[field] = value;
    if (field === "exerciseId") {
      const ex = exercises.find((e) => e.id === value);
      if (ex) updated[activeWeek].days[activeDay].exercises[exIdx].exerciseName = ex.name;
    }
    setWeeks(updated);
  };

  const removeExercise = (exIdx: number) => {
    const updated = [...weeks];
    updated[activeWeek].days[activeDay].exercises.splice(exIdx, 1);
    setWeeks(updated);
  };

  const addWeek = () => {
    setWeeks([...weeks, {
      weekNumber: weeks.length + 1, isDeload: false,
      days: [
        { dayLabel: "Day A", dayOrder: 0, exercises: [] },
        { dayLabel: "Day B", dayOrder: 1, exercises: [] },
        { dayLabel: "Day C", dayOrder: 2, exercises: [] },
      ],
    }]);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error(t.programs.programNameRequired); return; }

    // Validate at least one exercise exists across all weeks/days
    const hasAnyExercise = weeks.some((w) =>
      w.days.some((d) => d.exercises.some((ex) => ex.exerciseId))
    );
    if (!hasAnyExercise) {
      toast.error("A program must have at least one exercise in at least one day.");
      return;
    }

    setLoading(true);
    const cleanedWeeks = weeks.map((w) => ({
      ...w,
      days: w.days.map((d) => ({
        ...d,
        exercises: d.exercises.filter((ex) => ex.exerciseId),
      })),
    }));
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, durationWeeks, goalTag, weeks: cleanedWeeks }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      toast.success(t.programs.programCreated);
      router.push(`/programs/${data.program.id}`);
    } else {
      toast.error(t.programs.failedCreate);
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const currentDay = weeks[activeWeek]?.days[activeDay];

  const exerciseFields = [
    { label: t.programs.setsLabel, field: "sets" as const, type: "number", min: 1, max: 20 },
    { label: t.programs.repsMinLabel, field: "repsMin" as const, type: "number", min: 1, max: 100 },
    { label: t.programs.repsMaxLabel, field: "repsMax" as const, type: "number", min: 1, max: 100 },
    { label: t.programs.restSecLabel, field: "restSeconds" as const, type: "number", min: 0, max: 600 },
    { label: t.programs.rpeMinLabel, field: "rpeMin" as const, type: "number", min: 1, max: 10 },
    { label: t.programs.rpeMaxLabel, field: "rpeMax" as const, type: "number", min: 1, max: 10 },
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/programs">
          <button className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.programs.newProgram}</h1>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Program Meta */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="font-semibold text-sm text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-4">{t.programs.programDetails}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.programs.programNameLabel}</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder={t.programs.programNamePlaceholder} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.programs.durationLabel}</label>
              <input type="number" min={1} max={52} value={durationWeeks} onChange={(e) => setDurationWeeks(+e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.programs.goalTagLabel}</label>
              <select value={goalTag} onChange={(e) => setGoalTag(e.target.value)} className={inputClass}>
                <option value="">{t.programs.selectGoal}</option>
                <option value="strength">strength</option>
                <option value="hypertrophy">hypertrophy</option>
                <option value="fat-loss">fat-loss</option>
                <option value="endurance">endurance</option>
                <option value="mobility">mobility</option>
                <option value="general">general</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t.programs.descriptionLabel}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                placeholder={t.programs.descriptionPlaceholder} className={`${inputClass} resize-none`} />
            </div>
          </div>
        </div>

        {/* Week/Day Builder */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
            <div className="flex gap-1.5 overflow-x-auto">
              {weeks.map((w, wi) => (
                <button key={wi} type="button" onClick={() => { setActiveWeek(wi); setActiveDay(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeWeek === wi ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900" : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300"}`}>
                  {t.programs.weekLabel} {w.weekNumber} {w.isDeload ? "🔄" : ""}
                </button>
              ))}
            </div>
            <button type="button" onClick={addWeek}
              className="p-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-400 transition-colors ml-1">
              <Plus className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <label className="flex items-center gap-2 ml-auto text-xs text-gray-500 dark:text-gray-400 cursor-pointer whitespace-nowrap">
              <input type="checkbox" checked={weeks[activeWeek]?.isDeload || false}
                onChange={(e) => {
                  const updated = [...weeks];
                  updated[activeWeek].isDeload = e.target.checked;
                  setWeeks(updated);
                }} className="accent-emerald-600" />
              {t.programs.deloadWeek}
            </label>
          </div>

          {/* Day tabs */}
          <div className="flex items-stretch border-b border-gray-100 dark:border-gray-800 overflow-x-auto">
            {weeks[activeWeek]?.days.map((d, di) => (
              <div key={di} className="flex items-stretch flex-shrink-0">
                <button type="button" onClick={() => setActiveDay(di)}
                  className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${activeDay === di ? "text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-500" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}>
                  {dayDisplayLabels[d.dayLabel] || d.dayLabel}
                </button>
                {weeks[activeWeek].days.length > 1 && (
                  <button type="button" onClick={() => removeDay(di)}
                    className="px-1 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors text-xs pb-0.5">
                    ✕
                  </button>
                )}
              </div>
            ))}
            {weeks[activeWeek]?.days.length < 7 && (
              <button type="button" onClick={addDay}
                className="px-3 py-2.5 text-xs text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap flex items-center gap-1 border-l border-gray-100 dark:border-gray-800">
                <Plus className="w-3 h-3" /> Day
              </button>
            )}
          </div>

          {/* Exercises */}
          <div className="p-5">
            {currentDay?.exercises.length === 0 && (
              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">{t.programs.noExercises}</p>
            )}
            <div className="space-y-4">
              {currentDay?.exercises.map((ex, exIdx) => (
                <div key={exIdx} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.programs.exerciseLabel}</label>
                      <select value={ex.exerciseId} onFocus={loadExercises}
                        onChange={(e) => updateExercise(exIdx, "exerciseId", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                        <option value="">— {loadingExercises ? t.programs.loadingExercises : t.programs.selectExercise} —</option>
                        {exercises.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
                    {exerciseFields.map((f) => (
                      <div key={f.field}>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{f.label}</label>
                        <input type={f.type} min={f.min} max={f.max} value={(ex as Record<string, unknown>)[f.field] as number}
                          onChange={(e) => updateExercise(exIdx, f.field, +e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                    ))}
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.programs.tempoLabel}</label>
                      <input value={ex.tempo} onChange={(e) => updateExercise(exIdx, "tempo", e.target.value)}
                        placeholder="3-1-1-0" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.programs.coachingNoteLabel}</label>
                    <input value={ex.coachingNote} onChange={(e) => updateExercise(exIdx, "coachingNote", e.target.value)}
                      placeholder={t.programs.coachingNotePlaceholder} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div className="flex justify-end mt-3">
                    <button type="button" onClick={() => removeExercise(exIdx)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addExercise}
              className="mt-4 w-full py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> {t.programs.addExercise}
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/programs">
            <button type="button" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">{t.common.cancel}</button>
          </Link>
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60">
            {loading ? t.programs.saving : t.programs.createProgram}
          </button>
        </div>
      </form>
    </div>
  );
}
