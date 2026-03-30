"use client";
import { useState, useEffect } from "react";
import { Compass, Dumbbell, Search } from "lucide-react";
import BodyMap, { MUSCLE_GROUPS, type MuscleGroup } from "@/components/workout/body-map";

interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string | null;
  bodyRegions: string | null;
  videoUrl: string | null;
}

export default function ExplorePage() {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [heatmapData, setHeatmapData] = useState<Record<string, { sets: number; volume: number }>>({});

  useEffect(() => {
    Promise.all([
      fetch("/api/exercises").then((r) => r.json()),
      fetch("/api/muscle-heatmap").then((r) => r.json()).catch(() => ({ muscles: {} })),
    ]).then(([exData, heatData]) => {
      setAllExercises(exData.exercises || []);
      setHeatmapData(heatData.muscles || {});
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedMuscle) {
      setExercises(allExercises);
      return;
    }
    const muscleLabel = MUSCLE_GROUPS[selectedMuscle].label.toLowerCase();
    const filtered = allExercises.filter((ex) => {
      const primary = (ex.primaryMuscles || "").toLowerCase();
      const regions = (ex.bodyRegions || "").toLowerCase();
      return primary.includes(muscleLabel) || regions.includes(muscleLabel) ||
        primary.includes(selectedMuscle) || regions.includes(selectedMuscle);
    });
    setExercises(filtered);
  }, [selectedMuscle, allExercises]);

  const displayedExercises = search
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Explore Exercises</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tap a muscle group to see matching exercises</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Map */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <BodyMap
            onMuscleClick={(muscle) => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
            activeMuscles={heatmapData}
            selectedMuscle={selectedMuscle}
          />

          {/* Muscle group chips */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedMuscle === muscle
                    ? "text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                style={selectedMuscle === muscle ? { backgroundColor: MUSCLE_GROUPS[muscle].color } : undefined}
              >
                {MUSCLE_GROUPS[muscle].label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Selected muscle header */}
          {selectedMuscle && (
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MUSCLE_GROUPS[selectedMuscle].color }} />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                {MUSCLE_GROUPS[selectedMuscle].label}
              </span>
              <span className="text-xs text-gray-400">
                {displayedExercises.length} exercise{displayedExercises.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setSelectedMuscle(null)}
                className="ml-auto text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Show all
              </button>
            </div>
          )}

          {/* Exercise cards */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : displayedExercises.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              <Dumbbell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No exercises found for this muscle group</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {displayedExercises.map((ex) => (
                <div key={ex.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{ex.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-400 capitalize">
                          {ex.category}
                        </span>
                        {ex.primaryMuscles && ex.primaryMuscles.split(",").map((m) => (
                          <span key={m.trim()} className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-700 dark:text-emerald-400 capitalize">
                            {m.trim()}
                          </span>
                        ))}
                      </div>
                      {ex.videoUrl && (
                        <a href={ex.videoUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block">
                          Watch demo
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
