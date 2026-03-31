import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/api/client";
import {
  ClipboardList, Plus, X, ChevronLeft, ChevronRight,
  Search, Dumbbell, Trash2, Calendar, Check, Minus,
} from "lucide-react-native";
import { useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkoutExercise { id: string }
interface WorkoutDay { exercises: WorkoutExercise[] }
interface ProgramWeek { id: string; weekNumber: number; days: WorkoutDay[] }
interface Program {
  id: string; name: string; description: string | null; durationWeeks: number;
  goalTag: string | null; weeks: ProgramWeek[]; _count: { clientPrograms: number };
}
interface ProgramsResponse { programs: Program[] }

interface Exercise {
  id: string; name: string; category: string;
  primaryMuscles: string | null; equipment: string | null;
  defaultSets: number | null; defaultReps: number | null;
}

// Local state types for building a program
interface DayExercise {
  exerciseId: string;
  exerciseName: string;
  category: string;
  primaryMuscles: string | null;
  sets: number;
  repsMin: number;
  repsMax: number | null;
  restSeconds: number;
}

interface WorkoutDayDraft {
  dayLabel: string;
  exercises: DayExercise[];
}

interface WeekDraft {
  weekNumber: number;
  days: WorkoutDayDraft[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOAL_TAGS = ["Weight Loss", "Muscle Gain", "Strength", "Endurance", "General Fitness", "Athletic Performance", "Rehabilitation"];
const DURATIONS = [4, 6, 8, 10, 12, 16];
const ALL_WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DEFAULT_DAYS = ["Monday", "Wednesday", "Friday"];

const CATEGORIES: Record<string, string> = {
  compound: "Compound",
  isolation: "Isolation",
  cardio: "Cardio",
  bodyweight: "Bodyweight",
  machine: "Machine",
  other: "Other",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countExercises(p: Program) {
  return p.weeks.reduce((t, w) => t + w.days.reduce((dt, d) => dt + d.exercises.length, 0), 0);
}

// ─── Number Stepper Component ─────────────────────────────────────────────────

function NumberStepper({ label, value, onChange, min = 1, max = 999, suffix }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; suffix?: string;
}) {
  return (
    <View style={ns.container}>
      <Text style={ns.label}>{label}</Text>
      <View style={ns.row}>
        <TouchableOpacity
          style={[ns.btn, value <= min && ns.btnDisabled]}
          onPress={() => value > min && onChange(value - 1)}
          disabled={value <= min}
        >
          <Minus size={14} color={value <= min ? "#d1d5db" : "#374151"} />
        </TouchableOpacity>
        <Text style={ns.value}>{value}{suffix || ""}</Text>
        <TouchableOpacity
          style={[ns.btn, value >= max && ns.btnDisabled]}
          onPress={() => value < max && onChange(value + 1)}
          disabled={value >= max}
        >
          <Plus size={14} color={value >= max ? "#d1d5db" : "#374151"} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ns = StyleSheet.create({
  container: { alignItems: "center", flex: 1 },
  label: { fontSize: 11, color: "#6b7280", marginBottom: 6, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  btn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#e5e7eb",
  },
  btnDisabled: { opacity: 0.4 },
  value: { fontSize: 16, fontWeight: "700", color: "#111827", minWidth: 36, textAlign: "center" },
});

// ─── Exercise Picker Modal ────────────────────────────────────────────────────

function ExercisePicker({ visible, onClose, onAdd }: {
  visible: boolean;
  onClose: () => void;
  onAdd: (ex: DayExercise) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [rest, setRest] = useState(60);

  const { data, isLoading } = useQuery<{ exercises: Exercise[] }>({
    queryKey: ["exercises-list"],
    queryFn: () => api.get("/api/exercises"),
    staleTime: 120_000,
    enabled: visible,
  });

  const exercises = data?.exercises ?? [];

  const filtered = useMemo(() => {
    let list = exercises;
    if (selectedCategory) list = list.filter((e) => e.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        e.name.toLowerCase().includes(q) ||
        (e.primaryMuscles || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [exercises, search, selectedCategory]);

  const handleSelect = (ex: Exercise) => {
    setSelectedExercise(ex);
    setSets(ex.defaultSets || 3);
    setReps(ex.defaultReps || 10);
    setRest(60);
  };

  const handleAdd = () => {
    if (!selectedExercise) return;
    onAdd({
      exerciseId: selectedExercise.id,
      exerciseName: selectedExercise.name,
      category: selectedExercise.category,
      primaryMuscles: selectedExercise.primaryMuscles,
      sets,
      repsMin: reps,
      repsMax: null,
      restSeconds: rest,
    });
    resetAndClose();
  };

  const resetAndClose = () => {
    setSearch("");
    setSelectedCategory("");
    setSelectedExercise(null);
    setSets(3);
    setReps(10);
    setRest(60);
    onClose();
  };

  // Configure exercise screen
  if (selectedExercise) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <View style={ep.header}>
            <TouchableOpacity onPress={() => setSelectedExercise(null)} style={ep.backBtn}>
              <ChevronLeft size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={ep.headerTitle} numberOfLines={1}>Configure Exercise</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Selected exercise card */}
            <View style={ep.selectedCard}>
              <View style={ep.selectedIcon}>
                <Dumbbell size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ep.selectedName}>{selectedExercise.name}</Text>
                <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                  <View style={ep.tag}>
                    <Text style={ep.tagText}>{CATEGORIES[selectedExercise.category] || selectedExercise.category}</Text>
                  </View>
                  {selectedExercise.primaryMuscles?.split(",").slice(0, 2).map((m) => (
                    <View key={m.trim()} style={[ep.tag, { backgroundColor: "#d1fae5" }]}>
                      <Text style={[ep.tagText, { color: "#047857" }]}>{m.trim()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Configuration */}
            <View style={ep.configCard}>
              <Text style={ep.configTitle}>Set Parameters</Text>
              <View style={ep.configRow}>
                <NumberStepper label="Sets" value={sets} onChange={setSets} min={1} max={10} />
                <NumberStepper label="Reps" value={reps} onChange={setReps} min={1} max={100} />
                <NumberStepper label="Rest" value={rest} onChange={setRest} min={15} max={300} suffix="s" />
              </View>
            </View>

            <TouchableOpacity style={ep.addBtn} onPress={handleAdd}>
              <Check size={18} color="#fff" />
              <Text style={ep.addBtnText}>Add to Day</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  // Exercise list screen
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View style={ep.header}>
          <Text style={ep.headerTitle}>Add Exercise</Text>
          <TouchableOpacity onPress={resetAndClose} style={ep.closeBtn}>
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Search bar */}
        <View style={ep.searchWrap}>
          <Search size={16} color="#9ca3af" />
          <TextInput
            style={ep.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <X size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44, marginBottom: 8 }}>
          <View style={{ flexDirection: "row", gap: 6, paddingHorizontal: 16, paddingVertical: 4 }}>
            <TouchableOpacity
              onPress={() => setSelectedCategory("")}
              style={[ep.catChip, !selectedCategory && ep.catChipActive]}
            >
              <Text style={[ep.catChipText, !selectedCategory && ep.catChipTextActive]}>All</Text>
            </TouchableOpacity>
            {Object.entries(CATEGORIES).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSelectedCategory(selectedCategory === key ? "" : key)}
                style={[ep.catChip, selectedCategory === key && ep.catChipActive]}
              >
                <Text style={[ep.catChipText, selectedCategory === key && ep.catChipTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={ep.countText}>
          {filtered.length} exercise{filtered.length !== 1 ? "s" : ""}
        </Text>

        {isLoading ? (
          <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity style={ep.exCard} onPress={() => handleSelect(item)} activeOpacity={0.7}>
                <View style={ep.exIcon}>
                  <Dumbbell size={16} color="#6b7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={ep.exName}>{item.name}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                    <View style={ep.tag}>
                      <Text style={ep.tagText}>{CATEGORIES[item.category] || item.category}</Text>
                    </View>
                    {item.primaryMuscles?.split(",").slice(0, 2).map((m) => (
                      <View key={m.trim()} style={[ep.tag, { backgroundColor: "#d1fae5" }]}>
                        <Text style={[ep.tagText, { color: "#047857" }]}>{m.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <ChevronRight size={16} color="#d1d5db" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <Dumbbell color="#d1d5db" size={32} />
                <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>No exercises found</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const ep = StyleSheet.create({
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827", flex: 1, textAlign: "center" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  backBtn: {
    width: 40, height: 32, borderRadius: 10, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row", alignItems: "center", margin: 16, marginBottom: 8,
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 12, paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: "#111827" },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb",
  },
  catChipActive: { backgroundColor: "#059669", borderColor: "#059669" },
  catChipText: { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  catChipTextActive: { color: "#fff", fontWeight: "700" },
  countText: { fontSize: 12, color: "#9ca3af", paddingHorizontal: 16, marginBottom: 8 },
  exCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb",
    padding: 14, marginBottom: 8,
  },
  exIcon: {
    width: 36, height: 36, backgroundColor: "#f3f4f6", borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  exName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  tag: { backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 11, color: "#6b7280", textTransform: "capitalize" },
  selectedCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#f0fdf4", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#bbf7d0", marginBottom: 20,
  },
  selectedIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: "#d1fae5",
    alignItems: "center", justifyContent: "center",
  },
  selectedName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  configCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18,
    borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 24,
  },
  configTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 16, textAlign: "center" },
  configRow: { flexDirection: "row", gap: 12 },
  addBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#059669", borderRadius: 12, paddingVertical: 14,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

// ─── Day Picker Dropdown ──────────────────────────────────────────────────────

function DayPicker({ usedDays, onSelect, onCancel }: {
  usedDays: string[];
  onSelect: (day: string) => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <TouchableOpacity style={dp.overlay} activeOpacity={1} onPress={onCancel}>
        <View style={dp.sheet}>
          <Text style={dp.sheetTitle}>Select Day</Text>
          {ALL_WEEKDAYS.map((day) => {
            const used = usedDays.includes(day);
            return (
              <TouchableOpacity
                key={day}
                style={[dp.dayRow, used && dp.dayRowUsed]}
                onPress={() => !used && onSelect(day)}
                disabled={used}
              >
                <Text style={[dp.dayText, used && dp.dayTextUsed]}>{day}</Text>
                {used && <Text style={dp.usedLabel}>Already added</Text>}
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={dp.cancelBtn} onPress={onCancel}>
            <Text style={dp.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const dp = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingTop: 20, paddingBottom: 40, paddingHorizontal: 20,
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12, textAlign: "center" },
  dayRow: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 10, marginBottom: 4,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  dayRowUsed: { backgroundColor: "#f3f4f6" },
  dayText: { fontSize: 15, fontWeight: "500", color: "#111827" },
  dayTextUsed: { color: "#d1d5db" },
  usedLabel: { fontSize: 12, color: "#d1d5db" },
  cancelBtn: {
    marginTop: 8, paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#f3f4f6", alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#6b7280" },
});

// ─── Create Program Modal (Multi-Step Wizard) ────────────────────────────────

function CreateProgramModal({ visible, onClose, onCreated }: {
  visible: boolean; onClose: () => void; onCreated: () => void;
}) {
  // Step 1: details, Step 2: build days
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [goalTag, setGoalTag] = useState("");

  // Step 2 fields
  const [weeks, setWeeks] = useState<WeekDraft[]>([]);
  const [activeWeekIdx, setActiveWeekIdx] = useState(0);
  const [activeDayIdx, setActiveDayIdx] = useState(0);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  const reset = () => {
    setStep(1);
    setName(""); setDescription(""); setDurationWeeks(8); setGoalTag("");
    setWeeks([]); setActiveWeekIdx(0); setActiveDayIdx(0);
  };

  const handleClose = () => {
    if (step === 2 && weeks.some((w) => w.days.some((d) => d.exercises.length > 0))) {
      Alert.alert("Discard Changes?", "You have exercises added. Are you sure you want to close?", [
        { text: "Cancel", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: () => { reset(); onClose(); } },
      ]);
    } else {
      reset();
      onClose();
    }
  };

  const goToStep2 = () => {
    if (!name.trim()) return Alert.alert("Required", "Please enter a program name.");
    // Initialize weeks with defaults
    const initialWeeks: WeekDraft[] = [
      {
        weekNumber: 1,
        days: DEFAULT_DAYS.map((d) => ({ dayLabel: d, exercises: [] })),
      },
    ];
    setWeeks(initialWeeks);
    setActiveWeekIdx(0);
    setActiveDayIdx(0);
    setStep(2);
  };

  const goBackToStep1 = () => {
    setStep(1);
  };

  // Week management
  const activeWeek = weeks[activeWeekIdx];
  const activeDay = activeWeek?.days[activeDayIdx];

  const addWeek = () => {
    const newWeek: WeekDraft = {
      weekNumber: weeks.length + 1,
      days: DEFAULT_DAYS.map((d) => ({ dayLabel: d, exercises: [] })),
    };
    setWeeks([...weeks, newWeek]);
    setActiveWeekIdx(weeks.length);
    setActiveDayIdx(0);
  };

  const removeWeek = (idx: number) => {
    if (weeks.length <= 1) return Alert.alert("Cannot Remove", "Program must have at least one week.");
    Alert.alert("Remove Week?", `Remove Week ${idx + 1} and all its exercises?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: () => {
          const updated = weeks.filter((_, i) => i !== idx).map((w, i) => ({ ...w, weekNumber: i + 1 }));
          setWeeks(updated);
          if (activeWeekIdx >= updated.length) setActiveWeekIdx(updated.length - 1);
          setActiveDayIdx(0);
        },
      },
    ]);
  };

  // Day management
  const addDay = (dayLabel: string) => {
    const updated = [...weeks];
    updated[activeWeekIdx] = {
      ...updated[activeWeekIdx],
      days: [...updated[activeWeekIdx].days, { dayLabel, exercises: [] }],
    };
    // Sort days by weekday order
    updated[activeWeekIdx].days.sort(
      (a, b) => ALL_WEEKDAYS.indexOf(a.dayLabel) - ALL_WEEKDAYS.indexOf(b.dayLabel)
    );
    setWeeks(updated);
    setActiveDayIdx(updated[activeWeekIdx].days.findIndex((d) => d.dayLabel === dayLabel));
    setShowDayPicker(false);
  };

  const removeDay = (dayIdx: number) => {
    if (!activeWeek || activeWeek.days.length <= 1) {
      return Alert.alert("Cannot Remove", "Week must have at least one day.");
    }
    const day = activeWeek.days[dayIdx];
    const doRemove = () => {
      const updated = [...weeks];
      updated[activeWeekIdx] = {
        ...updated[activeWeekIdx],
        days: updated[activeWeekIdx].days.filter((_, i) => i !== dayIdx),
      };
      setWeeks(updated);
      if (activeDayIdx >= updated[activeWeekIdx].days.length) {
        setActiveDayIdx(Math.max(0, updated[activeWeekIdx].days.length - 1));
      }
    };
    if (day.exercises.length > 0) {
      Alert.alert("Remove Day?", `Remove ${day.dayLabel} and its ${day.exercises.length} exercise(s)?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: doRemove },
      ]);
    } else {
      doRemove();
    }
  };

  // Exercise management for active day
  const addExerciseToDay = (ex: DayExercise) => {
    const updated = [...weeks];
    const day = updated[activeWeekIdx].days[activeDayIdx];
    day.exercises = [...day.exercises, ex];
    setWeeks(updated);
  };

  const removeExerciseFromDay = (exIdx: number) => {
    const updated = [...weeks];
    updated[activeWeekIdx].days[activeDayIdx].exercises =
      updated[activeWeekIdx].days[activeDayIdx].exercises.filter((_, i) => i !== exIdx);
    setWeeks(updated);
  };

  const moveExercise = (exIdx: number, direction: "up" | "down") => {
    const updated = [...weeks];
    const exList = [...updated[activeWeekIdx].days[activeDayIdx].exercises];
    const newIdx = direction === "up" ? exIdx - 1 : exIdx + 1;
    if (newIdx < 0 || newIdx >= exList.length) return;
    [exList[exIdx], exList[newIdx]] = [exList[newIdx], exList[exIdx]];
    updated[activeWeekIdx].days[activeDayIdx].exercises = exList;
    setWeeks(updated);
  };

  // Create program
  const handleCreate = async () => {
    const totalExercises = weeks.reduce(
      (t, w) => t + w.days.reduce((dt, d) => dt + d.exercises.length, 0), 0
    );
    if (totalExercises === 0) {
      return Alert.alert("No Exercises", "Add at least one exercise to a workout day.");
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        durationWeeks,
        goalTag: goalTag || null,
        weeks: weeks.map((w) => ({
          weekNumber: w.weekNumber,
          days: w.days.map((d, dayIdx) => ({
            dayLabel: d.dayLabel,
            dayOrder: dayIdx,
            exercises: d.exercises.map((ex, sortIdx) => ({
              exerciseId: ex.exerciseId,
              sets: ex.sets,
              repsMin: ex.repsMin,
              repsMax: ex.repsMax,
              restSeconds: ex.restSeconds,
              sortOrder: sortIdx,
            })),
          })),
        })),
      };
      await api.post("/api/programs", payload);
      reset();
      onCreated();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create program.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  const usedDays = activeWeek?.days.map((d) => d.dayLabel) ?? [];
  const totalExerciseCount = weeks.reduce(
    (t, w) => t + w.days.reduce((dt, d) => dt + d.exercises.length, 0), 0
  );

  // ─── Step 1: Program Details ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={ms.modalHeader}>
              <Text style={ms.modalTitle}>New Program</Text>
              <TouchableOpacity onPress={handleClose} style={ms.closeBtn}>
                <X size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={ms.modalBody} keyboardShouldPersistTaps="handled">
              {/* Step indicator */}
              <View style={ms.stepRow}>
                <View style={[ms.stepDot, ms.stepDotActive]} />
                <View style={ms.stepLine} />
                <View style={ms.stepDot} />
              </View>
              <Text style={ms.stepLabel}>Step 1 of 2 — Program Details</Text>

              <View style={ms.field}>
                <Text style={ms.label}>Program Name *</Text>
                <TextInput
                  style={ms.input}
                  placeholder="e.g. 8-Week Strength Builder"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={ms.field}>
                <Text style={ms.label}>Description</Text>
                <TextInput
                  style={[ms.input, ms.textArea]}
                  placeholder="Brief overview of this program..."
                  placeholderTextColor="#9ca3af"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={ms.field}>
                <Text style={ms.label}>Duration</Text>
                <View style={ms.chipRow}>
                  {DURATIONS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[ms.chip, durationWeeks === d && ms.chipActive]}
                      onPress={() => setDurationWeeks(d)}
                    >
                      <Text style={[ms.chipText, durationWeeks === d && ms.chipTextActive]}>{d}w</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={ms.field}>
                <Text style={ms.label}>Goal Tag</Text>
                <View style={ms.chipRow}>
                  {GOAL_TAGS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[ms.chip, goalTag === g && ms.chipActive]}
                      onPress={() => setGoalTag(goalTag === g ? "" : g)}
                    >
                      <Text style={[ms.chipText, goalTag === g && ms.chipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={ms.nextBtn} onPress={goToStep2}>
                <Text style={ms.nextBtnText}>Next: Add Exercises</Text>
                <ChevronRight size={18} color="#fff" />
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ─── Step 2: Build Workout Days ───────────────────────────────────────────
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        {/* Header */}
        <View style={ms.modalHeader}>
          <TouchableOpacity onPress={goBackToStep1} style={ms.backBtn}>
            <ChevronLeft size={20} color="#374151" />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={ms.modalTitle}>{name}</Text>
            <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
              {totalExerciseCount} exercise{totalExerciseCount !== 1 ? "s" : ""} added
            </Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={ms.closeBtn}>
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Step indicator */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4, backgroundColor: "#fff" }}>
          <View style={ms.stepRow}>
            <View style={[ms.stepDot, ms.stepDotDone]} >
              <Check size={10} color="#fff" />
            </View>
            <View style={[ms.stepLine, ms.stepLineDone]} />
            <View style={[ms.stepDot, ms.stepDotActive]} />
          </View>
          <Text style={ms.stepLabel}>Step 2 of 2 — Build Workouts</Text>
        </View>

        {/* Week tabs */}
        <View style={ws.weekTabRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
            {weeks.map((w, i) => (
              <TouchableOpacity
                key={i}
                style={[ws.weekTab, activeWeekIdx === i && ws.weekTabActive]}
                onPress={() => { setActiveWeekIdx(i); setActiveDayIdx(0); }}
                onLongPress={() => removeWeek(i)}
              >
                <Text style={[ws.weekTabText, activeWeekIdx === i && ws.weekTabTextActive]}>
                  Week {w.weekNumber}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={ws.addWeekBtn} onPress={addWeek}>
              <Plus size={14} color="#059669" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {activeWeek && (
          <>
            {/* Day tabs */}
            <View style={ws.dayTabRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
                {activeWeek.days.map((d, i) => (
                  <TouchableOpacity
                    key={d.dayLabel}
                    style={[ws.dayTab, activeDayIdx === i && ws.dayTabActive]}
                    onPress={() => setActiveDayIdx(i)}
                    onLongPress={() => removeDay(i)}
                  >
                    <Text style={[ws.dayTabText, activeDayIdx === i && ws.dayTabTextActive]}>
                      {d.dayLabel.slice(0, 3)}
                    </Text>
                    {d.exercises.length > 0 && (
                      <View style={[ws.dayBadge, activeDayIdx === i && ws.dayBadgeActive]}>
                        <Text style={[ws.dayBadgeText, activeDayIdx === i && ws.dayBadgeTextActive]}>
                          {d.exercises.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {usedDays.length < 7 && (
                  <TouchableOpacity style={ws.addDayBtn} onPress={() => setShowDayPicker(true)}>
                    <Plus size={14} color="#059669" />
                    <Text style={{ fontSize: 12, color: "#059669", fontWeight: "600" }}>Day</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </View>

            {/* Exercises list for active day */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
              {activeDay && (
                <>
                  <View style={ws.dayHeader}>
                    <View style={ws.dayIcon}>
                      <Calendar size={16} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ws.dayTitle}>{activeDay.dayLabel}</Text>
                      <Text style={ws.daySubtitle}>
                        {activeDay.exercises.length} exercise{activeDay.exercises.length !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    {activeWeek.days.length > 1 && (
                      <TouchableOpacity onPress={() => removeDay(activeDayIdx)} style={ws.removeDayBtn}>
                        <Trash2 size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {activeDay.exercises.length === 0 ? (
                    <View style={ws.emptyDay}>
                      <Dumbbell size={32} color="#d1d5db" />
                      <Text style={ws.emptyDayText}>No exercises yet</Text>
                      <Text style={ws.emptyDaySubtext}>Tap the button below to add exercises</Text>
                    </View>
                  ) : (
                    activeDay.exercises.map((ex, exIdx) => (
                      <View key={`${ex.exerciseId}-${exIdx}`} style={ws.exCard}>
                        <View style={ws.exCardHeader}>
                          <View style={ws.exOrderBadge}>
                            <Text style={ws.exOrderText}>{exIdx + 1}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={ws.exCardName}>{ex.exerciseName}</Text>
                            <View style={{ flexDirection: "row", gap: 4, marginTop: 3 }}>
                              {ex.primaryMuscles?.split(",").slice(0, 2).map((m) => (
                                <View key={m.trim()} style={ws.muscleTag}>
                                  <Text style={ws.muscleTagText}>{m.trim()}</Text>
                                </View>
                              ))}
                            </View>
                          </View>
                          <View style={{ flexDirection: "row", gap: 4 }}>
                            {exIdx > 0 && (
                              <TouchableOpacity style={ws.moveBtn} onPress={() => moveExercise(exIdx, "up")}>
                                <Text style={ws.moveBtnText}>^</Text>
                              </TouchableOpacity>
                            )}
                            {exIdx < activeDay.exercises.length - 1 && (
                              <TouchableOpacity style={ws.moveBtn} onPress={() => moveExercise(exIdx, "down")}>
                                <Text style={ws.moveBtnText}>v</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity style={ws.removeExBtn} onPress={() => removeExerciseFromDay(exIdx)}>
                              <X size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <View style={ws.exParams}>
                          <View style={ws.exParam}>
                            <Text style={ws.exParamValue}>{ex.sets}</Text>
                            <Text style={ws.exParamLabel}>sets</Text>
                          </View>
                          <View style={ws.exParamDivider} />
                          <View style={ws.exParam}>
                            <Text style={ws.exParamValue}>{ex.repsMin}</Text>
                            <Text style={ws.exParamLabel}>reps</Text>
                          </View>
                          <View style={ws.exParamDivider} />
                          <View style={ws.exParam}>
                            <Text style={ws.exParamValue}>{ex.restSeconds}s</Text>
                            <Text style={ws.exParamLabel}>rest</Text>
                          </View>
                        </View>
                      </View>
                    ))
                  )}

                  {/* Add exercise button */}
                  <TouchableOpacity style={ws.addExBtn} onPress={() => setShowExercisePicker(true)}>
                    <Plus size={16} color="#059669" />
                    <Text style={ws.addExBtnText}>Add Exercise</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Bottom bar: Create Program */}
            <View style={ws.bottomBar}>
              <TouchableOpacity
                style={[ws.createBtn, (saving || totalExerciseCount === 0) && ws.createBtnDisabled]}
                onPress={handleCreate}
                disabled={saving || totalExerciseCount === 0}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Check size={18} color="#fff" />
                    <Text style={ws.createBtnText}>Create Program</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Day picker */}
        {showDayPicker && (
          <DayPicker
            usedDays={usedDays}
            onSelect={addDay}
            onCancel={() => setShowDayPicker(false)}
          />
        )}

        {/* Exercise picker */}
        <ExercisePicker
          visible={showExercisePicker}
          onClose={() => setShowExercisePicker(false)}
          onAdd={addExerciseToDay}
        />
      </SafeAreaView>
    </Modal>
  );
}

// ─── Wizard Styles ────────────────────────────────────────────────────────────

const ws = StyleSheet.create({
  weekTabRow: {
    backgroundColor: "#fff", paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  weekTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb",
  },
  weekTabActive: { backgroundColor: "#059669", borderColor: "#059669" },
  weekTabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  weekTabTextActive: { color: "#fff", fontWeight: "700" },
  addWeekBtn: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: "#059669",
    borderStyle: "dashed", alignItems: "center", justifyContent: "center",
  },
  dayTabRow: {
    backgroundColor: "#fff", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  dayTab: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8,
    backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb",
  },
  dayTabActive: { backgroundColor: "#ecfdf5", borderColor: "#059669" },
  dayTabText: { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  dayTabTextActive: { color: "#059669", fontWeight: "700" },
  dayBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  dayBadgeActive: { backgroundColor: "#059669" },
  dayBadgeText: { fontSize: 10, fontWeight: "700", color: "#6b7280" },
  dayBadgeTextActive: { color: "#fff" },
  addDayBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8,
    borderWidth: 1.5, borderColor: "#059669", borderStyle: "dashed",
  },
  dayHeader: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16,
  },
  dayIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#d1fae5",
    alignItems: "center", justifyContent: "center",
  },
  dayTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  daySubtitle: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  removeDayBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: "#fef2f2",
    alignItems: "center", justifyContent: "center",
  },
  emptyDay: { alignItems: "center", paddingVertical: 40 },
  emptyDayText: { fontSize: 15, fontWeight: "600", color: "#9ca3af", marginTop: 12 },
  emptyDaySubtext: { fontSize: 13, color: "#d1d5db", marginTop: 4 },
  exCard: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb",
    padding: 14, marginBottom: 10,
  },
  exCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  exOrderBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: "#f0fdf4",
    borderWidth: 1, borderColor: "#bbf7d0",
    alignItems: "center", justifyContent: "center",
  },
  exOrderText: { fontSize: 13, fontWeight: "700", color: "#059669" },
  exCardName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  muscleTag: {
    backgroundColor: "#d1fae5", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6,
  },
  muscleTagText: { fontSize: 10, color: "#047857", textTransform: "capitalize" },
  moveBtn: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  moveBtnText: { fontSize: 14, fontWeight: "700", color: "#6b7280" },
  removeExBtn: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: "#fef2f2",
    alignItems: "center", justifyContent: "center",
  },
  exParams: {
    flexDirection: "row", backgroundColor: "#f9fafb", borderRadius: 8,
    padding: 10, marginTop: 10,
  },
  exParam: { flex: 1, alignItems: "center" },
  exParamValue: { fontSize: 15, fontWeight: "700", color: "#111827" },
  exParamLabel: { fontSize: 10, color: "#9ca3af", marginTop: 1 },
  exParamDivider: { width: 1, backgroundColor: "#e5e7eb" },
  addExBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#059669", borderStyle: "dashed",
    marginTop: 4,
  },
  addExBtnText: { fontSize: 14, fontWeight: "700", color: "#059669" },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb",
    padding: 16, paddingBottom: Platform.OS === "ios" ? 34 : 16,
  },
  createBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#059669", borderRadius: 12, paddingVertical: 14,
  },
  createBtnDisabled: { opacity: 0.5 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

// ─── Main Program List Screen ─────────────────────────────────────────────────

export default function TrainerPrograms() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery<ProgramsResponse>({
    queryKey: ["trainer-programs"],
    queryFn: () => api.get<ProgramsResponse>("/api/programs"),
  });

  const programs = data?.programs ?? [];

  const renderItem = ({ item }: { item: Program }) => {
    const exerciseCount = countExercises(item);
    const activeClients = item._count.clientPrograms;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <ClipboardList size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.programName}>{item.name}</Text>
            {item.goalTag && (
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>{item.goalTag}</Text>
              </View>
            )}
          </View>
          {activeClients > 0 && (
            <View style={styles.clientsBadge}>
              <Text style={styles.clientsBadgeText}>{activeClients} active</Text>
            </View>
          )}
        </View>
        {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.durationWeeks}</Text>
            <Text style={styles.statLabel}>weeks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.weeks.length}</Text>
            <Text style={styles.statLabel}>phases</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{exerciseCount}</Text>
            <Text style={styles.statLabel}>exercises</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Programs</Text>
          <Text style={styles.subtitle}>{programs.length} program{programs.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Plus size={18} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <ClipboardList size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No programs yet</Text>
              <Text style={styles.emptySubText}>Tap "New" to create your first program.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
                <Plus size={16} color="#059669" />
                <Text style={styles.emptyBtnText}>Create Program</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateProgramModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["trainer-programs"] })}
      />
    </SafeAreaView>
  );
}

// ─── List Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#059669", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "#d1fae5",
    alignItems: "center", justifyContent: "center",
  },
  programName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  goalBadge: {
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    alignSelf: "flex-start", marginTop: 4,
  },
  goalBadgeText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  clientsBadge: { backgroundColor: "#059669", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  clientsBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  description: { fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 18 },
  statsRow: {
    flexDirection: "row", backgroundColor: "#f9fafb",
    borderRadius: 10, padding: 12, marginTop: 4,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#e5e7eb" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: "#9ca3af", textAlign: "center", marginBottom: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#059669", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, color: "#059669", fontWeight: "700" },
});

// ─── Modal Styles ─────────────────────────────────────────────────────────────

const ms = StyleSheet.create({
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  backBtn: {
    width: 40, height: 32, borderRadius: 10, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  modalBody: { padding: 20, paddingBottom: 40 },
  stepRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    marginBottom: 6,
  },
  stepDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center",
  },
  stepDotActive: { backgroundColor: "#059669" },
  stepDotDone: { backgroundColor: "#059669" },
  stepLine: { width: 40, height: 2, backgroundColor: "#e5e7eb", marginHorizontal: 8 },
  stepLineDone: { backgroundColor: "#059669" },
  stepLabel: { fontSize: 12, color: "#9ca3af", textAlign: "center", marginBottom: 20 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: "#111827", backgroundColor: "#fff",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#059669", borderColor: "#059669" },
  chipText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#059669", borderRadius: 12, paddingVertical: 14, marginTop: 8,
  },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
