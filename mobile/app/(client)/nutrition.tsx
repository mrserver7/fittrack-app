import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Apple, Plus, Trash2, Coffee, UtensilsCrossed, Cookie } from "lucide-react-native";
import { api } from "@/src/api/client";

type Meal = {
  id: string;
  meal: string;
  name: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

type Totals = { calories: number; protein: number; carbs: number; fat: number };

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export default function NutritionScreen() {
  const today = new Date().toISOString().split("T")[0];
  const [meals, setMeals] = useState<Meal[]>([]);
  const [totals, setTotals] = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addMeal, setAddMeal] = useState("breakfast");
  const [form, setForm] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "" });

  const fetchData = async () => {
    try {
      const data = await api.get<{ meals: Meal[]; totals: Totals }>(`/api/nutrition/daily?date=${today}`);
      setMeals(data.meals || []);
      setTotals(data.totals || { calories: 0, protein: 0, carbs: 0, fat: 0 });
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async () => {
    try {
      await api.post("/api/nutrition", {
        date: today,
        meal: addMeal,
        name: form.name || null,
        calories: form.calories ? parseInt(form.calories) : null,
        protein: form.protein ? parseFloat(form.protein) : null,
        carbs: form.carbs ? parseFloat(form.carbs) : null,
        fat: form.fat ? parseFloat(form.fat) : null,
      });
      setShowAdd(false);
      setForm({ name: "", calories: "", protein: "", carbs: "", fat: "" });
      fetchData();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/nutrition/${id}`);
      fetchData();
    } catch {}
  };

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <View style={{ width: 40, height: 40, backgroundColor: "#d1fae5", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
            <Apple color="#059669" size={20} />
          </View>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>Nutrition</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>Track your daily meals & macros</Text>
          </View>
        </View>

        {/* Macro summary */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Calories", value: totals.calories, unit: "kcal", color: "#059669" },
            { label: "Protein", value: Math.round(totals.protein), unit: "g", color: "#3b82f6" },
            { label: "Carbs", value: Math.round(totals.carbs), unit: "g", color: "#f59e0b" },
            { label: "Fat", value: Math.round(totals.fat), unit: "g", color: "#ef4444" },
          ].map((m) => (
            <View key={m.label} style={{ flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb" }}>
              <Text style={{ fontSize: 11, color: "#6b7280" }}>{m.label}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#111827" }}>{m.value}</Text>
              <Text style={{ fontSize: 10, color: "#9ca3af" }}>{m.unit}</Text>
            </View>
          ))}
        </View>

        {/* Meals by type */}
        {MEAL_TYPES.map((mealType) => {
          const items = meals.filter((m) => m.meal === mealType);
          return (
            <View key={mealType} style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12, overflow: "hidden" }}>
              <View style={{ flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" }}>{MEAL_LABELS[mealType]}</Text>
                <Text style={{ fontSize: 12, color: "#9ca3af" }}>{items.reduce((s, m) => s + (m.calories || 0), 0)} kcal</Text>
              </View>
              {items.length === 0 ? (
                <Text style={{ padding: 12, fontSize: 12, color: "#9ca3af", textAlign: "center" }}>No entries</Text>
              ) : (
                items.map((item) => (
                  <View key={item.id} style={{ flexDirection: "row", alignItems: "center", padding: 12, borderBottomWidth: 1, borderBottomColor: "#f9fafb" }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, color: "#111827" }}>{item.name || mealType}</Text>
                      <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                        {item.calories || 0} kcal · {item.protein || 0}g P · {item.carbs || 0}g C · {item.fat || 0}g F
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 6 }}>
                      <Trash2 color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          );
        })}

        {/* Add meal */}
        {showAdd ? (
          <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 16, gap: 12 }}>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {MEAL_TYPES.map((m) => (
                <TouchableOpacity key={m} onPress={() => setAddMeal(m)}
                  style={{ flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center", backgroundColor: addMeal === m ? "#d1fae5" : "#f3f4f6" }}>
                  <Text style={{ fontSize: 12, fontWeight: "500", color: addMeal === m ? "#047857" : "#6b7280" }}>{MEAL_LABELS[m]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput value={form.name} onChangeText={(v) => setForm({ ...form, name: v })}
              placeholder="Food name" style={{ backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, fontSize: 14 }} />
            <View style={{ flexDirection: "row", gap: 6 }}>
              {(["calories", "protein", "carbs", "fat"] as const).map((f) => (
                <TextInput key={f} value={form[f]} onChangeText={(v) => setForm({ ...form, [f]: v })}
                  placeholder={f.charAt(0).toUpperCase() + f.slice(1)} keyboardType="numeric"
                  style={{ flex: 1, backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 10, fontSize: 13, textAlign: "center" }} />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TouchableOpacity onPress={() => setShowAdd(false)} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: "#374151" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAdd} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: "#059669", alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowAdd(true)}
            style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, paddingVertical: 14, borderWidth: 2, borderStyle: "dashed", borderColor: "#e5e7eb", borderRadius: 12 }}>
            <Plus color="#6b7280" size={16} />
            <Text style={{ fontSize: 14, color: "#6b7280" }}>Log Meal</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
