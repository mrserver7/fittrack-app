import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, CheckCircle, Clock, Bell } from "lucide-react-native";
import { useAuthStore } from "@/src/store/auth-store";
import { useTrainerDashboard } from "@/src/api/queries";
import { useRouter } from "expo-router";

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <View style={[st.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[st.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

export default function TrainerDashboard() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useTrainerDashboard();

  const firstName = user?.name?.split(" ")[0] ?? "";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        contentContainerStyle={st.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
      >
        <View style={st.header}>
          <View>
            <Text style={st.greeting}>Hey, {firstName} 👋</Text>
            <Text style={st.date}>{today}</Text>
          </View>
          <Avatar name={user?.name ?? "?"} />
        </View>

        {isLoading ? (
          <View style={st.loadingBox}>
            <ActivityIndicator color="#059669" size="large" />
          </View>
        ) : data ? (
          <>
            <View style={st.statsGrid}>
              <View style={st.statCard}>
                <View style={[st.statIcon, { backgroundColor: "#05966918" }]}>
                  <Users size={18} color="#059669" />
                </View>
                <Text style={st.statValue}>{data.stats.totalClients}</Text>
                <Text style={st.statLabel}>Active Clients</Text>
              </View>
              <View style={st.statCard}>
                <View style={[st.statIcon, { backgroundColor: "#7c3aed18" }]}>
                  <CheckCircle size={18} color="#7c3aed" />
                </View>
                <Text style={st.statValue}>{data.stats.sessionsThisWeek}</Text>
                <Text style={st.statLabel}>Sessions This Week</Text>
              </View>
              <View style={st.statCard}>
                <View style={[st.statIcon, { backgroundColor: "#d9770618" }]}>
                  <Clock size={18} color="#d97706" />
                </View>
                <Text style={st.statValue}>{data.stats.pendingClients}</Text>
                <Text style={st.statLabel}>Pending Approvals</Text>
              </View>
              <View style={st.statCard}>
                <View style={[st.statIcon, { backgroundColor: "#2563eb18" }]}>
                  <Bell size={18} color="#2563eb" />
                </View>
                <Text style={st.statValue}>{data.stats.unreadNotifications}</Text>
                <Text style={st.statLabel}>Notifications</Text>
              </View>
            </View>

            {data.stats.pendingClients > 0 && (
              <TouchableOpacity
                style={st.pendingBanner}
                onPress={() => router.push("/(trainer)/clients")}
                activeOpacity={0.8}
              >
                <Clock size={16} color="#92400e" />
                <Text style={st.pendingText}>
                  {data.stats.pendingClients} subscriber{data.stats.pendingClients > 1 ? "s" : ""} waiting for approval
                </Text>
                <Text style={st.pendingArrow}>→</Text>
              </TouchableOpacity>
            )}

            {data.recentSessions.length > 0 && (
              <View style={st.section}>
                <Text style={st.sectionTitle}>Recent Sessions</Text>
                <View style={st.card}>
                  {data.recentSessions.map((session, i) => (
                    <View
                      key={session.id}
                      style={[st.sessionRow, i < data.recentSessions.length - 1 && st.rowBorder]}
                    >
                      <Avatar name={session.clientName} size={32} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.sessionClient}>{session.clientName}</Text>
                        <Text style={st.sessionLabel}>{session.workoutLabel}</Text>
                      </View>
                      {session.completedAt && (
                        <Text style={st.sessionTime}>
                          {new Date(session.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {data.activeClients.length > 0 && (
              <View style={st.section}>
                <View style={st.sectionHeader}>
                  <Text style={st.sectionTitle}>Clients</Text>
                  <TouchableOpacity onPress={() => router.push("/(trainer)/clients")}>
                    <Text style={st.seeAll}>See all →</Text>
                  </TouchableOpacity>
                </View>
                <View style={st.card}>
                  {data.activeClients.slice(0, 5).map((c, i) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[st.clientRow, i < Math.min(data.activeClients.length, 5) - 1 && st.rowBorder]}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onPress={() => router.push({ pathname: "/(trainer)/clients/[id]" as any, params: { id: c.id } })}
                      activeOpacity={0.7}
                    >
                      <Avatar name={c.name} size={36} />
                      <View style={{ flex: 1 }}>
                        <Text style={st.clientName}>{c.name}</Text>
                        <Text style={st.clientMeta}>
                          {c.sessionsCount} sessions · Last: {c.lastSession ?? "Never"}
                        </Text>
                      </View>
                    </TouchableOpacity>
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

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  date: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  avatar: { backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#059669", fontWeight: "700" },
  loadingBox: { paddingVertical: 60, alignItems: "center" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: {
    width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  pendingBanner: {
    backgroundColor: "#fffbeb", borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#fde68a", marginBottom: 20,
  },
  pendingText: { flex: 1, color: "#92400e", fontSize: 13, fontWeight: "500" },
  pendingArrow: { color: "#92400e", fontWeight: "700" },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 10 },
  seeAll: { fontSize: 13, color: "#059669", fontWeight: "500" },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },

  sessionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  sessionClient: { fontSize: 13, fontWeight: "600", color: "#111827" },
  sessionLabel: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  sessionTime: { fontSize: 12, color: "#6b7280" },

  clientRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  clientName: { fontSize: 14, fontWeight: "500", color: "#111827" },
  clientMeta: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
});
