// Trainer Explore screen — identical to client Explore
// Re-exports the same component so trainers can browse the exercise library

import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, G, Defs, RadialGradient, Stop } from "react-native-svg";
import { Compass, Dumbbell, Search } from "lucide-react-native";
import { api } from "@/src/api/client";

type Exercise = {
  id: string; name: string; category: string;
  primaryMuscles: string | null; bodyRegions: string | null; videoUrl: string | null;
};

const MUSCLE_GROUPS: Record<string, { label: string; color: string }> = {
  chest:      { label: "Chest",      color: "#10B981" },
  back:       { label: "Back",       color: "#3B82F6" },
  shoulders:  { label: "Shoulders",  color: "#8B5CF6" },
  biceps:     { label: "Biceps",     color: "#F59E0B" },
  triceps:    { label: "Triceps",    color: "#EF4444" },
  forearms:   { label: "Forearms",   color: "#EC4899" },
  abs:        { label: "Abs",        color: "#14B8A6" },
  quads:      { label: "Quads",      color: "#F97316" },
  hamstrings: { label: "Hamstrings", color: "#84CC16" },
  glutes:     { label: "Glutes",     color: "#D946EF" },
  calves:     { label: "Calves",     color: "#06B6D4" },
  traps:      { label: "Traps",      color: "#A855F7" },
  lats:       { label: "Lats",       color: "#2563EB" },
  lower_back: { label: "Lower Back", color: "#DC2626" },
};

type MuscleKey = keyof typeof MUSCLE_GROUPS;

const BODY_SILHOUETTE_FRONT = `
  M 100 8
  C 88 8 80 18 80 28
  C 80 38 88 48 100 48
  C 112 48 120 38 120 28
  C 120 18 112 8 100 8 Z

  M 93 48 L 93 58
  C 93 60 92 62 90 63
  L 60 68
  C 50 70 42 74 38 80
  L 34 90
  C 32 94 32 100 34 106
  L 38 120
  C 40 126 42 130 44 132
  L 40 142
  C 38 150 36 158 34 164
  L 30 176
  C 28 180 30 184 34 184
  L 42 182
  C 44 182 46 180 46 178
  L 48 168
  C 50 162 52 156 54 150
  L 56 142
  C 58 138 60 136 62 134

  L 62 166
  C 62 170 60 176 58 182
  L 56 192
  C 56 196 58 200 62 200
  L 62 210

  C 60 224 58 240 58 256
  C 58 268 60 276 62 280
  L 64 288
  C 66 296 68 308 68 318
  C 68 328 66 338 64 346
  L 60 356
  C 58 362 60 368 64 370
  L 78 372
  C 82 372 86 368 86 364
  L 88 354
  C 90 348 90 340 88 332
  L 86 318
  C 84 308 82 296 82 286
  L 84 276

  L 96 276
  L 96 200 L 104 200
  L 104 276

  L 116 276
  L 118 286
  C 118 296 116 308 114 318
  L 112 332
  C 110 340 110 348 112 354
  L 114 364
  C 114 368 118 372 122 372
  L 136 370
  C 140 368 142 362 140 356
  L 136 346
  C 134 338 132 328 132 318
  C 132 308 134 296 136 288
  L 138 280
  C 140 276 142 268 142 256
  C 142 240 140 224 138 210

  L 138 200
  C 142 200 144 196 144 192
  L 142 182
  C 140 176 138 170 138 166
  L 138 134

  C 140 136 142 138 144 142
  L 146 150
  C 148 156 150 162 152 168
  L 154 178
  C 154 180 156 182 158 182
  L 166 184
  C 170 184 172 180 170 176
  L 166 164
  C 164 158 162 150 160 142
  L 156 132
  C 158 130 160 126 162 120
  L 166 106
  C 168 100 168 94 166 90
  L 162 80
  C 158 74 150 70 140 68
  L 110 63
  C 108 62 107 60 107 58
  L 107 48
  Z
`;

const BODY_SILHOUETTE_BACK = `
  M 100 8
  C 88 8 80 18 80 28
  C 80 38 88 48 100 48
  C 112 48 120 38 120 28
  C 120 18 112 8 100 8 Z

  M 93 48 L 93 58
  C 93 60 92 62 90 63
  L 60 68
  C 50 70 42 74 38 80
  L 34 90
  C 32 94 32 100 34 106
  L 38 120
  C 40 126 42 130 44 132
  L 40 142
  C 38 150 36 158 34 164
  L 30 176
  C 28 180 30 184 34 184
  L 42 182
  C 44 182 46 180 46 178
  L 48 168
  C 50 162 52 156 54 150
  L 56 142
  C 58 138 60 136 62 134

  L 62 166
  C 62 170 60 176 58 182
  L 56 192
  C 56 196 58 200 62 200
  L 62 210

  C 60 224 58 240 58 256
  C 58 268 60 276 62 280
  L 64 288
  C 66 296 68 308 68 318
  C 68 328 66 338 64 346
  L 60 356
  C 58 362 60 368 64 370
  L 78 372
  C 82 372 86 368 86 364
  L 88 354
  C 90 348 90 340 88 332
  L 86 318
  C 84 308 82 296 82 286
  L 84 276

  L 96 276
  L 96 200 L 104 200
  L 104 276

  L 116 276
  L 118 286
  C 118 296 116 308 114 318
  L 112 332
  C 110 340 110 348 112 354
  L 114 364
  C 114 368 118 372 122 372
  L 136 370
  C 140 368 142 362 140 356
  L 136 346
  C 134 338 132 328 132 318
  C 132 308 134 296 136 288
  L 138 280
  C 140 276 142 268 142 256
  C 142 240 140 224 138 210

  L 138 200
  C 142 200 144 196 144 192
  L 142 182
  C 140 176 138 170 138 166
  L 138 134

  C 140 136 142 138 144 142
  L 146 150
  C 148 156 150 162 152 168
  L 154 178
  C 154 180 156 182 158 182
  L 166 184
  C 170 184 172 180 170 176
  L 166 164
  C 164 158 162 150 160 142
  L 156 132
  C 158 130 160 126 162 120
  L 166 106
  C 168 100 168 94 166 90
  L 162 80
  C 158 74 150 70 140 68
  L 110 63
  C 108 62 107 60 107 58
  L 107 48
  Z
`;

type MuscleRegion = { key: MuscleKey; d: string };

const FRONT_MUSCLES: MuscleRegion[] = [
  { key: "chest", d: `M 72 82 C 74 76 84 74 92 76 C 96 78 98 82 98 88 C 98 96 96 104 92 110 C 88 116 82 118 76 116 C 70 114 66 106 66 98 C 66 90 68 84 72 82 Z` },
  { key: "chest", d: `M 128 82 C 126 76 116 74 108 76 C 104 78 102 82 102 88 C 102 96 104 104 108 110 C 112 116 118 118 124 116 C 130 114 134 106 134 98 C 134 90 132 84 128 82 Z` },
  { key: "abs", d: `M 88 120 C 92 118 96 117 100 117 C 104 117 108 118 112 120 L 112 134 C 108 136 104 137 100 137 C 96 137 92 136 88 134 Z` },
  { key: "abs", d: `M 88 136 C 92 134 96 133 100 133 C 104 133 108 134 112 136 L 112 152 C 108 154 104 155 100 155 C 96 155 92 154 88 152 Z` },
  { key: "abs", d: `M 88 154 C 92 152 96 151 100 151 C 104 151 108 152 112 154 L 114 170 C 110 174 106 176 100 176 C 94 176 90 174 86 170 Z` },
  { key: "shoulders", d: `M 62 66 C 56 64 48 66 44 72 C 40 78 40 86 44 90 C 48 94 54 92 58 88 C 64 82 66 74 62 66 Z` },
  { key: "shoulders", d: `M 138 66 C 144 64 152 66 156 72 C 160 78 160 86 156 90 C 152 94 146 92 142 88 C 136 82 134 74 138 66 Z` },
  { key: "biceps", d: `M 50 92 C 44 94 40 100 38 108 C 36 116 38 124 42 130 C 46 134 52 134 56 130 C 60 124 62 116 62 108 C 62 100 58 94 50 92 Z` },
  { key: "biceps", d: `M 150 92 C 156 94 160 100 162 108 C 164 116 162 124 158 130 C 154 134 148 134 144 130 C 140 124 138 116 138 108 C 138 100 142 94 150 92 Z` },
  { key: "forearms", d: `M 44 134 C 40 136 36 142 34 150 C 32 158 32 166 34 172 C 38 176 44 176 48 172 C 54 166 56 158 56 150 C 56 142 52 136 44 134 Z` },
  { key: "forearms", d: `M 156 134 C 160 136 164 142 166 150 C 168 158 168 166 166 172 C 162 176 156 176 152 172 C 146 166 144 158 144 150 C 144 142 148 136 156 134 Z` },
  { key: "quads", d: `M 64 206 C 60 210 58 222 58 238 C 58 254 60 266 64 272 C 68 278 76 280 82 278 C 88 274 92 266 94 254 C 96 240 96 224 94 214 C 92 208 86 204 78 204 C 72 204 66 204 64 206 Z` },
  { key: "quads", d: `M 136 206 C 140 210 142 222 142 238 C 142 254 140 266 136 272 C 132 278 124 280 118 278 C 112 274 108 266 106 254 C 104 240 104 224 106 214 C 108 208 114 204 122 204 C 128 204 134 204 136 206 Z` },
  { key: "calves", d: `M 68 290 C 64 296 62 306 62 318 C 62 330 64 338 68 342 C 72 346 78 346 82 342 C 86 336 88 326 88 316 C 88 304 86 296 82 290 C 78 286 72 286 68 290 Z` },
  { key: "calves", d: `M 132 290 C 136 296 138 306 138 318 C 138 330 136 338 132 342 C 128 346 122 346 118 342 C 114 336 112 326 112 316 C 112 304 114 296 118 290 C 122 286 128 286 132 290 Z` },
];

const BACK_MUSCLES: MuscleRegion[] = [
  { key: "traps", d: `M 82 62 C 86 58 92 56 100 56 C 108 56 114 58 118 62 L 132 72 C 128 78 118 84 108 88 C 104 90 100 90 100 90 C 100 90 96 90 92 88 C 82 84 72 78 68 72 Z` },
  { key: "lats", d: `M 68 90 C 64 94 62 102 62 112 C 62 124 64 136 68 146 C 72 154 78 158 84 156 C 90 154 94 146 96 136 C 98 124 98 112 96 102 C 94 94 90 90 84 88 C 78 86 72 88 68 90 Z` },
  { key: "lats", d: `M 132 90 C 136 94 138 102 138 112 C 138 124 136 136 132 146 C 128 154 122 158 116 156 C 110 154 106 146 104 136 C 102 124 102 112 104 102 C 106 94 110 90 116 88 C 122 86 128 88 132 90 Z` },
  { key: "shoulders", d: `M 62 66 C 56 64 48 66 44 72 C 40 78 40 86 44 90 C 48 94 54 92 58 88 C 64 82 66 74 62 66 Z` },
  { key: "shoulders", d: `M 138 66 C 144 64 152 66 156 72 C 160 78 160 86 156 90 C 152 94 146 92 142 88 C 136 82 134 74 138 66 Z` },
  { key: "triceps", d: `M 50 92 C 44 94 40 100 38 108 C 36 116 38 124 42 130 C 46 134 52 134 56 130 C 60 124 62 116 62 108 C 62 100 58 94 50 92 Z` },
  { key: "triceps", d: `M 150 92 C 156 94 160 100 162 108 C 164 116 162 124 158 130 C 154 134 148 134 144 130 C 140 124 138 116 138 108 C 138 100 142 94 150 92 Z` },
  { key: "forearms", d: `M 44 134 C 40 136 36 142 34 150 C 32 158 32 166 34 172 C 38 176 44 176 48 172 C 54 166 56 158 56 150 C 56 142 52 136 44 134 Z` },
  { key: "forearms", d: `M 156 134 C 160 136 164 142 166 150 C 168 158 168 166 166 172 C 162 176 156 176 152 172 C 146 166 144 158 144 150 C 144 142 148 136 156 134 Z` },
  { key: "lower_back", d: `M 84 146 C 88 142 94 140 100 140 C 106 140 112 142 116 146 L 120 162 C 116 170 110 174 100 174 C 90 174 84 170 80 162 Z` },
  { key: "glutes", d: `M 66 182 C 62 186 60 194 62 204 C 64 212 70 216 78 216 C 86 216 92 212 94 204 C 96 196 94 188 90 182 C 86 178 78 176 72 178 C 68 180 66 182 66 182 Z` },
  { key: "glutes", d: `M 134 182 C 138 186 140 194 138 204 C 136 212 130 216 122 216 C 114 216 108 212 106 204 C 104 196 106 188 110 182 C 114 178 122 176 128 178 C 132 180 134 182 134 182 Z` },
  { key: "hamstrings", d: `M 64 218 C 60 224 58 236 58 250 C 58 264 60 274 66 278 C 72 282 80 280 86 276 C 92 270 94 260 94 248 C 94 234 92 224 88 218 C 84 214 76 212 70 214 C 66 216 64 218 64 218 Z` },
  { key: "hamstrings", d: `M 136 218 C 140 224 142 236 142 250 C 142 264 140 274 134 278 C 128 282 120 280 114 276 C 108 270 106 260 106 248 C 106 234 108 224 112 218 C 116 214 124 212 130 214 C 134 216 136 218 136 218 Z` },
  { key: "calves", d: `M 68 290 C 64 296 62 306 62 318 C 62 330 64 338 68 342 C 72 346 78 346 82 342 C 86 336 88 326 88 316 C 88 304 86 296 82 290 C 78 286 72 286 68 290 Z` },
  { key: "calves", d: `M 132 290 C 136 296 138 306 138 318 C 138 330 136 338 132 342 C 128 346 122 346 118 342 C 114 336 112 326 112 316 C 112 304 114 296 118 290 C 122 286 128 286 132 290 Z` },
];

function BodyMapSvg({ view, selected, onPress }: {
  view: "front" | "back";
  selected: MuscleKey | null;
  onPress: (m: MuscleKey) => void;
}) {
  const muscles = view === "front" ? FRONT_MUSCLES : BACK_MUSCLES;
  const silhouette = view === "front" ? BODY_SILHOUETTE_FRONT : BODY_SILHOUETTE_BACK;

  return (
    <Svg width="100%" height={300} viewBox="0 0 200 390" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <RadialGradient id="selectedGlow" cx="50%" cy="50%" rx="50%" ry="50%">
          <Stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
          <Stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      <Path d={silhouette} fill="#c8ccd2" fillRule="evenodd" />
      <Path d={silhouette} fill="none" stroke="#b0b5bd" strokeWidth={0.5} fillRule="evenodd" />

      {muscles.map((region, i) => {
        const isSelected = selected === region.key;
        const color = MUSCLE_GROUPS[region.key].color;
        return (
          <G key={`${region.key}-${i}`}>
            <Path
              d={region.d}
              fill={color}
              fillOpacity={isSelected ? 0.8 : 0.15}
              stroke={isSelected ? color : "none"}
              strokeWidth={isSelected ? 2 : 0}
              strokeOpacity={isSelected ? 1 : 0}
              onPress={() => onPress(region.key)}
            />
            {isSelected && (
              <Path d={region.d} fill="url(#selectedGlow)" fillOpacity={0.5} onPress={() => onPress(region.key)} />
            )}
          </G>
        );
      })}
    </Svg>
  );
}

export default function TrainerExploreScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleKey | null>(null);
  const [bodyView, setBodyView] = useState<"front" | "back">("front");

  useEffect(() => {
    api.get<{ exercises: Exercise[] }>("/api/exercises").then((data) => {
      setAllExercises(data.exercises || []);
      setExercises(data.exercises || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMuscle) { setExercises(allExercises); return; }
    const label = MUSCLE_GROUPS[selectedMuscle].label.toLowerCase();
    setExercises(allExercises.filter((ex) => {
      const primary = (ex.primaryMuscles || "").toLowerCase();
      const regions = (ex.bodyRegions || "").toLowerCase();
      return primary.includes(label) || regions.includes(label)
        || primary.includes(selectedMuscle) || regions.includes(selectedMuscle);
    }));
  }, [selectedMuscle, allExercises]);

  const displayed = search
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  const handleMusclePress = (muscle: MuscleKey) =>
    setSelectedMuscle(muscle === selectedMuscle ? null : muscle);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <FlatList
        data={displayed}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View>
            <View style={{ padding: 16, paddingBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <View style={{ width: 40, height: 40, backgroundColor: "#ede9fe", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
                  <Compass color="#7c3aed" size={20} />
                </View>
                <View>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>Explore</Text>
                  <Text style={{ fontSize: 13, color: "#6b7280" }}>Tap muscles to filter exercises</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12 }}>
                <Search color="#9ca3af" size={16} />
                <TextInput
                  value={search} onChangeText={setSearch}
                  placeholder="Search exercises..."
                  style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: "#111827" }}
                />
              </View>
            </View>

            <View style={{
              backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, padding: 14,
              borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 14,
              shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
            }}>
              <View style={{ flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 10 }}>
                {(["front", "back"] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setBodyView(v)}
                    style={{
                      flex: 1, paddingVertical: 7, borderRadius: 8,
                      backgroundColor: bodyView === v ? "#fff" : "transparent",
                      alignItems: "center",
                      shadowColor: bodyView === v ? "#000" : "transparent",
                      shadowOpacity: 0.06, shadowRadius: 4,
                      elevation: bodyView === v ? 2 : 0,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: "600", color: bodyView === v ? "#111827" : "#9ca3af" }}>
                      {v === "front" ? "Front View" : "Back View"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <BodyMapSvg view={bodyView} selected={selectedMuscle} onPress={handleMusclePress} />

              {selectedMuscle && (
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 6, gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: MUSCLE_GROUPS[selectedMuscle].color }} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>{MUSCLE_GROUPS[selectedMuscle].label} selected</Text>
                  <TouchableOpacity onPress={() => setSelectedMuscle(null)} style={{ paddingHorizontal: 8, paddingVertical: 2, backgroundColor: "#f3f4f6", borderRadius: 8 }}>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>Clear</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16 }}>
                <TouchableOpacity
                  onPress={() => setSelectedMuscle(null)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: !selectedMuscle ? "#111827" : "#f3f4f6" }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "500", color: !selectedMuscle ? "#fff" : "#6b7280" }}>All</Text>
                </TouchableOpacity>
                {(Object.keys(MUSCLE_GROUPS) as MuscleKey[]).map((mg) => (
                  <TouchableOpacity
                    key={mg}
                    onPress={() => handleMusclePress(mg)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedMuscle === mg ? MUSCLE_GROUPS[mg].color : "#f3f4f6" }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "500", color: selectedMuscle === mg ? "#fff" : "#6b7280" }}>
                      {MUSCLE_GROUPS[mg].label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={{ fontSize: 12, color: "#9ca3af", paddingHorizontal: 16, marginBottom: 8 }}>
              {displayed.length} exercise{displayed.length !== 1 ? "s" : ""}{selectedMuscle ? ` · ${MUSCLE_GROUPS[selectedMuscle].label}` : ""}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator size="large" color="#059669" />
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Dumbbell color="#d1d5db" size={32} />
              <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>No exercises found</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <View style={{
            backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb",
            padding: 14, marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12,
          }}>
            <View style={{ width: 36, height: 36, backgroundColor: "#f3f4f6", borderRadius: 8, justifyContent: "center", alignItems: "center" }}>
              <Dumbbell color="#6b7280" size={16} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>{item.name}</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                <View style={{ backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, color: "#6b7280", textTransform: "capitalize" }}>{item.category}</Text>
                </View>
                {item.primaryMuscles?.split(",").slice(0, 2).map((m) => (
                  <View key={m.trim()} style={{ backgroundColor: "#d1fae5", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, color: "#047857", textTransform: "capitalize" }}>{m.trim()}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
