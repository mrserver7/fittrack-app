import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Dumbbell, CheckCircle, Calendar, AlertCircle } from "lucide-react-native";
import { useClientDetail, useApproveClient, useRejectClient } from "@/src/api/queries";

function Avatar({ name, size = 56 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active: { bg: "#d1fae5", text: "#065f46" },
    pending: { bg: "#fef9c3", text: "#854d0e" },
    invited: { bg: "#dbeafe", text: "#1e40af" },
    archived: { bg: "#f3f4f6", text: "#6b7280" },
  };
  const c = colors[status] ?? colors.archived;
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <Text style={[s.badgeText, { color: c.text }]}>{status}</Text>
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useClientDetail(id);
  const approveClient = useApproveClient();
  const rejectClient = useRejectClient();

  const handleApprove = () => {
    Alert.alert("Approve client?", "They'll be able to log in and start training.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: () =>
          approveClient.mutate(id, {
            onSuccess: () => refetch(),
            onError: () => Alert.alert("Error", "Failed to approve client."),
          }),
      },
    ]);
  };

  const handleReject = () => {
    Alert.alert("Reject client?", "Their account will be archived.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () =>
          rejectClient.mutate(id, {
            onSuccess: () => router.back(),
            onError: () => Alert.alert("Error", "Failed to reject client."),
          }),
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Client</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={s.centered}><ActivityIndicator size="large" color="#059669" /></View>
      ) : !data ? (
        <View style={s.centered}>
          <AlertCircle size={48} color="#d1d5db" />
          <Text style={s.emptyTitle}>Not found</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
        >
          {/* Client header */}
          <View style={s.clientHeader}>
            <Avatar name={data.client.name} />
            <View style={s.clientInfo}>
              <Text style={s.clientName}>{data.client.name}</Text>
              <Text style={s.clientEmail}>{data.client.email}</Text>
              <StatusBadge status={data.client.status} />
            </View>
          </View>

          {/* Pending approve/reject */}
          {data.client.status === "pending" && (
            <View style={s.approveRow}>
              <TouchableOpacity
                style={s.approveBtn}
                onPress={handleApprove}
                disabled={approveClient.isPending}
              >
                {approveClient.isPending
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.approveBtnText}>Approve</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={s.rejectBtn}
                onPress={handleReject}
                disabled={rejectClient.isPending}
              >
                {rejectClient.isPending
                  ? <ActivityIndicator color="#dc2626" />
                  : <Text style={s.rejectBtnText}>Reject</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statCard}>
              <CheckCircle size={16} color="#059669" />
              <Text style={s.statValue}>{data.stats.totalSessions}</Text>
              <Text style={s.statLabel}>Sessions</Text>
            </View>
            <View style={s.statCard}>
              <Calendar size={16} color="#6b7280" />
              <Text style={s.statValue}>
                {data.stats.lastSessionDate
                  ? new Date(data.stats.lastSessionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"}
              </Text>
              <Text style={s.statLabel}>Last Active</Text>
            </View>
            <View style={s.statCard}>
              <Dumbbell size={16} color="#6b7280" />
              <Text style={s.statValue}>{data.activeProgram?.name?.split(" ")[0] ?? "—"}</Text>
              <Text style={s.statLabel}>Program</Text>
            </View>
          </View>

          {/* Active program */}
          {data.activeProgram && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Active Program</Text>
              <View style={s.card}>
                <View style={s.programRow}>
                  <Dumbbell size={18} color="#059669" />
                  <View style={{ flex: 1 }}>
                    <Text style={s.programName}>{data.activeProgram.name}</Text>
                    <Text style={s.programDate}>
                      Started {new Date(data.activeProgram.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* This week's overrides */}
          {data.overrides.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>This Week's Changes</Text>
              <View style={s.card}>
                {data.overrides.map((o, i) => (
                  <View key={o.id} style={[s.overrideRow, i < data.overrides.length - 1 && s.rowBorder]}>
                    <Text style={s.overrideIcon}>{o.action === "skipped" ? "⏭️" : "📅"}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={s.overrideText}>
                        {o.action === "skipped"
                          ? `Skipped ${o.originalDay} workout`
                          : `Moved ${o.originalDay} → ${o.newDay}`}
                      </Text>
                      <Text style={s.overrideTime}>
                        {new Date(o.createdAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Recent sessions */}
          {data.recentSessions.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Recent Sessions</Text>
              <View style={s.card}>
                {data.recentSessions.slice(0, 8).map((session, i) => (
                  <View
                    key={session.id}
                    style={[s.sessionRow, i < Math.min(data.recentSessions.length, 8) - 1 && s.rowBorder]}
                  >
                    <View style={[s.dot, session.status === "completed" ? s.dotGreen : session.status === "skipped" ? s.dotRed : s.dotGray]} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.sessionLabel}>{session.workoutDay?.dayLabel ?? "Workout"}</Text>
                      <Text style={s.sessionDate}>{session.scheduledDate}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      {session.durationMinutes != null && (
                        <Text style={s.sessionDuration}>{session.durationMinutes}m</Text>
                      )}
                      <Text style={[s.sessionStatus, session.status === "completed" ? s.statusGreen : s.statusGray]}>
                        {session.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
    backgroundColor: "#fff",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topBarTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#9ca3af", marginTop: 12 },
  content: { padding: 16, paddingBottom: 40 },

  clientHeader: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12,
  },
  avatar: { backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#059669", fontWeight: "700" },
  clientInfo: { flex: 1, gap: 4 },
  clientName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  clientEmail: { fontSize: 13, color: "#6b7280" },
  badge: { alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 2 },
  badgeText: { fontSize: 12, fontWeight: "600" },

  approveRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  approveBtn: {
    flex: 1, backgroundColor: "#059669", borderRadius: 12,
    padding: 12, alignItems: "center",
  },
  approveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  rejectBtn: {
    flex: 1, backgroundColor: "#fee2e2", borderRadius: 12,
    padding: 12, alignItems: "center",
    borderWidth: 1, borderColor: "#fca5a5",
  },
  rejectBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },

  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#e5e7eb",
  },
  statValue: { fontSize: 16, fontWeight: "700", color: "#111827", textAlign: "center" },
  statLabel: { fontSize: 10, color: "#9ca3af", textAlign: "center" },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },

  programRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  programName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  programDate: { fontSize: 12, color: "#9ca3af", marginTop: 1 },

  overrideRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  overrideIcon: { fontSize: 18 },
  overrideText: { fontSize: 13, fontWeight: "500", color: "#111827" },
  overrideTime: { fontSize: 11, color: "#9ca3af", marginTop: 1 },

  sessionRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: "#059669" },
  dotRed: { backgroundColor: "#dc2626" },
  dotGray: { backgroundColor: "#d1d5db" },
  sessionLabel: { fontSize: 13, fontWeight: "500", color: "#111827" },
  sessionDate: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
  sessionDuration: { fontSize: 12, color: "#6b7280" },
  sessionStatus: { fontSize: 11, marginTop: 1 },
  statusGreen: { color: "#059669" },
  statusGray: { color: "#9ca3af" },
});
