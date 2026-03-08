import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api/client";
import { BarChart3, Trophy, Users } from "lucide-react-native";

interface WeeklyDataPoint {
  week: string;
  count: number;
}

interface TopExercise {
  name: string;
  count: number;
}

interface ClientAdherence {
  name: string;
  total: number;
  recent: number;
}

interface AnalyticsData {
  totalSessions: number;
  weeklyData: WeeklyDataPoint[];
  topExercises: TopExercise[];
  clientAdherence: ClientAdherence[];
}

function WeeklyBarChart({ data }: { data: WeeklyDataPoint[] }) {
  if (!data.length) {
    return <Text style={styles.empty}>No session data yet.</Text>;
  }
  const max = Math.max(...data.map((d) => d.count), 1);
  const BAR_MAX_H = 100;

  return (
    <View>
      <View style={styles.barChart}>
        {data.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <Text style={styles.barCount}>{d.count > 0 ? d.count : ""}</Text>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  { height: Math.max(d.count > 0 ? (d.count / max) * BAR_MAX_H : 2, 2) },
                ]}
              />
            </View>
            <Text style={styles.barLabel}>{d.week.slice(5)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function TrainerAnalytics() {
  const { data, isLoading, refetch, isRefetching } = useQuery<AnalyticsData>({
    queryKey: ["trainer-analytics"],
    queryFn: () => api.get<AnalyticsData>("/api/mobile/trainer-analytics"),
  });

  const maxExerciseCount = data?.topExercises.length
    ? Math.max(...data.topExercises.map((e) => e.count), 1)
    : 1;

  const maxClientTotal = data?.clientAdherence.length
    ? Math.max(...data.clientAdherence.map((c) => c.total), 1)
    : 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />
        }
      >
        <Text style={styles.title}>Analytics</Text>

        {isLoading ? (
          <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Total sessions stat */}
            <View style={styles.statCard}>
              <View style={styles.statIconWrap}>
                <BarChart3 size={24} color="#059669" />
              </View>
              <View>
                <Text style={styles.statBigNum}>{data?.totalSessions ?? 0}</Text>
                <Text style={styles.statBigLabel}>Total Sessions Completed</Text>
              </View>
            </View>

            {/* Weekly sessions bar chart */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sessions Per Week</Text>
              <Text style={styles.cardSubtitle}>Last 12 weeks</Text>
              <WeeklyBarChart data={data?.weeklyData ?? []} />
            </View>

            {/* Top exercises */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Trophy size={16} color="#f59e0b" />
                <Text style={styles.cardTitle}>Top Exercises</Text>
              </View>
              {(data?.topExercises ?? []).length === 0 ? (
                <Text style={styles.empty}>No exercise data yet.</Text>
              ) : (
                data?.topExercises.map((ex, i) => (
                  <View key={i} style={styles.exerciseRow}>
                    <View style={styles.exerciseRank}>
                      <Text style={styles.exerciseRankText}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.exerciseName}>{ex.name}</Text>
                      <View style={styles.exerciseBarTrack}>
                        <View
                          style={[
                            styles.exerciseBar,
                            { width: `${(ex.count / maxExerciseCount) * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.exerciseCount}>{ex.count}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Client adherence */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Users size={16} color="#059669" />
                <Text style={styles.cardTitle}>Client Adherence</Text>
              </View>
              <Text style={styles.cardSubtitle}>Sessions in last 12 weeks vs all-time</Text>
              {(data?.clientAdherence ?? []).length === 0 ? (
                <Text style={styles.empty}>No active clients yet.</Text>
              ) : (
                data?.clientAdherence.map((c, i) => (
                  <View key={i} style={styles.clientRow}>
                    <View style={styles.clientAvatar}>
                      <Text style={styles.clientAvatarText}>
                        {c.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.clientNameRow}>
                        <Text style={styles.clientName}>{c.name}</Text>
                        <Text style={styles.clientSessions}>
                          {c.recent} recent / {c.total} total
                        </Text>
                      </View>
                      <View style={styles.clientBarTrack}>
                        <View
                          style={[
                            styles.clientBar,
                            {
                              width: `${(c.total / maxClientTotal) * 100}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
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
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  statBigNum: { fontSize: 36, fontWeight: "800", color: "#111827" },
  statBigLabel: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardSubtitle: { fontSize: 12, color: "#9ca3af", marginBottom: 14 },
  empty: { color: "#9ca3af", fontSize: 14, textAlign: "center", paddingVertical: 16 },
  // Bar chart
  barChart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 130,
    gap: 3,
    marginTop: 8,
  },
  barCol: { flex: 1, alignItems: "center" },
  barCount: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar: { backgroundColor: "#059669", borderRadius: 3, width: "100%" },
  barLabel: { fontSize: 8, color: "#9ca3af", marginTop: 3, textAlign: "center" },
  // Top exercises
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  exerciseRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  exerciseRankText: { fontSize: 12, fontWeight: "700", color: "#374151" },
  exerciseName: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4 },
  exerciseBarTrack: { height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  exerciseBar: { height: "100%", backgroundColor: "#059669", borderRadius: 3 },
  exerciseCount: { fontSize: 13, fontWeight: "700", color: "#059669", minWidth: 28, textAlign: "right" },
  // Client adherence
  clientRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  clientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  clientAvatarText: { fontSize: 14, fontWeight: "700", color: "#059669" },
  clientNameRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  clientName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  clientSessions: { fontSize: 11, color: "#9ca3af" },
  clientBarTrack: { height: 6, backgroundColor: "#f3f4f6", borderRadius: 3, overflow: "hidden" },
  clientBar: { height: "100%", backgroundColor: "#6ee7b7", borderRadius: 3 },
});
