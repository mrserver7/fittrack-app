import React, { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Rect, Ellipse, G } from "react-native-svg";
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

// [x, y, width, height, muscle]
const FRONT_REGIONS: [number, number, number, number, MuscleKey][] = [
  [68, 82, 64, 46, "chest"],
  [74, 130, 52, 64, "abs"],
  [46, 67, 22, 20, "shoulders"],
  [132, 67, 22, 20, "shoulders"],
  [44, 96, 16, 36, "biceps"],
  [140, 96, 16, 36, "biceps"],
  [38, 133, 14, 30, "forearms"],
  [148, 133, 14, 30, "forearms"],
  [65, 215, 30, 64, "quads"],
  [105, 215, 30, 64, "quads"],
  [68, 285, 22, 48, "calves"],
  [110, 285, 22, 48, "calves"],
];

const BACK_REGIONS: [number, number, number, number, MuscleKey][] = [
  [70, 68, 60, 24, "traps"],
  [46, 67, 22, 20, "shoulders"],
  [132, 67, 22, 20, "shoulders"],
  [67, 94, 24, 48, "lats"],
  [109, 94, 24, 48, "lats"],
  [44, 96, 16, 36, "triceps"],
  [140, 96, 16, 36, "triceps"],
  [74, 143, 52, 33, "lower_back"],
  [66, 196, 30, 33, "glutes"],
  [104, 196, 30, 33, "glutes"],
  [66, 232, 28, 50, "hamstrings"],
  [106, 232, 28, 50, "hamstrings"],
  [68, 285, 22, 48, "calves"],
  [110, 285, 22, 48, "calves"],
];

function BodyMapSvg({ view, selected, onPress }: {
  view: "front" | "back";
  selected: MuscleKey | null;
  onPress: (m: MuscleKey) => void;
}) {
  const regions = view === "front" ? FRONT_REGIONS : BACK_REGIONS;
  const fill = "#d1d5db";

  return (
    <Svg width="100%" height={280} viewBox="0 0 200 370" preserveAspectRatio="xMidYMid meet">
      <G>
        <Circle cx={100} cy={30} r={22} fill={fill} />
        <Rect x={91} y={51} width={18} height={13} rx={4} fill={fill} />
        <Rect x={56} y={63} width={88} height={16} rx={8} fill={fill} />
        <Rect x={43} y={70} width={18} height={52} rx={8} fill={fill} />
        <Rect x={139} y={70} width={18} height={52} rx={8} fill={fill} />
        <Rect x={37} y={122} width={16} height={44} rx={7} fill={fill} />
        <Rect x={147} y={122} width={16} height={44} rx={7} fill={fill} />
        <Ellipse cx={45} cy={173} rx={12} ry={9} fill={fill} />
        <Ellipse cx={155} cy={173} rx={12} ry={9} fill={fill} />
        <Rect x={67} y={79} width={66} height={125} rx={10} fill={fill} />
        <Rect x={61} y={199} width={78} height={20} rx={8} fill={fill} />
        <Rect x={63} y={215} width={33} height={68} rx={10} fill={fill} />
        <Rect x={104} y={215} width={33} height={68} rx={10} fill={fill} />
        <Rect x={66} y={283} width={27} height={56} rx={8} fill={fill} />
        <Rect x={107} y={283} width={27} height={56} rx={8} fill={fill} />
        <Ellipse cx={78} cy={344} rx={20} ry={9} fill={fill} />
        <Ellipse cx={122} cy={344} rx={20} ry={9} fill={fill} />
      </G>
      {regions.map(([x, y, w, h, muscle], i) => {
        const isSelected = selected === muscle;
        const color = MUSCLE_GROUPS[muscle].color;
        return (
          <Rect
            key={`${muscle}-${i}`}
            x={x} y={y} width={w} height={h} rx={6}
            fill={color}
            fillOpacity={isSelected ? 0.85 : 0.25}
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
              <View style={{ flexDirection: "row", backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3, marginBottom: 10 }}>
                {(["front", "back"] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setBodyView(v)}
                    style={{ flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: bodyView === v ? "#fff" : "transparent", alignItems: "center",
                      shadowColor: bodyView === v ? "#000" : "transparent", shadowOpacity: 0.06, shadowRadius: 4, elevation: bodyView === v ? 2 : 0 }}
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
                <TouchableOpacity onPress={() => setSelectedMuscle(null)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: !selectedMuscle ? "#111827" : "#f3f4f6" }}>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: !selectedMuscle ? "#fff" : "#6b7280" }}>All</Text>
                </TouchableOpacity>
                {(Object.keys(MUSCLE_GROUPS) as MuscleKey[]).map((mg) => (
                  <TouchableOpacity key={mg} onPress={() => handleMusclePress(mg)}
                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedMuscle === mg ? MUSCLE_GROUPS[mg].color : "#f3f4f6" }}>
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
