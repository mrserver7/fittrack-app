import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import HabitTracker from "@/components/habits/habit-tracker";
import { Target } from "lucide-react";

export default async function HabitsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.nav.habits}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily habits assigned by your trainer</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <HabitTracker />
      </div>
    </div>
  );
}
