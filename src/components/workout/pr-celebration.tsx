"use client";
import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";

interface PRCelebrationProps {
  exerciseName: string;
  newWeight: number;
  previousWeight?: number;
  reps?: number;
  onDismiss: () => void;
}

export default function PRCelebration({ exerciseName, newWeight, previousWeight, reps, onDismiss }: PRCelebrationProps) {
  const [show, setShow] = useState(false);
  const improvement = previousWeight ? newWeight - previousWeight : null;

  useEffect(() => {
    setShow(true);
    if ("vibrate" in navigator) navigator.vibrate([100, 50, 100, 50, 200]);
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${show ? "opacity-100" : "opacity-0"}`}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onDismiss} />

      {/* Confetti-like particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ["#10B981", "#F59E0B", "#3B82F6", "#EF4444", "#8B5CF6"][i % 5],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${1 + Math.random() * 2}s`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div className={`relative bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950 dark:to-yellow-950 rounded-3xl p-8 shadow-2xl border-2 border-amber-300 dark:border-amber-700 max-w-sm w-full text-center transform transition-all duration-500 ${show ? "scale-100" : "scale-50"}`}>
        <button onClick={onDismiss} className="absolute top-3 right-3 p-1 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900">
          <X className="w-4 h-4 text-amber-600" />
        </button>

        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-amber-500" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-1">NEW PR!</h2>
        <p className="text-amber-700 dark:text-amber-400 font-medium mb-4">You just crushed it!</p>

        <div className="bg-white/60 dark:bg-black/20 rounded-2xl p-4 mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{exerciseName}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">
            {newWeight} kg {reps ? `x ${reps}` : ""}
          </p>
          {improvement !== null && improvement > 0 && (
            <p className="text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              +{improvement} kg improvement
            </p>
          )}
        </div>

        <button onClick={onDismiss}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors">
          Awesome!
        </button>
      </div>
    </div>
  );
}
