import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import NutritionTracker from "@/components/nutrition/nutrition-tracker";
import { Apple } from "lucide-react";

export default async function NutritionPage() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <Apple className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.nav.nutrition}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Track your daily meals and macros</p>
          </div>
        </div>
      </div>

      <NutritionTracker />
    </div>
  );
}
