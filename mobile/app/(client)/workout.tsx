import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback, useEffect } from "react";
import { Moon, Dumbbell, CheckCircle, SkipForward, MoveRight, ChevronDown, ChevronUp, Search } from "lucide-react-native";
import { useAuthStore } from "@/src/store/auth-store";
import {
  useToday, useStartSession, useLogSet, useCompleteSession, useCreateOverride,
  type WorkoutExercise,
} from "@/src/api/queries";
import { api } from "@/src/api/client";

type Exercise = { id: string; name: string; category: string; primaryMuscles: string | null };

function ExerciseBrowser() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ exercises: Exercise[] }>("/api/exercises")
      .then((d) => { setExercises(d.exercises || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const displayed = search
    ? exercises.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>Browse Exercises</Text>
        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>No program assigned — explore all exercises</Text>
        <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#f9fafb", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 12, marginTop: 12 }}>
          <Search color="#9ca3af" size={16} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#9ca3af"
            style={{ flex: 1, paddingVertical: 10, paddingLeft: 8, fontSize: 14, color: "#111827" }}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Dumbbell color="#d1d5db" size={32} />
              <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 8 }}>No exercises found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 38, height: 38, backgroundColor: "#f0fdf4", borderRadius: 10, justifyContent: "center", alignItems: "center" }}>
                <Dumbbell color="#059669" size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>{item.name}</Text>
                <View style={{ flexDirection: "row", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
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
    </View>
  );
}

interface SetEntry { weight: string; reps: string; logged: boolean }

function ExerciseCard({
  ex, sessionId, clientId, setEntries, onSetChange, onLogSet,
}: {
  ex: WorkoutExercise;
  sessionId: string;
  clientId: string;
  setEntries: SetEntry[];
  onSetChange: (setIdx: number, field: "weight" | "reps", val: string) => void;
  onLogSet: (setIdx: number) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={s.exCard}>
      <TouchableOpacity style={s.exHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <View style={s.exMeta}>
          <Text style={s.exName}>{ex.exercise.name}</Text>
          <Text style={s.exMuscle}>
            {ex.exercise.primaryMuscles ?? ex.exercise.category} · {ex.sets} × {ex.reps}
          </Text>
        </View>
        {expanded ? <ChevronUp size={18} color="#9ca3af" /> : <ChevronDown size={18} color="#9ca3af" />}
      </TouchableOpacity>

      {expanded && (
        <View style={s.exBody}>
          <View style={s.setHeaderRow}>
            <Text style={[s.setColLabel, { width: 32 }]}>Set</Text>
            <Text style={[s.setColLabel, { flex: 1 }]}>Weight (kg)</Text>
            <Text style={[s.setColLabel, { flex: 1 }]}>Reps</Text>
            <Text style={[s.setColLabel, { width: 56 }]}></Text>
          </View>

          {setEntries.map((entry, idx) => (
            <View key={idx} style={[s.setRow, entry.logged && s.setRowDone]}>
              <Text style={[s.setNum, { width: 32 }]}>{idx + 1}</Text>
              <TextInput
                style={[s.setInput, { flex: 1 }, entry.logged && s.setInputDone]}
                value={entry.weight}
                onChangeText={(v) => onSetChange(idx, "weight", v)}
                keyboardType="decimal-pad"
                placeholder={ex.weight ? String(ex.weight) : "0"}
                placeholderTextColor="#d1d5db"
                editable={!entry.logged}
              />
              <TextInput
                style={[s.setInput, { flex: 1 }, entry.logged && s.setInputDone]}
                value={entry.reps}
                onChangeText={(v) => onSetChange(idx, "reps", v)}
                keyboardType="number-pad"
                placeholder={String(ex.reps)}
                placeholderTextColor="#d1d5db"
                editable={!entry.logged}
              />
              <TouchableOpacity
                style={[s.logBtn, entry.logged && s.logBtnDone, { width: 56 }]}
                onPress={() => !entry.logged && onLogSet(idx)}
                disabled={entry.logged}
              >
                {entry.logged
                  ? <CheckCircle size={16} color="#059669" />
                  : <Text style={s.logBtnText}>Log</Text>}
              </TouchableOpacity>
            </View>
          ))}

          {ex.notes && <Text style={s.exNotes}>📝 {ex.notes}</Text>}
        </View>
      )}
    </View>
  );
}

function WorkoutOptions({
  workoutDayId, originalDay, weekStartDate, availableDays, onSuccess,
}: {
  workoutDayId: string; originalDay: string; weekStartDate: string;
  availableDays: string[]; onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [movePicker, setMovePicker] = useState(false);
  const createOverride = useCreateOverride();

  const skip = () => {
    Alert.alert(
      "Skip today?",
      "This workout won't show again this week. Your trainer will be notified.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Skip", style: "destructive",
          onPress: () =>
            createOverride.mutate(
              { workoutDayId, action: "skipped", originalDay, weekStartDate },
              { onSuccess: () => { setOpen(false); onSuccess(); } }
            ),
        },
      ]
    );
  };

  const move = (day: string) => {
    Alert.alert(`Move to ${day}?`, "Your trainer will be notified.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Move",
        onPress: () =>
          createOverride.mutate(
            { workoutDayId, action: "moved", originalDay, weekStartDate, newDay: day },
            { onSuccess: () => { setOpen(false); onSuccess(); } }
          ),
      },
    ]);
  };

  return (
    <View style={s.optionsContainer}>
      <TouchableOpacity style={s.optionsBtn} onPress={() => setOpen(!open)}>
        <Text style={s.optionsBtnText}>⋯ Options</Text>
      </TouchableOpacity>

      {open && (
        <View style={s.optionsMenu}>
          <TouchableOpacity
            style={s.optionItem}
            onPress={skip}
            disabled={createOverride.isPending}
          >
            <SkipForward size={16} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={s.optionTitle}>Skip today</Text>
              <Text style={s.optionSub}>Mark as rest day this week</Text>
            </View>
          </TouchableOpacity>

          {availableDays.length > 0 && (
            <>
              <TouchableOpacity
                style={s.optionItem}
                onPress={() => setMovePicker(!movePicker)}
              >
                <MoveRight size={16} color="#d97706" />
                <View style={{ flex: 1 }}>
                  <Text style={s.optionTitle}>Move to another day</Text>
                  <Text style={s.optionSub}>Pick a free day this week</Text>
                </View>
              </TouchableOpacity>
              {movePicker && (
                <View style={s.dayPicker}>
                  {availableDays.map((d) => (
                    <TouchableOpacity key={d} style={s.dayChip} onPress={() => move(d)}>
                      <Text style={s.dayChipText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function WorkoutScreen() {
  const user = useAuthStore((st) => st.user);
  const { data, isLoading, refetch, isRefetching } = useToday();
  const startSession = useStartSession();
  const logSet = useLogSet();
  const completeSession = useCompleteSession();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [setMap, setSetMap] = useState<Record<string, SetEntry[]>>({});
  const [completing, setCompleting] = useState(false);
  const [feedbackEmoji, setFeedbackEmoji] = useState("");

  const initSets = useCallback((exercises: WorkoutExercise[]) => {
    const map: Record<string, SetEntry[]> = {};
    exercises.forEach((ex) => {
      map[ex.id] = Array.from({ length: ex.sets }, () => ({
        weight: ex.weight ? String(ex.weight) : "",
        reps: String(ex.reps),
        logged: false,
      }));
    });
    setSetMap(map);
  }, []);

  const handleStart = async () => {
    if (!data?.workoutDay || !data.clientProgramId) return;
    const res = await startSession.mutateAsync({
      workoutDayId: data.workoutDay.id,
      clientProgramId: data.clientProgramId,
      scheduledDate: new Date().toISOString().split("T")[0],
    });
    setSessionId(res.session.id);
    initSets(data.workoutDay.exercises);
  };

  const handleLogSet = async (exId: string, setIdx: number) => {
    if (!sessionId || !user) return;
    const entry = setMap[exId]?.[setIdx];
    const ex = data?.workoutDay?.exercises.find((e) => e.id === exId);
    if (!ex || !entry) return;

    try {
      await logSet.mutateAsync({
        sessionId,
        exerciseId: ex.exercise.id,
        workoutExerciseId: exId,
        setNumber: setIdx + 1,
        weightKg: entry.weight || "0",
        repsActual: entry.reps || String(ex.reps),
        clientId: user.id,
      });
      setSetMap((prev) => ({
        ...prev,
        [exId]: prev[exId].map((st, i) => (i === setIdx ? { ...st, logged: true } : st)),
      }));
    } catch {
      Alert.alert("Error", "Failed to log set. Try again.");
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    setCompleting(true);
    try {
      await completeSession.mutateAsync({ sessionId, overallFeedbackEmoji: feedbackEmoji });
      setSessionId(null);
      refetch();
    } catch {
      Alert.alert("Error", "Failed to complete session.");
    } finally {
      setCompleting(false);
    }
  };

  const allLogged =
    data?.workoutDay?.exercises.every((ex) => setMap[ex.id]?.every((st) => st.logged)) ?? false;

  if (isLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}><ActivityIndicator size="large" color="#059669" /></View>
      </SafeAreaView>
    );
  }

  if (data?.status === "no_program" || data?.status === "empty_program") {
    return (
      <SafeAreaView style={s.container}>
        <ExerciseBrowser />
      </SafeAreaView>
    );
  }

  if (data?.status === "rest_day") {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <Moon size={48} color="#a78bfa" />
          <Text style={s.emptyTitle}>Rest Day 😴</Text>
          <Text style={s.emptySub}>No workout scheduled today. Recover well!</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (data?.status === "completed" && !sessionId) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.centered}>
          <CheckCircle size={56} color="#059669" />
          <Text style={s.emptyTitle}>Workout Complete! 🎉</Text>
          <Text style={s.emptySub}>Great job today.</Text>
          <TouchableOpacity style={[s.startBtn, { marginTop: 20 }]} onPress={() => refetch()}>
            <Text style={s.startBtnText}>Do it again →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const workout = data?.workoutDay;
  if (!workout) return null;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
      >
        <View style={s.topRow}>
          <View>
            <Text style={s.dayLabel}>{workout.dayLabel}</Text>
            <Text style={s.exCount}>{workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}</Text>
          </View>
          {!sessionId && data?.weekStartDate && (
            <WorkoutOptions
              workoutDayId={workout.id}
              originalDay={workout.dayLabel}
              weekStartDate={data.weekStartDate}
              availableDays={data.availableDays ?? []}
              onSuccess={refetch}
            />
          )}
        </View>

        {workout.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            sessionId={sessionId ?? ""}
            clientId={user?.id ?? ""}
            setEntries={
              setMap[ex.id] ??
              Array.from({ length: ex.sets }, () => ({
                weight: String(ex.weight ?? ""),
                reps: String(ex.reps),
                logged: false,
              }))
            }
            onSetChange={(setIdx, field, val) =>
              setSetMap((prev) => ({
                ...prev,
                [ex.id]: prev[ex.id].map((st, i) => (i === setIdx ? { ...st, [field]: val } : st)),
              }))
            }
            onLogSet={(setIdx) => handleLogSet(ex.id, setIdx)}
          />
        ))}

        {!sessionId ? (
          <TouchableOpacity
            style={s.startBtn}
            onPress={handleStart}
            disabled={startSession.isPending}
            activeOpacity={0.85}
          >
            {startSession.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.startBtnText}>Start Workout</Text>}
          </TouchableOpacity>
        ) : (
          <View style={s.completeBox}>
            <Text style={s.feedbackLabel}>How did it feel?</Text>
            <View style={s.emojiRow}>
              {["😓", "😐", "😊", "💪", "🔥"].map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiBtn, feedbackEmoji === e && s.emojiBtnActive]}
                  onPress={() => setFeedbackEmoji(feedbackEmoji === e ? "" : e)}
                >
                  <Text style={s.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[s.completeBtn, completing && s.completeBtnDisabled]}
              onPress={handleComplete}
              disabled={completing}
              activeOpacity={0.85}
            >
              {completing
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.completeBtnText}>
                    {allLogged ? "Complete Workout ✓" : "Complete Workout (sets remaining)"}
                  </Text>}
            </TouchableOpacity>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 16, textAlign: "center" },
  emptySub: { fontSize: 14, color: "#6b7280", marginTop: 8, textAlign: "center" },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  dayLabel: { fontSize: 22, fontWeight: "700", color: "#111827" },
  exCount: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  exCard: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12, overflow: "hidden" },
  exHeader: { flexDirection: "row", alignItems: "center", padding: 14 },
  exMeta: { flex: 1 },
  exName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  exMuscle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  exBody: { paddingHorizontal: 14, paddingBottom: 14 },
  exNotes: { fontSize: 12, color: "#6b7280", marginTop: 8 },

  setHeaderRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  setColLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500", textAlign: "center" },
  setRow: { flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "center" },
  setRowDone: { opacity: 0.6 },
  setNum: { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 36 },
  setInput: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14,
    color: "#111827", backgroundColor: "#f9fafb", textAlign: "center",
  },
  setInputDone: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  logBtn: { borderRadius: 8, paddingVertical: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#059669" },
  logBtnDone: { backgroundColor: "#f0fdf4" },
  logBtnText: { color: "#fff", fontWeight: "600", fontSize: 12 },

  optionsContainer: { position: "relative" },
  optionsBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  optionsBtnText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  optionsMenu: {
    position: "absolute", right: 0, top: 38, zIndex: 50,
    backgroundColor: "#fff", borderRadius: 14, padding: 8,
    borderWidth: 1, borderColor: "#e5e7eb", minWidth: 220,
    shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  optionItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 10, borderRadius: 10 },
  optionTitle: { fontSize: 13, fontWeight: "600", color: "#111827" },
  optionSub: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  dayPicker: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 10, paddingBottom: 6 },
  dayChip: { backgroundColor: "#f0fdf4", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "#bbf7d0" },
  dayChipText: { color: "#059669", fontWeight: "600", fontSize: 12 },

  startBtn: { backgroundColor: "#059669", borderRadius: 14, padding: 16, alignItems: "center", marginTop: 8 },
  startBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  completeBox: { marginTop: 8 },
  feedbackLabel: { fontSize: 14, fontWeight: "500", color: "#374151", marginBottom: 10 },
  emojiRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  emojiBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "transparent",
  },
  emojiBtnActive: { borderColor: "#059669", backgroundColor: "#f0fdf4" },
  emojiText: { fontSize: 22 },
  completeBtn: { backgroundColor: "#059669", borderRadius: 14, padding: 16, alignItems: "center" },
  completeBtnDisabled: { opacity: 0.7 },
  completeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
