import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Compass, Dumbbell, Search } from "lucide-react-native";
import { api } from "@/src/api/client";

type Exercise = {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string | null;
  bodyRegions: string | null;
  videoUrl: string | null;
};

const MUSCLE_GROUPS = [
  { key: "chest", label: "Chest", color: "#10B981" },
  { key: "back", label: "Back", color: "#3B82F6" },
  { key: "shoulders", label: "Shoulders", color: "#8B5CF6" },
  { key: "biceps", label: "Biceps", color: "#F59E0B" },
  { key: "triceps", label: "Triceps", color: "#EF4444" },
  { key: "abs", label: "Abs", color: "#14B8A6" },
  { key: "quads", label: "Quads", color: "#F97316" },
  { key: "hamstrings", label: "Hamstrings", color: "#84CC16" },
  { key: "glutes", label: "Glutes", color: "#D946EF" },
  { key: "calves", label: "Calves", color: "#06B6D4" },
  { key: "traps", label: "Traps", color: "#A855F7" },
  { key: "lats", label: "Lats", color: "#2563EB" },
  { key: "forearms", label: "Forearms", color: "#EC4899" },
  { key: "lower_back", label: "Lower Back", color: "#DC2626" },
];

export default function ExploreScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ exercises: Exercise[] }>("/api/exercises").then((data) => {
      setAllExercises(data.exercises || []);
      setExercises(data.exercises || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedMuscle) {
      setExercises(allExercises);
      return;
    }
    const mg = MUSCLE_GROUPS.find((m) => m.key === selectedMuscle);
    const label = mg?.label.toLowerCase() || selectedMuscle;
    const filtered = allExercises.filter((ex) => {
      const primary = (ex.primaryMuscles || "").toLowerCase();
      const regions = (ex.bodyRegions || "").toLowerCase();
      return primary.includes(label) || regions.includes(label) || primary.includes(selectedMuscle) || regions.includes(selectedMuscle);
    });
    setExercises(filtered);
  }, [selectedMuscle, allExercises]);

  const displayed = search
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      {/* Header */}
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <View style={{ width: 40, height: 40, backgroundColor: "#ede9fe", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
            <Compass color="#7c3aed" size={20} />
          </View>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>Explore</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>Tap a muscle group to filter</Text>
          </View>
        </View>

        {/* Search */}
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 }}>
          <Search color="#9ca3af" size={16} />
          <TextInput value={search} onChangeText={setSearch} placeholder="Search exercises..."
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: "#111827" }} />
        </View>

        {/* Muscle group chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 6, paddingRight: 16 }}>
            <TouchableOpacity onPress={() => setSelectedMuscle(null)}
              style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: !selectedMuscle ? "#111827" : "#f3f4f6" }}>
              <Text style={{ fontSize: 12, fontWeight: "500", color: !selectedMuscle ? "#fff" : "#6b7280" }}>All</Text>
            </TouchableOpacity>
            {MUSCLE_GROUPS.map((mg) => (
              <TouchableOpacity key={mg.key} onPress={() => setSelectedMuscle(mg.key === selectedMuscle ? null : mg.key)}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: selectedMuscle === mg.key ? mg.color : "#f3f4f6" }}>
                <Text style={{ fontSize: 12, fontWeight: "500", color: selectedMuscle === mg.key ? "#fff" : "#6b7280" }}>{mg.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Exercise list */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Dumbbell color="#d1d5db" size={32} />
              <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>No exercises found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 12 }}>
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
      )}
    </SafeAreaView>
  );
}
