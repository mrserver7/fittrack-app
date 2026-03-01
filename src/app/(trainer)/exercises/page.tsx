import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Dumbbell } from "lucide-react";
import AddExerciseButton from "@/components/exercises/add-exercise-button";
import { getT } from "@/lib/i18n/server";

const categoryColors: Record<string, string> = {
  push: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  pull: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  hinge: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  squat: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  carry: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  core: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cardio: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  mobility: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
};

export default async function ExercisesPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const trainerId = session!.user!.id!;

  const exercises = await prisma.exercise.findMany({
    where: { deletedAt: null, OR: [{ isGlobal: true }, { trainerId }] },
    orderBy: [{ isGlobal: "asc" }, { name: "asc" }],
  });

  const globalExercises = exercises.filter((e) => e.isGlobal);
  const customExercises = exercises.filter((e) => !e.isGlobal);

  const ExerciseCard = ({ ex }: { ex: typeof exercises[0] }) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm leading-tight">{ex.name}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${categoryColors[ex.category] || categoryColors.other}`}>
          {ex.category}
        </span>
      </div>
      {ex.primaryMuscles && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">💪 {ex.primaryMuscles}</p>
      )}
      {ex.equipment && (
        <p className="text-xs text-gray-400 dark:text-gray-500">🏋️ {ex.equipment}</p>
      )}
      {!ex.isGlobal && (
        <span className="inline-block mt-2 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">{t.exercises.customBadge}</span>
      )}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.exercises.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{exercises.length} {t.exercises.exercises} · {customExercises.length} {t.exercises.custom}</p>
        </div>
        <AddExerciseButton />
      </div>

      {customExercises.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t.exercises.yourCustomExercises}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {customExercises.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t.exercises.globalLibrary}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {globalExercises.map((ex) => <ExerciseCard key={ex.id} ex={ex} />)}
        </div>
        {globalExercises.length === 0 && (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <Dumbbell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">{t.exercises.runSeedScript}</p>
          </div>
        )}
      </div>
    </div>
  );
}
