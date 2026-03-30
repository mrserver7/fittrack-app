"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Timer, X, SkipForward } from "lucide-react";

interface RestTimerProps {
  duration: number; // seconds
  onComplete?: () => void;
  onSkip?: () => void;
  autoStart?: boolean;
}

export default function RestTimer({ duration, onComplete, onSkip, autoStart = true }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isVisible, setIsVisible] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 100;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleComplete = useCallback(() => {
    setIsRunning(false);
    // Try to play a subtle notification sound
    try {
      audioRef.current = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQ==");
      audioRef.current.volume = 0.3;
      audioRef.current.play().catch(() => {});
    } catch {}
    if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          handleComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, remaining, handleComplete]);

  const handleSkip = () => {
    setIsRunning(false);
    setRemaining(0);
    onSkip?.();
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const isFinished = remaining <= 0;
  const isUrgent = remaining <= 10 && remaining > 0;

  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg border transition-all ${
      isFinished
        ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
        : isUrgent
          ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 animate-pulse"
          : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
    }`}>
      {/* Circular progress */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3"
            className="text-gray-200 dark:text-gray-700" />
          <circle cx="24" cy="24" r="20" fill="none" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 20}`}
            strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className={isFinished ? "text-emerald-500" : isUrgent ? "text-amber-500" : "text-emerald-500"}
            style={{ transition: "stroke-dashoffset 1s linear" }} />
        </svg>
        <Timer className={`absolute inset-0 m-auto w-5 h-5 ${isFinished ? "text-emerald-600" : "text-gray-500 dark:text-gray-400"}`} />
      </div>

      {/* Time display */}
      <div className="flex-1 min-w-0">
        <p className={`text-2xl font-bold tabular-nums ${
          isFinished ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-gray-50"
        }`}>
          {isFinished ? "Go!" : formatTime(remaining)}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {isFinished ? "Rest complete — start your next set" : "Rest timer"}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {!isFinished && (
          <button onClick={handleSkip}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
            title="Skip rest">
            <SkipForward className="w-5 h-5" />
          </button>
        )}
        <button onClick={handleDismiss}
          className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
          title="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
