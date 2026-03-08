import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api/client";

interface Measurement {
  recordedDate: string;
  weightKg: number | null;
}

interface Session {
  scheduledDate: string;
  totalVolumeKg: number | null;
  durationMinutes: number | null;
}

interface PR {
  id: string;
  weightKg: number | null;
  reps: number | null;
  exercise: { name: string; category: string };
  createdAt: string;
}

interface ProgressData {
  measurements: Measurement[];
  sessions: Session[];
  personalRecords: PR[];
}

type Tab = "weight" | "sessions" | "prs";

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const mon = new Date(d);
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return mon.toISOString().split("T")[0];
}

function SimpleLineChart({ data }: { data: { x: string; y: number }[] }) {
  if (data.length < 2) return null;
  const min = Math.min(...data.map((d) => d.y));
  const max = Math.max(...data.map((d) => d.y));
  const range = max - min || 1;
  const W = 300;
  const H = 120;
  const padX = 8;
  const padY = 8;

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * (W - padX * 2);
    const y = H - padY - ((d.y - min) / range) * (H - padY * 2);
    return { x, y };
  });

  return (
    <View style={{ height: H, width: W, position: "relative" }}>
      {/* Y axis labels */}
      <Text style={styles.axisLabel}>{max.toFixed(1)}</Text>
      <Text style={[styles.axisLabel, { position: "absolute", bottom: 0 }]}>{min.toFixed(1)}</Text>
      {/* Line segments */}
      {points.slice(0, -1).map((pt, i) => {
        const next = points[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: "absolute",
              left: pt.x,
              top: pt.y,
              width: len,
              height: 2,
              backgroundColor: "#059669",
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: "0 0",
            }}
          />
        );
      })}
      {/* Dots */}
      {points.map((pt, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: pt.x - 4,
            top: pt.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#059669",
          }}
        />
      ))}
    </View>
  );
}

function SimpleBarChart({ data }: { data: { x: string; y: number }[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.y), 1);
  const BAR_H = 120;

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: BAR_H, gap: 4 }}>
      {data.map((d, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center" }}>
          <Text style={styles.barValue}>{d.y}</Text>
          <View
            style={{
              width: "100%",
              height: BAR_H * 0.8 * (d.y / max),
              backgroundColor: "#059669",
              borderRadius: 3,
              minHeight: d.y > 0 ? 4 : 0,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export default function ClientProgress() {
  const [activeTab, setActiveTab] = useState<Tab>("weight");

  const { data, isLoading, refetch, isRefetching } = useQuery<ProgressData>({
    queryKey: ["mobile-progress"],
    queryFn: () => api.get<ProgressData>("/api/mobile/progress"),
  });

  const weightData =
    data?.measurements
      .filter((m) => m.weightKg != null)
      .map((m) => ({ x: m.recordedDate, y: m.weightKg! })) ?? [];

  const sessionsByWeek: Record<string, number> = {};
  (data?.sessions ?? []).forEach((s) => {
    const wk = getWeekKey(s.scheduledDate);
    sessionsByWeek[wk] = (sessionsByWeek[wk] ?? 0) + 1;
  });
  const weekData = Object.entries(sessionsByWeek)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([x, y]) => ({ x: x.slice(5), y }));

  const latestWeight = weightData.length ? weightData[weightData.length - 1].y : null;
  const totalSessions = data?.sessions.length ?? 0;

  const tabs: { key: Tab; label: string }[] = [
    { key: "weight", label: "Weight" },
    { key: "sessions", label: "Sessions" },
    { key: "prs", label: "PRs" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
      >
        <Text style={styles.title}>Progress</Text>

        {/* Tab switcher */}
        <View style={styles.tabRow}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? (
          <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Weight tab */}
            {activeTab === "weight" && (
              <View style={styles.card}>
                {latestWeight != null && (
                  <View style={styles.statRow}>
                    <Text style={styles.bigNumber}>{latestWeight.toFixed(1)}</Text>
                    <Text style={styles.bigUnit}>kg</Text>
                  </View>
                )}
                <Text style={styles.cardLabel}>Weight Over Time</Text>
                {weightData.length >= 2 ? (
                  <View style={styles.chartWrap}>
                    <SimpleLineChart data={weightData} />
                  </View>
                ) : (
                  <Text style={styles.empty}>No data yet. Start logging workouts!</Text>
                )}
              </View>
            )}

            {/* Sessions tab */}
            {activeTab === "sessions" && (
              <View style={styles.card}>
                <View style={styles.statRow}>
                  <Text style={styles.bigNumber}>{totalSessions}</Text>
                  <Text style={styles.bigUnit}>sessions</Text>
                </View>
                <Text style={styles.cardLabel}>Sessions Per Week</Text>
                {weekData.length > 0 ? (
                  <View style={styles.chartWrap}>
                    <SimpleBarChart data={weekData} />
                  </View>
                ) : (
                  <Text style={styles.empty}>No data yet. Start logging workouts!</Text>
                )}
              </View>
            )}

            {/* PRs tab */}
            {activeTab === "prs" && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Personal Records</Text>
                {(data?.personalRecords ?? []).length === 0 ? (
                  <Text style={styles.empty}>No data yet. Start logging workouts!</Text>
                ) : (
                  data?.personalRecords.map((pr) => (
                    <View key={pr.id} style={styles.prRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.prName}>{pr.exercise.name}</Text>
                        <Text style={styles.prCategory}>{pr.exercise.category}</Text>
                      </View>
                      <View style={styles.prBadge}>
                        <Text style={styles.prBadgeText}>
                          {pr.weightKg != null ? `${pr.weightKg} kg` : ""}
                          {pr.weightKg != null && pr.reps != null ? " × " : ""}
                          {pr.reps != null ? `${pr.reps} reps` : ""}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 16 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 10,
    padding: 3,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#059669" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  cardLabel: { fontSize: 13, color: "#6b7280", marginBottom: 12, fontWeight: "500" },
  statRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8, gap: 4 },
  bigNumber: { fontSize: 42, fontWeight: "800", color: "#111827" },
  bigUnit: { fontSize: 16, color: "#6b7280", marginBottom: 8 },
  chartWrap: { marginTop: 8, alignItems: "center" },
  empty: { color: "#9ca3af", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  axisLabel: { position: "absolute", top: 0, left: 0, fontSize: 10, color: "#9ca3af" },
  barValue: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  prName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  prCategory: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  prBadge: {
    backgroundColor: "#d1fae5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  prBadgeText: { fontSize: 13, fontWeight: "700", color: "#059669" },
});
