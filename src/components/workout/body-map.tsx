"use client";
import { useState } from "react";

export const MUSCLE_GROUPS = {
  chest: { label: "Chest", color: "#10B981" },
  back: { label: "Back", color: "#3B82F6" },
  shoulders: { label: "Shoulders", color: "#8B5CF6" },
  biceps: { label: "Biceps", color: "#F59E0B" },
  triceps: { label: "Triceps", color: "#EF4444" },
  forearms: { label: "Forearms", color: "#EC4899" },
  abs: { label: "Abs", color: "#14B8A6" },
  obliques: { label: "Obliques", color: "#6366F1" },
  quads: { label: "Quads", color: "#F97316" },
  hamstrings: { label: "Hamstrings", color: "#84CC16" },
  glutes: { label: "Glutes", color: "#D946EF" },
  calves: { label: "Calves", color: "#06B6D4" },
  traps: { label: "Traps", color: "#A855F7" },
  lats: { label: "Lats", color: "#2563EB" },
  lower_back: { label: "Lower Back", color: "#DC2626" },
} as const;

export type MuscleGroup = keyof typeof MUSCLE_GROUPS;

interface BodyMapProps {
  onMuscleClick?: (muscle: MuscleGroup) => void;
  activeMuscles?: Record<string, { sets: number; volume: number }>;
  selectedMuscle?: MuscleGroup | null;
  view?: "front" | "back";
}

// Muscle region hit areas (x, y, width, height in percentage of SVG viewBox 200x400)
const FRONT_REGIONS: Record<string, { x: number; y: number; w: number; h: number; muscle: MuscleGroup }> = {
  chest_l: { x: 60, y: 100, w: 35, h: 35, muscle: "chest" },
  chest_r: { x: 105, y: 100, w: 35, h: 35, muscle: "chest" },
  shoulders_l: { x: 40, y: 85, w: 25, h: 25, muscle: "shoulders" },
  shoulders_r: { x: 135, y: 85, w: 25, h: 25, muscle: "shoulders" },
  biceps_l: { x: 30, y: 115, w: 22, h: 40, muscle: "biceps" },
  biceps_r: { x: 148, y: 115, w: 22, h: 40, muscle: "biceps" },
  forearms_l: { x: 22, y: 160, w: 20, h: 40, muscle: "forearms" },
  forearms_r: { x: 158, y: 160, w: 20, h: 40, muscle: "forearms" },
  abs: { x: 72, y: 140, w: 56, h: 55, muscle: "abs" },
  obliques_l: { x: 55, y: 145, w: 20, h: 45, muscle: "obliques" },
  obliques_r: { x: 125, y: 145, w: 20, h: 45, muscle: "obliques" },
  quads_l: { x: 58, y: 210, w: 35, h: 70, muscle: "quads" },
  quads_r: { x: 107, y: 210, w: 35, h: 70, muscle: "quads" },
  calves_l: { x: 60, y: 300, w: 30, h: 55, muscle: "calves" },
  calves_r: { x: 110, y: 300, w: 30, h: 55, muscle: "calves" },
};

const BACK_REGIONS: Record<string, { x: number; y: number; w: number; h: number; muscle: MuscleGroup }> = {
  traps: { x: 70, y: 75, w: 60, h: 30, muscle: "traps" },
  shoulders_l: { x: 40, y: 85, w: 25, h: 25, muscle: "shoulders" },
  shoulders_r: { x: 135, y: 85, w: 25, h: 25, muscle: "shoulders" },
  lats_l: { x: 55, y: 110, w: 30, h: 45, muscle: "lats" },
  lats_r: { x: 115, y: 110, w: 30, h: 45, muscle: "lats" },
  triceps_l: { x: 30, y: 115, w: 22, h: 40, muscle: "triceps" },
  triceps_r: { x: 148, y: 115, w: 22, h: 40, muscle: "triceps" },
  lower_back: { x: 75, y: 155, w: 50, h: 35, muscle: "lower_back" },
  glutes_l: { x: 62, y: 195, w: 35, h: 35, muscle: "glutes" },
  glutes_r: { x: 103, y: 195, w: 35, h: 35, muscle: "glutes" },
  hamstrings_l: { x: 60, y: 235, w: 35, h: 60, muscle: "hamstrings" },
  hamstrings_r: { x: 105, y: 235, w: 35, h: 60, muscle: "hamstrings" },
  calves_l: { x: 62, y: 305, w: 30, h: 50, muscle: "calves" },
  calves_r: { x: 108, y: 305, w: 30, h: 50, muscle: "calves" },
};

function getOpacity(muscle: MuscleGroup, activeMuscles?: Record<string, { sets: number; volume: number }>) {
  if (!activeMuscles || !activeMuscles[muscle]) return 0.15;
  const maxSets = Math.max(...Object.values(activeMuscles).map(m => m.sets), 1);
  return 0.3 + (activeMuscles[muscle].sets / maxSets) * 0.6;
}

export default function BodyMap({ onMuscleClick, activeMuscles, selectedMuscle, view: initialView }: BodyMapProps) {
  const [view, setView] = useState<"front" | "back">(initialView || "front");
  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* View toggle */}
      {!initialView && (
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setView("front")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "front" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm" : "text-gray-500"
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView("back")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "back" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-50 shadow-sm" : "text-gray-500"
            }`}
          >
            Back
          </button>
        </div>
      )}

      {/* SVG Body */}
      <svg viewBox="0 0 200 400" className="w-full max-w-[240px] h-auto">
        {/* Body outline */}
        <g className="text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5">
          {/* Head */}
          <ellipse cx="100" cy="35" rx="22" ry="28" />
          {/* Neck */}
          <rect x="90" y="60" width="20" height="15" rx="5" />
          {/* Torso */}
          <path d="M 60 75 Q 55 85 50 100 L 45 155 Q 45 200 65 210 L 65 200 Q 70 195 100 195 Q 130 195 135 200 L 135 210 Q 155 200 155 155 L 150 100 Q 145 85 140 75 Z" />
          {/* Left arm */}
          <path d="M 50 100 Q 35 110 28 140 Q 20 170 15 200" strokeLinecap="round" />
          {/* Right arm */}
          <path d="M 150 100 Q 165 110 172 140 Q 180 170 185 200" strokeLinecap="round" />
          {/* Left leg */}
          <path d="M 75 205 Q 70 250 65 290 Q 62 320 60 360 Q 58 380 55 395" strokeLinecap="round" />
          {/* Right leg */}
          <path d="M 125 205 Q 130 250 135 290 Q 138 320 140 360 Q 142 380 145 395" strokeLinecap="round" />
        </g>

        {/* Clickable muscle regions */}
        {Object.entries(regions).map(([key, region]) => {
          const isSelected = selectedMuscle === region.muscle;
          const opacity = getOpacity(region.muscle, activeMuscles);
          const color = MUSCLE_GROUPS[region.muscle].color;

          return (
            <rect
              key={key}
              x={region.x}
              y={region.y}
              width={region.w}
              height={region.h}
              rx={6}
              fill={color}
              fillOpacity={isSelected ? 0.8 : opacity}
              stroke={isSelected ? color : "transparent"}
              strokeWidth={isSelected ? 2 : 0}
              className="cursor-pointer transition-all hover:fill-opacity-60"
              onClick={() => onMuscleClick?.(region.muscle)}
            />
          );
        })}
      </svg>

      {/* Selected muscle label */}
      {selectedMuscle && (
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MUSCLE_GROUPS[selectedMuscle].color }} />
            {MUSCLE_GROUPS[selectedMuscle].label}
            {activeMuscles?.[selectedMuscle] && (
              <span className="text-gray-500 dark:text-gray-400">
                — {activeMuscles[selectedMuscle].sets} sets, {Math.round(activeMuscles[selectedMuscle].volume)} kg
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
