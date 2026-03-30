import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Target, Check, Plus } from "lucide-react-native";
import { api } from "@/src/api/client";

type Habit = {
  id: string;
  name: string;
  icon: string | null;
  targetValue: number | null;
  unit: string | null;
  logs: { date: string; value: number }[];
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split("T")[0];

  const fetchHabits = async () => {
    try {
      const data = await api.get<{ habits: Habit[] }>("/api/habits");
      setHabits(data.habits || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchHabits(); }, []);

  const toggleHabit = async (habitId: string) => {
    const habit = habits.find((h) => h.id === habitId);
    if (!habit || habit.logs.some((l) => l.date === today)) return;
    try {
      await api.post("/api/habits/log", { habitId, date: today, value: 1 });
      fetchHabits();
    } catch {}
  };

  // Build 7-day date array
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  const dayLabels = dates.map((d) => new Date(d).toLocaleDateString("en", { weekday: "short" }).slice(0, 2));

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <View style={{ width: 40, height: 40, backgroundColor: "#dbeafe", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
            <Target color="#2563eb" size={20} />
          </View>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>Habits</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>Track your daily habits</Text>
          </View>
        </View>

        {habits.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, backgroundColor: "#fff", borderRadius: 16, borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed" }}>
            <Plus color="#d1d5db" size={28} />
            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>No habits assigned yet</Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Your trainer will set up daily habits for you</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", padding: 16 }}>
            {/* Day headers */}
            <View style={{ flexDirection: "row", marginBottom: 12 }}>
              <View style={{ flex: 1 }} />
              {dayLabels.map((label, i) => (
                <View key={i} style={{ width: 32, alignItems: "center" }}>
                  <Text style={{ fontSize: 11, fontWeight: "500", color: dates[i] === today ? "#059669" : "#9ca3af" }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Habit rows */}
            {habits.map((habit) => (
              <View key={habit.id} style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{habit.icon || "+"}</Text>
                  <Text style={{ fontSize: 13, color: "#111827" }} numberOfLines={1}>{habit.name}</Text>
                </View>
                {dates.map((date, i) => {
                  const done = habit.logs.some((l) => l.date === date);
                  const isToday = date === today;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={isToday && !done ? () => toggleHabit(habit.id) : undefined}
                      disabled={!isToday || done}
                      style={{
                        width: 28, height: 28, borderRadius: 8, marginHorizontal: 2,
                        justifyContent: "center", alignItems: "center",
                        backgroundColor: done ? "#10b981" : isToday ? "#f3f4f6" : "#fafafa",
                        borderWidth: isToday && !done ? 2 : 0,
                        borderColor: "#6ee7b7",
                        borderStyle: isToday && !done ? "dashed" : "solid",
                      }}>
                      {done && <Check color="#fff" size={14} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Weekly summary */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 10, marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: "#9ca3af" }}>This week</Text>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#111827" }}>
                {habits.reduce((sum, h) => sum + h.logs.filter((l) => dates.includes(l.date)).length, 0)} / {habits.length * 7} completed
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
