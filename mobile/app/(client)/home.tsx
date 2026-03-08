import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Flame, Dumbbell, CheckCircle, Trophy, Calendar } from "lucide-react-native";
import { useAuthStore } from "@/src/store/auth-store";
import { useClientHome } from "@/src/api/queries";

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

export default function ClientHome() {
  const user = useAuthStore((st) => st.user);
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useClientHome();

  const firstName = user?.name?.split(" ")[0] ?? "";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
      >
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.greeting}>Hey, {firstName} 👋</Text>
            <Text style={s.date}>{today}</Text>
          </View>
          <Avatar name={user?.name ?? "?"} />
        </View>

        {isLoading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator color="#059669" size="large" />
          </View>
        ) : data ? (
          <>
            {/* Stats row */}
            <View style={s.statsRow}>
              <View style={s.statCard}>
                <CheckCircle size={16} color="#059669" />
                <Text style={s.statValue}>{data.stats.completedCount}</Text>
                <Text style={s.statLabel}>Sessions</Text>
              </View>
              <View style={s.statCard}>
                <Flame size={16} color="#059669" />
                <Text style={[s.statValue, { color: "#059669" }]}>{data.stats.streak}</Text>
                <Text style={s.statLabel}>Streak</Text>
              </View>
              <View style={s.statCard}>
                <Calendar size={16} color="#6b7280" />
                <Text style={s.statValue}>{data.stats.adherence}%</Text>
                <Text style={s.statLabel}>Adherence</Text>
              </View>
            </View>

            {/* Today's workout card */}
            <TouchableOpacity
              style={[s.todayCard, data.stats.todayDone ? s.todayCardDone : s.todayCardActive]}
              onPress={() => router.push("/(client)/workout")}
              activeOpacity={0.85}
            >
              <View style={s.todayIcon}>
                {data.stats.todayDone
                  ? <CheckCircle size={22} color="#fff" />
                  : <Dumbbell size={22} color="#fff" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.todayTitle}>
                  {data.stats.todayDone ? "Workout Complete! 🎉" : "Today's Workout"}
                </Text>
                <Text style={s.todaySub}>
                  {data.stats.todayDone
                    ? "Want to do it again? →"
                    : data.stats.todayWorkoutLabel
                    ? `${data.stats.todayWorkoutLabel} · Tap to start`
                    : data.hasActiveProgram
                    ? "Rest day — enjoy your recovery"
                    : "No program assigned yet"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Pending checkins */}
            {data.stats.pendingCheckins > 0 && (
              <TouchableOpacity
                style={s.checkinBanner}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => router.push("/(client)/checkins" as any)}
                activeOpacity={0.8}
              >
                <Text style={s.checkinText}>
                  📋 You have {data.stats.pendingCheckins} pending check-in
                  {data.stats.pendingCheckins > 1 ? "s" : ""} — tap to view →
                </Text>
              </TouchableOpacity>
            )}

            {/* Recent sessions */}
            {data.recentSessions.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Text style={s.sectionTitle}>Recent Sessions</Text>
                  <TouchableOpacity onPress={() => router.push("/(client)/workouts" as never)}>
                    <Text style={s.seeAll}>See all →</Text>
                  </TouchableOpacity>
                </View>
                <View style={s.card}>
                  {data.recentSessions.map((session, i) => (
                    <View
                      key={session.id}
                      style={[s.sessionRow, i < data.recentSessions.length - 1 && s.rowBorder]}
                    >
                      <View style={[s.dot, session.status === "completed" ? s.dotGreen : s.dotGray]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.sessionLabel}>{session.workoutDay?.dayLabel ?? "Workout"}</Text>
                        <Text style={s.sessionDate}>{session.scheduledDate}</Text>
                      </View>
                      {session.durationMinutes != null && (
                        <Text style={s.sessionDuration}>{session.durationMinutes}m</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* PRs */}
            {data.personalRecords.length > 0 && (
              <View style={s.section}>
                <View style={s.sectionHeader}>
                  <Trophy size={16} color="#f59e0b" />
                  <Text style={[s.sectionTitle, { marginBottom: 0, marginLeft: 6 }]}>Your PRs</Text>
                </View>
                <View style={s.prGrid}>
                  {data.personalRecords.map((pr) => (
                    <View key={pr.id} style={s.prCard}>
                      <Text style={s.prWeight}>{pr.valueKg}kg</Text>
                      {pr.repsAtPr != null && <Text style={s.prReps}>× {pr.repsAtPr}</Text>}
                      <Text style={s.prName} numberOfLines={1}>{pr.exercise.name}</Text>
                      <Text style={s.prMuscle}>{pr.exercise.primaryMuscles ?? pr.exercise.category}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  avatar: { backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#059669", fontWeight: "700" },
  loadingBox: { paddingVertical: 60, alignItems: "center" },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14,
    alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", textAlign: "center" },

  todayCard: {
    borderRadius: 18, padding: 20, flexDirection: "row",
    alignItems: "center", gap: 16, marginBottom: 12,
  },
  todayCardActive: { backgroundColor: "#059669" },
  todayCardDone: { backgroundColor: "#374151" },
  todayIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  todayTitle: { color: "#fff", fontWeight: "700", fontSize: 16 },
  todaySub: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 2 },

  checkinBanner: {
    backgroundColor: "#eff6ff", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#bfdbfe", marginBottom: 16,
  },
  checkinText: { color: "#1d4ed8", fontSize: 13, fontWeight: "500" },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  seeAll: { fontSize: 13, color: "#059669", fontWeight: "500" },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },

  sessionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: "#059669" },
  dotGray: { backgroundColor: "#d1d5db" },
  sessionLabel: { fontSize: 13, fontWeight: "500", color: "#111827" },
  sessionDate: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  sessionDuration: { fontSize: 12, color: "#6b7280" },

  prGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  prCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e5e7eb", minWidth: "47%", flex: 1,
  },
  prWeight: { fontSize: 20, fontWeight: "700", color: "#111827" },
  prReps: { fontSize: 12, color: "#6b7280" },
  prName: { fontSize: 13, fontWeight: "500", color: "#374151", marginTop: 4 },
  prMuscle: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
});
