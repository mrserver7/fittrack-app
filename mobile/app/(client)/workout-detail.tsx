import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Dumbbell } from "lucide-react-native";
import { api } from "@/src/api/client";

interface SetData {
  setNumber: number;
  weightKg: number | null;
  repsActual: number | null;
  rpeActual: number | null;
}

interface ExerciseGroup {
  exercise: {
    id: string;
    name: string;
    category: string;
    primaryMuscles: string | null;
  };
  sets: SetData[];
}

interface SessionDetail {
  session: {
    id: string;
    scheduledDate: string;
    completedAt: string | null;
    durationMinutes: number | null;
    totalVolumeKg: number | null;
    overallFeedbackEmoji: string | null;
    overallFeedbackText: string | null;
    notes: string | null;
    dayLabel: string;
  };
  exercises: ExerciseGroup[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

export default function WorkoutDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data, isLoading } = useQuery<SessionDetail>({
    queryKey: ["session-detail", id],
    queryFn: () => api.get<SessionDetail>(`/api/mobile/session-history/${id}`),
    enabled: !!id,
  });

  const session = data?.session;
  const exercises = data?.exercises ?? [];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color="#059669" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Session Summary</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : session ? (
        <ScrollView contentContainerStyle={s.content}>
          {/* Session overview card */}
          <View style={s.overviewCard}>
            <View style={s.overviewTop}>
              <View style={s.iconWrap}>
                <Dumbbell size={22} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.overviewTitle}>
                  {session.overallFeedbackEmoji ? `${session.overallFeedbackEmoji} ` : ""}{session.dayLabel}
                </Text>
                <Text style={s.overviewDate}>{formatDate(session.scheduledDate)}</Text>
              </View>
            </View>

            <View style={s.statsRow}>
              {session.durationMinutes != null && (
                <View style={s.stat}>
                  <Text style={s.statValue}>{session.durationMinutes}</Text>
                  <Text style={s.statLabel}>minutes</Text>
                </View>
              )}
              {session.totalVolumeKg != null && (
                <View style={s.stat}>
                  <Text style={s.statValue}>{Math.round(session.totalVolumeKg)}</Text>
                  <Text style={s.statLabel}>kg volume</Text>
                </View>
              )}
              <View style={s.stat}>
                <Text style={s.statValue}>{exercises.length}</Text>
                <Text style={s.statLabel}>exercises</Text>
              </View>
            </View>

            {session.overallFeedbackText ? (
              <View style={s.notesBox}>
                <Text style={s.notesText}>"{session.overallFeedbackText}"</Text>
              </View>
            ) : null}
          </View>

          {/* Exercise breakdown */}
          {exercises.map((eg) => (
            <View key={eg.exercise.id} style={s.exerciseCard}>
              <View style={s.exerciseHeader}>
                <Text style={s.exerciseName}>{eg.exercise.name}</Text>
                <Text style={s.exerciseMuscle}>
                  {eg.exercise.primaryMuscles ?? eg.exercise.category}
                </Text>
              </View>

              {/* Set table header */}
              <View style={s.tableHeader}>
                <Text style={[s.colHead, s.colSet]}>Set</Text>
                <Text style={[s.colHead, s.colWeight]}>Weight</Text>
                <Text style={[s.colHead, s.colReps]}>Reps</Text>
                <Text style={[s.colHead, s.colRpe]}>RPE</Text>
              </View>

              {eg.sets.map((set) => (
                <View key={set.setNumber} style={s.tableRow}>
                  <Text style={[s.colCell, s.colSet]}>{set.setNumber}</Text>
                  <Text style={[s.colCell, s.colWeight]}>
                    {set.weightKg != null ? `${set.weightKg}kg` : "—"}
                  </Text>
                  <Text style={[s.colCell, s.colReps]}>
                    {set.repsActual != null ? set.repsActual : "—"}
                  </Text>
                  <Text style={[s.colCell, s.colRpe]}>
                    {set.rpeActual != null ? set.rpeActual : "—"}
                  </Text>
                </View>
              ))}
            </View>
          ))}

          {session.notes ? (
            <View style={s.sessionNotesCard}>
              <Text style={s.sessionNotesLabel}>Session notes</Text>
              <Text style={s.sessionNotesText}>{session.notes}</Text>
            </View>
          ) : null}
        </ScrollView>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyText}>Session not found.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#111827" },

  content: { padding: 16, paddingBottom: 40, gap: 14 },

  overviewCard: {
    backgroundColor: "#059669", borderRadius: 18, padding: 20,
  },
  overviewTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  iconWrap: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center",
  },
  overviewTitle: { fontSize: 18, fontWeight: "700", color: "#fff" },
  overviewDate: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },

  statsRow: { flexDirection: "row", gap: 0 },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 22, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  notesBox: {
    marginTop: 14, backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10, padding: 12,
  },
  notesText: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontStyle: "italic", lineHeight: 20 },

  exerciseCard: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden",
  },
  exerciseHeader: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  exerciseName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  exerciseMuscle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  tableHeader: {
    flexDirection: "row", backgroundColor: "#f9fafb",
    paddingHorizontal: 14, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
  },
  tableRow: {
    flexDirection: "row", paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#f9fafb",
  },
  colHead: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase" },
  colCell: { fontSize: 14, color: "#374151" },
  colSet: { width: 36 },
  colWeight: { flex: 1 },
  colReps: { width: 56, textAlign: "center" },
  colRpe: { width: 48, textAlign: "right" },

  sessionNotesCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  sessionNotesLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", marginBottom: 6 },
  sessionNotesText: { fontSize: 14, color: "#374151", lineHeight: 20 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9ca3af", fontSize: 15 },
});
