"use client";
import { useState, useEffect } from "react";
import { Plus, Apple, Coffee, UtensilsCrossed, Cookie, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface NutritionLog {
  id: string;
  meal: string;
  name: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const MEAL_ICONS: Record<string, React.ElementType> = {
  breakfast: Coffee,
  lunch: UtensilsCrossed,
  dinner: Apple,
  snack: Cookie,
};

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function NutritionTracker({ date, proteinTarget }: { date?: string; proteinTarget?: number }) {
  const today = date || new Date().toISOString().split("T")[0];
  const [meals, setMeals] = useState<NutritionLog[]>([]);
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [addMeal, setAddMeal] = useState("breakfast");
  const [addForm, setAddForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const fetchData = () => {
    fetch(`/api/nutrition/daily?date=${today}`)
      .then((r) => r.json())
      .then((d) => { setMeals(d.meals || []); setTotals(d.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 }); })
      .catch(() => {});
  };

  useEffect(() => { fetchData(); }, [today]);

  const handleAdd = async () => {
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        meal: addMeal,
        name: addForm.name || null,
        calories: addForm.calories ? parseInt(addForm.calories) : null,
        protein: addForm.protein ? parseFloat(addForm.protein) : null,
        carbs: addForm.carbs ? parseFloat(addForm.carbs) : null,
        fat: addForm.fat ? parseFloat(addForm.fat) : null,
      }),
    });
    if (res.ok) {
      toast.success("Meal logged");
      setShowAdd(false);
      setAddForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/nutrition/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Removed"); fetchData(); }
  };

  const pTarget = proteinTarget || 150;
  const proteinPct = Math.min((totals.protein / pTarget) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Macro summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Calories", value: totals.calories, unit: "kcal", color: "emerald" },
          { label: "Protein", value: Math.round(totals.protein), unit: "g", color: "blue" },
          { label: "Carbs", value: Math.round(totals.carbs), unit: "g", color: "amber" },
          { label: "Fat", value: Math.round(totals.fat), unit: "g", color: "red" },
        ].map((m) => (
          <div key={m.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">{m.label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-gray-50 tabular-nums">{m.value}</p>
            <p className="text-xs text-gray-400">{m.unit}</p>
          </div>
        ))}
      </div>

      {/* Protein target ring */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/50">
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-blue-200 dark:text-blue-900" />
            <circle cx="20" cy="20" r="16" fill="none" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 16}`}
              strokeDashoffset={`${2 * Math.PI * 16 * (1 - proteinPct / 100)}`}
              className="text-blue-500" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
            {Math.round(proteinPct)}%
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-50">
            {Math.round(totals.protein)}g / {pTarget}g protein
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Daily target</p>
        </div>
      </div>

      {/* Meals by type */}
      {["breakfast", "lunch", "dinner", "snack"].map((mealType) => {
        const mealItems = meals.filter((m) => m.meal === mealType);
        const Icon = MEAL_ICONS[mealType];
        return (
          <div key={mealType} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
              <Icon className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{MEAL_LABELS[mealType]}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {mealItems.reduce((s, m) => s + (m.calories || 0), 0)} kcal
              </span>
            </div>
            {mealItems.length === 0 ? (
              <p className="text-xs text-gray-400 py-3 text-center">No entries</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {mealItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-gray-50 truncate">{item.name || mealType}</p>
                      <p className="text-xs text-gray-400">
                        {item.calories || 0} kcal · {item.protein || 0}g P · {item.carbs || 0}g C · {item.fat || 0}g F
                      </p>
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add meal */}
      {showAdd ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <div className="flex gap-2">
            {["breakfast", "lunch", "dinner", "snack"].map((m) => (
              <button key={m} onClick={() => setAddMeal(m)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  addMeal === m ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                {MEAL_LABELS[m]}
              </button>
            ))}
          </div>
          <input value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            placeholder="Food name" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-50" />
          <div className="grid grid-cols-4 gap-2">
            {(["calories", "protein", "carbs", "fat"] as const).map((f) => (
              <input key={f} value={addForm[f]} onChange={(e) => setAddForm({ ...addForm, [f]: e.target.value })}
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)} type="number"
                className="px-2 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-50 text-center" />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">Cancel</button>
            <button onClick={handleAdd} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">Add</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 rounded-xl text-sm hover:border-emerald-300 hover:text-emerald-600 transition-colors">
          <Plus className="w-4 h-4" /> Log Meal
        </button>
      )}
    </div>
  );
}
