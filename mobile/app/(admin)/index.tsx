import { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Users, BarChart3, CheckCircle, Clock, Shield, Sparkles } from "lucide-react-native";
import { useAuthStore } from "@/src/store/auth-store";
import { api } from "@/src/api/client";

interface AdminStats {
  stats: {
    totalTrainers: number;
    totalClients: number;
    totalSessions: number;
    pendingClients: number;
  };
  trainers: {
    id: string;
    name: string;
    email: string;
    businessName: string | null;
    status: string;
    canApproveClients: boolean;
    clientCount: number;
    createdAt: string;
  }[];
  clients: {
    id: string;
    name: string;
    email: string;
    status: string;
    trainerName: string | null;
    createdAt: string;
  }[];
}

type Tab = "overview" | "trainers" | "clients";

function Initials({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "active" ? "#059669" : status === "pending" ? "#d97706" : "#dc2626";
  const bg = status === "active" ? "#d1fae5" : status === "pending" ? "#fef3c7" : "#fee2e2";
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

export default function AdminScreen() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");

  const { data, isLoading, refetch, isRefetching } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get<AdminStats>("/api/mobile/admin-stats"),
  });

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/(auth)/login");
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "trainers", label: `Trainers${data ? ` (${data.stats.totalTrainers})` : ""}` },
    { key: "clients", label: `Clients${data ? ` (${data.stats.totalClients})` : ""}` },
  ];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.shieldWrap}>
            <Shield size={18} color="#059669" />
          </View>
          <Text style={s.headerTitle}>Admin Panel</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={s.aiBtn} onPress={() => router.push("/(admin)/ai-chat" as never)}>
            <Sparkles size={15} color="#059669" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} style={s.signOutBtn}>
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={s.tabs}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
        >
          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              <View style={s.statsGrid}>
                <View style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: "#05966918" }]}>
                    <Shield size={18} color="#059669" />
                  </View>
                  <Text style={s.statValue}>{data?.stats.totalTrainers ?? 0}</Text>
                  <Text style={s.statLabel}>Trainers</Text>
                </View>
                <View style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: "#2563eb18" }]}>
                    <Users size={18} color="#2563eb" />
                  </View>
                  <Text style={s.statValue}>{data?.stats.totalClients ?? 0}</Text>
                  <Text style={s.statLabel}>Subscribers</Text>
                </View>
                <View style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: "#7c3aed18" }]}>
                    <BarChart3 size={18} color="#7c3aed" />
                  </View>
                  <Text style={s.statValue}>{data?.stats.totalSessions ?? 0}</Text>
                  <Text style={s.statLabel}>Sessions</Text>
                </View>
                <View style={s.statCard}>
                  <View style={[s.statIcon, { backgroundColor: "#d9770618" }]}>
                    <Clock size={18} color="#d97706" />
                  </View>
                  <Text style={s.statValue}>{data?.stats.pendingClients ?? 0}</Text>
                  <Text style={s.statLabel}>Pending</Text>
                </View>
              </View>

              {(data?.stats.pendingClients ?? 0) > 0 && (
                <TouchableOpacity style={s.pendingBanner} onPress={() => setTab("clients")} activeOpacity={0.8}>
                  <Clock size={15} color="#92400e" />
                  <Text style={s.pendingText}>
                    {data!.stats.pendingClients} subscriber{data!.stats.pendingClients > 1 ? "s" : ""} awaiting approval
                  </Text>
                  <Text style={s.pendingArrow}>→</Text>
                </TouchableOpacity>
              )}

              {/* Recent trainers preview */}
              <Text style={s.sectionTitle}>Recent Trainers</Text>
              <View style={s.card}>
                {(data?.trainers ?? []).slice(0, 5).map((t, i) => (
                  <View key={t.id} style={[s.row, i < Math.min((data?.trainers.length ?? 0), 5) - 1 && s.rowBorder]}>
                    <Initials name={t.name} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName}>{t.name}</Text>
                      <Text style={s.rowMeta}>{t.clientCount} client{t.clientCount !== 1 ? "s" : ""}</Text>
                    </View>
                    <StatusBadge status={t.status} />
                  </View>
                ))}
              </View>

              {/* Recent clients preview */}
              <Text style={s.sectionTitle}>Recent Subscribers</Text>
              <View style={s.card}>
                {(data?.clients ?? []).slice(0, 5).map((c, i) => (
                  <View key={c.id} style={[s.row, i < Math.min((data?.clients.length ?? 0), 5) - 1 && s.rowBorder]}>
                    <Initials name={c.name} size={34} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName}>{c.name}</Text>
                      <Text style={s.rowMeta}>{c.trainerName ? `Trainer: ${c.trainerName}` : "No trainer"}</Text>
                    </View>
                    <StatusBadge status={c.status} />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* ── TRAINERS ── */}
          {tab === "trainers" && (
            <View style={s.card}>
              {(data?.trainers ?? []).length === 0 ? (
                <Text style={s.empty}>No trainers yet.</Text>
              ) : (
                (data?.trainers ?? []).map((t, i) => (
                  <View key={t.id} style={[s.row, i < (data?.trainers.length ?? 0) - 1 && s.rowBorder]}>
                    <Initials name={t.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName}>{t.name}</Text>
                      <Text style={s.rowEmail}>{t.email}</Text>
                      {t.businessName ? <Text style={s.rowMeta}>{t.businessName}</Text> : null}
                      <View style={s.metaRow}>
                        <StatusBadge status={t.status} />
                        {t.canApproveClients && (
                          <View style={s.capBadge}>
                            <CheckCircle size={10} color="#059669" />
                            <Text style={s.capBadgeText}>Can approve</Text>
                          </View>
                        )}
                        <Text style={s.rowMeta}>{t.clientCount} clients</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* ── CLIENTS ── */}
          {tab === "clients" && (
            <View style={s.card}>
              {(data?.clients ?? []).length === 0 ? (
                <Text style={s.empty}>No subscribers yet.</Text>
              ) : (
                (data?.clients ?? []).map((c, i) => (
                  <View key={c.id} style={[s.row, i < (data?.clients.length ?? 0) - 1 && s.rowBorder]}>
                    <Initials name={c.name} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.rowName}>{c.name}</Text>
                      <Text style={s.rowEmail}>{c.email}</Text>
                      <Text style={s.rowMeta}>
                        {c.trainerName ? `Trainer: ${c.trainerName}` : "No trainer assigned"}
                      </Text>
                      <View style={{ marginTop: 4 }}>
                        <StatusBadge status={c.status} />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  shieldWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  aiBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center" },
  signOutBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#fee2e2", borderRadius: 8 },
  signOutText: { fontSize: 13, fontWeight: "600", color: "#dc2626" },

  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  tab: { flex: 1, paddingVertical: 11, alignItems: "center" },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#059669" },
  tabText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#059669", fontWeight: "700" },

  content: { padding: 16, paddingBottom: 40 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
  statCard: {
    width: "47%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  statValue: { fontSize: 22, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  pendingBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fffbeb", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "#fde68a", marginBottom: 20,
  },
  pendingText: { flex: 1, color: "#92400e", fontSize: 13, fontWeight: "500" },
  pendingArrow: { color: "#92400e", fontWeight: "700" },

  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8, marginTop: 4 },
  card: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20, overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  rowEmail: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  rowMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" },

  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  capBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#d1fae5", borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  capBadgeText: { fontSize: 11, color: "#059669", fontWeight: "600" },

  avatar: { backgroundColor: "#e0e7ff", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#4f46e5", fontWeight: "700" },

  empty: { color: "#9ca3af", textAlign: "center", padding: 24, fontSize: 14 },
});
