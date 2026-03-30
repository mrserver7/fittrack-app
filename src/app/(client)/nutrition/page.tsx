import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import NutritionTracker from "@/components/nutrition/nutrition-tracker";
import { Apple } from "lucide-react";

export default async function NutritionPage() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <div className="page-container max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center ring-1 ring-emerald-500/20">
          <Apple className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {t.nav.nutrition}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track your daily meals and macros
          </p>
        </div>
      </div>

      {/* Nutrition tracker */}
      <div className="section-card-padded">
        <NutritionTracker />
      </div>
    </div>
  );
}
