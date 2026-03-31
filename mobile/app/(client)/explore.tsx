import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Ellipse, G } from "react-native-svg";
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

// Front muscle regions [cx, cy, rx, ry, muscle]
const FRONT_REGIONS: [number, number, number, number, MuscleKey][] = [
  [82,  98,  20, 26, "chest"],
  [118, 98,  20, 26, "chest"],
  [100, 145, 18, 28, "abs"],
  [52,  76,  14, 12, "shoulders"],
  [148, 76,  14, 12, "shoulders"],
  [52,  98,  10, 22, "biceps"],
  [148, 98,  10, 22, "biceps"],
  [47,  148,  8, 18, "forearms"],
  [153, 148,  8, 18, "forearms"],
  [77,  228, 16, 34, "quads"],
  [123, 228, 16, 34, "quads"],
  [76,  305, 11, 24, "calves"],
  [124, 305, 11, 24, "calves"],
];

// Back muscle regions [cx, cy, rx, ry, muscle]
const BACK_REGIONS: [number, number, number, number, MuscleKey][] = [
  [100, 76,  30, 16, "traps"],
  [52,  76,  14, 12, "shoulders"],
  [148, 76,  14, 12, "shoulders"],
  [76,  116, 18, 30, "lats"],
  [124, 116, 18, 30, "lats"],
  [52,  98,  10, 22, "triceps"],
  [148, 98,  10, 22, "triceps"],
  [47,  148,  8, 18, "forearms"],
  [153, 148,  8, 18, "forearms"],
  [100, 148, 22, 20, "lower_back"],
  [78,  186, 18, 22, "glutes"],
  [122, 186, 18, 22, "glutes"],
  [77,  228, 14, 30, "hamstrings"],
  [123, 228, 14, 30, "hamstrings"],
  [76,  305, 11, 24, "calves"],
  [124, 305, 11, 24, "calves"],
];

function BodyMapSvg({ view, selected, onPress }: {
  view: "front" | "back";
  selected: MuscleKey | null;
  onPress: (m: MuscleKey) => void;
}) {
  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const fill = "#d1d5db";

  return (
    <Svg width="100%" height={290} viewBox="0 0 200 370" preserveAspectRatio="xMidYMid meet">
      <G>
        {/* Head */}
        <Circle cx={100} cy={24} r={20} fill={fill} />
        {/* Neck */}
        <Path d="M 91 42 L 109 42 L 109 56 L 91 56 Z" fill={fill} />
        {/* Shoulder bar */}
        <Path d="M 48 58 Q 74 52 100 54 Q 126 52 152 58 L 148 74 Q 124 78 100 78 Q 76 78 52 74 Z" fill={fill} />
        {/* Left upper arm */}
        <Path d="M 46 63 Q 38 72 36 100 Q 36 118 42 124 Q 48 128 58 126 Q 66 120 68 106 Q 70 82 62 66 Z" fill={fill} />
        {/* Right upper arm */}
        <Path d="M 154 63 Q 138 66 132 106 Q 130 120 134 126 Q 142 130 152 126 Q 162 120 164 100 Q 164 72 154 63 Z" fill={fill} />
        {/* Left forearm */}
        <Path d="M 38 126 Q 34 138 34 156 Q 34 168 38 172 L 58 172 Q 62 168 64 154 Q 66 138 60 128 Z" fill={fill} />
        {/* Right forearm */}
        <Path d="M 162 126 Q 140 128 136 154 Q 134 168 138 172 L 162 172 Q 166 168 166 156 Q 166 138 162 126 Z" fill={fill} />
        {/* Left hand */}
        <Ellipse cx={47} cy={179} rx={12} ry={9} fill={fill} />
        {/* Right hand */}
        <Ellipse cx={153} cy={179} rx={12} ry={9} fill={fill} />
        {/* Main torso */}
        <Path d="M 52 74 Q 54 112 56 142 Q 58 158 62 166 Q 80 172 100 172 Q 120 172 138 166 Q 142 158 144 142 Q 146 112 148 74 Q 124 78 100 78 Q 76 78 52 74 Z" fill={fill} />
        {/* Hip area */}
        <Path d="M 62 166 Q 60 178 60 192 L 140 192 Q 140 178 138 166 Q 120 172 100 172 Q 80 172 62 166 Z" fill={fill} />
        {/* Left thigh */}
        <Path d="M 60 192 Q 56 226 58 260 Q 62 268 76 270 Q 90 270 94 262 Q 98 248 96 210 L 96 192 Z" fill={fill} />
        {/* Right thigh */}
        <Path d="M 104 192 L 104 210 Q 102 248 106 262 Q 110 270 124 270 Q 138 268 142 260 Q 144 226 140 192 Z" fill={fill} />
        {/* Left knee */}
        <Ellipse cx={76} cy={274} rx={15} ry={8} fill={fill} />
        {/* Right knee */}
        <Ellipse cx={124} cy={274} rx={15} ry={8} fill={fill} />
        {/* Left calf */}
        <Path d="M 62 280 Q 58 306 60 332 Q 64 338 76 340 Q 90 338 94 332 Q 96 308 92 280 Z" fill={fill} />
        {/* Right calf */}
        <Path d="M 108 280 L 108 332 Q 110 338 124 340 Q 136 338 140 332 Q 142 308 138 280 Z" fill={fill} />
        {/* Left foot */}
        <Ellipse cx={76} cy={346} rx={20} ry={9} fill={fill} />
        {/* Right foot */}
        <Ellipse cx={124} cy={346} rx={20} ry={9} fill={fill} />
      </G>

      {/* Muscle region overlays */}
      {regions.map(([cx, cy, rx, ry, muscle], i) => {
        const isSelected = selected === muscle;
        const color = MUSCLE_GROUPS[muscle].color;
        return (
          <Ellipse
            key={`${muscle}-${i}`}
            cx={cx} cy={cy} rx={rx} ry={ry}
            fill={color}
            fillOpacity={isSelected ? 0.85 : 0.28}
            stroke={color}
            strokeWidth={isSelected ? 1.5 : 0}
            onPress={() => onPress(muscle)}
          />
        );
      })}
    </Svg>
  );
}

export default function ExploreScreen() {
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
            {/* Header */}
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

            {/* Body Map Card */}
            <View style={{ backgroundColor: "#fff", marginHorizontal: 16, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 14 }}>
              {/* Front / Back toggle */}
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
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: MUSCLE_GROUPS[selectedMuscle].color }} />
                  <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>{MUSCLE_GROUPS[selectedMuscle].label} selected</Text>
                  <TouchableOpacity onPress={() => setSelectedMuscle(null)}>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>  Clear ✕</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Muscle chips */}
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
          <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, marginHorizontal: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
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
