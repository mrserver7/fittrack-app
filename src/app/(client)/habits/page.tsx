import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import HabitTracker from "@/components/habits/habit-tracker";
import { Target } from "lucide-react";

export default async function HabitsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <div className="page-container max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t.nav.habits}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your daily habits assigned by your trainer
          </p>
        </div>
      </div>

      {/* Habit tracker */}
      <div className="section-card-padded">
        <HabitTracker />
      </div>
    </div>
  );
}
