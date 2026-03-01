"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { computeReadinessScore } from "@/lib/utils";
import { CheckCircle, AlertTriangle, Timer, Zap } from "lucide-react";

type Exercise = {
  id: string; name: string; category: string; bodyRegions?: string | null;
};
type WorkoutExercise = {
  id: string; exerciseId: string; exercise: Exercise; sets: number;
  repsMin?: number | null; repsMax?: number | null; tempo?: string | null;
  restSeconds: number; rpeMin?: number | null; rpeMax?: number | null;
  coachingNote?: string | null; substitutionExercise?: Exercise | null;
};
type WorkoutDay = {
  id: string; dayLabel: string; weekNumber: number;
  exercises: WorkoutExercise[];
};

type SetEntry = { weightKg: string; repsActual: string; rpeActual: string; notes: string; saved: boolean };

export default function WorkoutLogger({
  clientId, workoutDay, programName, existingSession, clientProgramId,
}: {
  clientId: string;
  workoutDay: WorkoutDay;
  programName: string;
  existingSession: Record<string, unknown> | null;
  clientProgramId: string;
}) {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(
    (existingSession?.id as string) || null
  );

  // Readiness
  const [showReadiness, setShowReadiness] = useState(!existingSession);
  const [readiness, setReadiness] = useState({ sleep: 3, soreness: 3, motivation: 3 });

  // Sets state: { [workoutExerciseId]: SetEntry[] }
  const initialSets: Record<string, SetEntry[]> = {};
  workoutDay.exercises.forEach((ex) => {
    initialSets[ex.id] = Array.from({ length: ex.sets }, () => ({
      weightKg: "", repsActual: ex.repsMin?.toString() || "", rpeActual: ex.rpeMin?.toString() || "", notes: "", saved: false,
    }));
  });
  const [sets, setSets] = useState(initialSets);
  const [activeExercise, setActiveExercise] = useState(0);
  const [restTimer, setRestTimer] = useState(0);
  const [painFlags, setPainFlags] = useState<{ bodyRegion: string; severity: number }[]>([]);
  const [showPainModal, setShowPainModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [feedback, setFeedback] = useState({ emoji: "", text: "" });
  const [completing, setCompleting] = useState(false);
  const [startedAt] = useState(Date.now());

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer > 0) {
      interval = setInterval(() => setRestTimer((t) => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const startSession = async (): Promise<string | null> => {
    if (sessionId) return sessionId;
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId, workoutDayId: workoutDay.id, clientProgramId,
        scheduledDate: new Date().toISOString().split("T")[0],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSessionId(data.session.id);
      return data.session.id as string;
    } else {
      toast.error("Failed to start session.");
      return null;
    }
  };

  const saveSet = async (exId: string, setIdx: number) => {
    const activeSessionId = sessionId || await startSession();
    if (!activeSessionId) return;
    const ex = workoutDay.exercises.find((e) => e.id === exId)!;
    const entry = sets[exId][setIdx];

    const res = await fetch(`/api/sessions/${activeSessionId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId: ex.exerciseId,
        workoutExerciseId: exId,
        setNumber: setIdx + 1,
        weightKg: entry.weightKg || null,
        repsActual: entry.repsActual || null,
        rpeActual: entry.rpeActual || null,
        notes: entry.notes || null,
        clientId,
      }),
    });

    if (res.ok) {
      setSets((prev) => ({
        ...prev,
        [exId]: prev[exId].map((s, i) => i === setIdx ? { ...s, saved: true } : s),
      }));
      setRestTimer(ex.restSeconds);
      toast.success(`Set ${setIdx + 1} saved!`);
    } else {
      toast.error("Failed to save set.");
    }
  };

  const flagPain = async (bodyRegion: string, severity: number) => {
    if (!sessionId) return;
    const res = await fetch(`/api/sessions/${sessionId}/pain-flags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bodyRegion, severity }),
    });
    if (res.ok) {
      setPainFlags((prev) => [...prev, { bodyRegion, severity }]);
      toast.warning(`Pain flag recorded for ${bodyRegion}.`);
      if (severity >= 3) toast.error("Trainer notified about significant discomfort.");
    }
    setShowPainModal(false);
  };

  const finishSession = async () => {
    if (!sessionId) return;
    setCompleting(true);
    const res = await fetch(`/api/sessions/${sessionId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        readinessSleep: readiness.sleep,
        readinessSoreness: readiness.soreness,
        readinessMotivation: readiness.motivation,
        overallFeedbackEmoji: feedback.emoji,
        overallFeedbackText: feedback.text,
      }),
    });
    setCompleting(false);
    if (res.ok) {
      toast.success("Session complete! Great work! 🎉");
      router.push("/home");
    } else {
      toast.error("Failed to complete session.");
    }
  };

  const readinessScore = computeReadinessScore(readiness.sleep, readiness.soreness, readiness.motivation);
  const currentEx = workoutDay.exercises[activeExercise];

  // Readiness gate
  if (showReadiness) {
    return (
      <div className="p-6 md:p-8 max-w-xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Before you start</h1>
          <p className="text-gray-500 text-sm mb-6">How are you feeling today?</p>
          {[
            { key: "sleep" as const, label: "Sleep Quality", emoji: "😴" },
            { key: "soreness" as const, label: "Soreness (1=low, 5=high)", emoji: "💪" },
            { key: "motivation" as const, label: "Motivation", emoji: "🔥" },
          ].map((item) => (
            <div key={item.key} className="mb-5">
              <label className="text-sm font-medium text-gray-700 block mb-2">{item.emoji} {item.label}</label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((v) => (
                  <button key={v} onClick={() => setReadiness((r) => ({ ...r, [item.key]: v }))}
                    className={`w-10 h-10 rounded-xl font-bold text-sm transition-colors ${readiness[item.key] === v ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="p-4 bg-emerald-50 rounded-xl mb-6">
            <p className="text-sm text-emerald-700 font-medium">Readiness Score: <strong>{readinessScore}/10</strong></p>
            <p className="text-xs text-emerald-600 mt-0.5">
              {readinessScore >= 8 ? "You're ready to crush it! 💪" : readinessScore >= 5 ? "Good to go!" : "Consider a lighter session today."}
            </p>
          </div>
          <button onClick={() => { setShowReadiness(false); startSession(); }}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-colors">
            Start Workout →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400">{programName}</p>
          <h1 className="font-bold text-gray-900">{workoutDay.dayLabel} · Week {workoutDay.weekNumber}</h1>
        </div>
        <div className="flex items-center gap-3">
          {restTimer > 0 && (
            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm font-medium">
              <Timer className="w-3.5 h-3.5" />
              {restTimer}s
            </div>
          )}
          <button onClick={() => setShowPainModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5" /> Pain
          </button>
          <button onClick={() => setShowFinishModal(true)}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors">
            Finish
          </button>
        </div>
      </div>

      {/* Exercise tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {workoutDay.exercises.map((ex, idx) => {
          const savedSets = sets[ex.id]?.filter((s) => s.saved).length || 0;
          return (
            <button key={ex.id} onClick={() => setActiveExercise(idx)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-colors ${activeExercise === idx ? "bg-emerald-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-emerald-300"}`}>
              {savedSets === ex.sets ? <CheckCircle className="w-3 h-3" /> : null}
              {ex.exercise.name}
              <span className={`text-xs ${activeExercise === idx ? "text-emerald-200" : "text-gray-400"}`}>
                {savedSets}/{ex.sets}
              </span>
            </button>
          );
        })}
      </div>

      {/* Current Exercise */}
      {currentEx && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">{currentEx.exercise.name}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {currentEx.sets} sets · {currentEx.repsMin}
              {currentEx.repsMax && currentEx.repsMax !== currentEx.repsMin ? `–${currentEx.repsMax}` : ""} reps
              {currentEx.rpeMin ? ` · RPE ${currentEx.rpeMin}–${currentEx.rpeMax}` : ""}
              {currentEx.tempo ? ` · ${currentEx.tempo} tempo` : ""}
              · {currentEx.restSeconds}s rest
            </p>
            {currentEx.coachingNote && (
              <p className="text-xs text-blue-600 mt-1.5 flex items-start gap-1.5">
                <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" /> {currentEx.coachingNote}
              </p>
            )}
          </div>
          <div className="p-4 space-y-3">
            {(sets[currentEx.id] || []).map((set, setIdx) => (
              <div key={setIdx} className={`p-3 rounded-xl border ${set.saved ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${set.saved ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {setIdx + 1}
                  </span>
                  <p className="text-xs text-gray-500">Target: {currentEx.repsMin}–{currentEx.repsMax} reps</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Weight (kg)</label>
                    <input type="number" step="0.5" value={set.weightKg}
                      onChange={(e) => setSets((prev) => ({ ...prev, [currentEx.id]: prev[currentEx.id].map((s, i) => i === setIdx ? { ...s, weightKg: e.target.value } : s) }))}
                      placeholder="kg" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Reps</label>
                    <input type="number" min={0} max={100} value={set.repsActual}
                      onChange={(e) => setSets((prev) => ({ ...prev, [currentEx.id]: prev[currentEx.id].map((s, i) => i === setIdx ? { ...s, repsActual: e.target.value } : s) }))}
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">RPE</label>
                    <input type="number" min={1} max={10} step={0.5} value={set.rpeActual}
                      onChange={(e) => setSets((prev) => ({ ...prev, [currentEx.id]: prev[currentEx.id].map((s, i) => i === setIdx ? { ...s, rpeActual: e.target.value } : s) }))}
                      placeholder="1–10" className="w-full px-2.5 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                {!set.saved && (
                  <button onClick={() => saveSet(currentEx.id, setIdx)}
                    className="mt-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Log Set {setIdx + 1}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pain Flag Modal */}
      {showPainModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowPainModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">Flag Discomfort</h2>
            <PainFlagForm onFlag={flagPain} onCancel={() => setShowPainModal(false)} />
          </div>
        </div>
      )}

      {/* Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowFinishModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-2">Finish Workout</h2>
            <p className="text-gray-500 text-sm mb-5">How did this session feel?</p>
            <div className="flex gap-3 justify-center mb-5">
              {["😫", "😐", "🙂", "💪", "🔥"].map((emoji) => (
                <button key={emoji} onClick={() => setFeedback((f) => ({ ...f, emoji }))}
                  className={`text-2xl w-12 h-12 rounded-xl transition-all ${feedback.emoji === emoji ? "bg-emerald-100 ring-2 ring-emerald-500 scale-110" : "bg-gray-50 hover:bg-gray-100"}`}>
                  {emoji}
                </button>
              ))}
            </div>
            <textarea value={feedback.text} onChange={(e) => setFeedback((f) => ({ ...f, text: e.target.value }))}
              placeholder="Any notes on this session?" rows={2}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setShowFinishModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={finishSession} disabled={completing}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                {completing ? "Saving..." : "Complete! 🎉"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PainFlagForm({ onFlag, onCancel }: { onFlag: (region: string, severity: number) => void; onCancel: () => void }) {
  const [region, setRegion] = useState("");
  const [severity, setSeverity] = useState(2);
  const regions = ["left_knee", "right_knee", "lower_back", "upper_back", "left_shoulder", "right_shoulder", "left_hip", "right_hip", "neck", "other"];
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Body Region</label>
        <select value={region} onChange={(e) => setRegion(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">— Select —</option>
          {regions.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Severity (1–5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => setSeverity(v)}
              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${severity === v ? (v >= 3 ? "bg-red-600 text-white" : "bg-orange-400 text-white") : "bg-gray-100 text-gray-600"}`}>
              {v}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">{severity >= 4 ? "Significant — trainer will be notified" : severity >= 3 ? "Moderate — trainer will be notified" : "Mild"}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
        <button onClick={() => region && onFlag(region, severity)} disabled={!region}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">Log Flag</button>
      </div>
    </div>
  );
}

