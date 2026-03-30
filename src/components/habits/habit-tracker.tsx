"use client";
import { useState, useEffect } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";

interface Habit {
  id: string;
  name: string;
  icon: string | null;
  targetValue: number | null;
  unit: string | null;
  logs: { date: string; value: number }[];
}

export default function HabitTracker() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = () => {
    fetch("/api/habits")
      .then((r) => r.json())
      .then((d) => setHabits(d.habits || []))
      .catch(() => {});
  };

  useEffect(() => { fetchHabits(); }, []);

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const todayLog = habit.logs.find((l) => l.date === today);

    if (todayLog) {
      // Already logged today — we'll just treat it as a "done" state
      return;
    }

    const res = await fetch("/api/habits/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date: today, value: 1 }),
    });

    if (res.ok) {
      toast.success("Habit logged!");
      fetchHabits();
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-8 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <Plus className="w-8 h-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No habits assigned yet</p>
        <p className="text-xs text-gray-400">Your trainer will set up daily habits for you</p>
      </div>
    );
  }

  // Build 7-day grid
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const dayLabels = dates.map((d) => new Date(d).toLocaleDateString("en", { weekday: "short" }).slice(0, 2));

  return (
    <div className="space-y-3">
      {/* Day headers */}
      <div className="grid gap-2" style={{ gridTemplateColumns: "1fr repeat(7, 32px)" }}>
        <div />
        {dayLabels.map((label, i) => (
          <div key={i} className={`text-center text-xs font-medium ${
            dates[i] === today ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
          }`}>
            {label}
          </div>
        ))}
      </div>

      {/* Habit rows */}
      {habits.map((habit) => {
        const todayDone = habit.logs.some((l) => l.date === today);

        return (
          <div key={habit.id} className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr repeat(7, 32px)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{habit.icon || "+"}</span>
              <span className="text-sm text-gray-900 dark:text-gray-50 truncate">{habit.name}</span>
            </div>
            {dates.map((date, i) => {
              const done = habit.logs.some((l) => l.date === date);
              const isToday = date === today;

              return (
                <button
                  key={i}
                  onClick={isToday && !done ? () => toggleHabit(habit.id) : undefined}
                  disabled={!isToday || done}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    done
                      ? "bg-emerald-500 text-white"
                      : isToday
                        ? "bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 cursor-pointer"
                        : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  {done && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        );
      })}

      {/* Weekly completion summary */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-xs text-gray-400">This week</span>
        <span className="text-xs font-medium text-gray-900 dark:text-gray-50">
          {habits.reduce((sum, h) => sum + h.logs.filter((l) => dates.includes(l.date)).length, 0)} /
          {" "}{habits.length * 7} completed
        </span>
      </div>
    </div>
  );
}
