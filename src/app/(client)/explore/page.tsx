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
    <div className="page-container">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
            <Compass className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Explore Exercises</h1>
            <p className="text-sm text-muted-foreground">Tap a muscle group to see matching exercises</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Body Map */}
        <div className="section-card-padded">
          <BodyMap
            onMuscleClick={(muscle) => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
            activeMuscles={heatmapData}
            selectedMuscle={selectedMuscle}
          />

          {/* Muscle group chips */}
          <div className="mt-5 flex flex-wrap gap-1.5">
            {(Object.keys(MUSCLE_GROUPS) as MuscleGroup[]).map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedMuscle === muscle
                    ? "text-white"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
                style={selectedMuscle === muscle ? { backgroundColor: MUSCLE_GROUPS[muscle].color } : undefined}
              >
                {MUSCLE_GROUPS[muscle].label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-shadow"
            />
          </div>

          {/* Selected muscle header */}
          {selectedMuscle && (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: MUSCLE_GROUPS[selectedMuscle].color }} />
              <span className="text-sm font-semibold text-foreground">
                {MUSCLE_GROUPS[selectedMuscle].label}
              </span>
              <span className="text-xs text-muted-foreground">
                {displayedExercises.length} exercise{displayedExercises.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setSelectedMuscle(null)}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Show all
              </button>
            </div>
          )}

          {/* Exercise cards */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayedExercises.length === 0 ? (
            <div className="section-card flex flex-col items-center justify-center py-16 border-dashed">
              <Dumbbell className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No exercises found for this muscle group</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {displayedExercises.map((ex) => (
                <div
                  key={ex.id}
                  className="section-card p-4 hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{ex.name}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground capitalize">
                          {ex.category}
                        </span>
                        {ex.primaryMuscles && ex.primaryMuscles.split(",").map((m) => (
                          <span key={m.trim()} className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-full text-emerald-700 dark:text-emerald-400 capitalize">
                            {m.trim()}
                          </span>
                        ))}
                      </div>
                      {ex.videoUrl && (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1.5 inline-block"
                        >
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
