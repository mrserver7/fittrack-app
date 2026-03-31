import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, RefreshControl,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { api } from "@/src/api/client";
import { useAuthStore } from "@/src/store/auth-store";

type Entry = { clientId: string; currentValue: number };
type Challenge = {
  id: string; title: string; description: string | null; type: string;
  targetValue: number | null; unit: string | null; startDate: string; endDate: string;
  isActive: boolean; _count: { entries: number };
  entries: Entry[];
};
type EnrolledEntry = {
  challengeId: string; currentValue: number;
  challenge: Challenge & { entries: Entry[] };
};
type ChallengesData = { enrolled: EnrolledEntry[]; available: Challenge[] };

const TYPE_EMOJI: Record<string, string> = { volume: "🔥", consistency: "🎯", custom: "🏆" };

export default function ChallengesScreen() {
  const [data, setData] = useState<ChallengesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const user = useAuthStore((s) => s.user);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const d = await api.get<ChallengesData>("/api/challenges");
      setData(d);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const joinChallenge = async (id: string) => {
    setJoining(id);
    try {
      await api.post(`/api/challenges/${id}/enroll`, {});
      await load(true);
    } catch {}
    setJoining(null);
  };

  const today = new Date().toISOString().split("T")[0];

  const myRank = (e: EnrolledEntry) => {
    const sorted = [...e.challenge.entries].sort((a, b) => b.currentValue - a.currentValue);
    return sorted.findIndex((x) => x.clientId === user?.id) + 1;
  };

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#059669" size="large" /></View>
  );

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true); }} tintColor="#059669" />}
    >
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>🏆 Challenges</Text>
        <Text style={s.headerSub}>
          {data?.enrolled.length ?? 0} active · {data?.available.length ?? 0} to join
        </Text>
      </View>

      {/* Enrolled challenges */}
      {(data?.enrolled.length ?? 0) > 0 && (
        <>
          <Text style={s.sectionLabel}>MY CHALLENGES</Text>
          {data!.enrolled.map((e) => {
            const c = e.challenge;
            const rank = myRank(e);
            const isEnded = c.endDate < today;
            const pct = c.targetValue ? Math.min(100, Math.round((e.currentValue / c.targetValue) * 100)) : null;
            const topThree = [...c.entries].sort((a, b) => b.currentValue - a.currentValue).slice(0, 3);

            return (
              <View key={e.challengeId} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.emoji}>{TYPE_EMOJI[c.type] ?? "🏆"}</Text>
                  <View style={s.cardHeaderText}>
                    <Text style={s.cardTitle}>{c.title}</Text>
                    {c.description ? <Text style={s.cardDesc}>{c.description}</Text> : null}
                  </View>
                  <View style={[s.badge, isEnded ? s.badgeGray : s.badgeGreen]}>
                    <Text style={[s.badgeText, isEnded ? s.badgeTextGray : s.badgeTextGreen]}>
                      {isEnded ? "Ended" : "Live"}
                    </Text>
                  </View>
                </View>

                {/* Stats row */}
                <View style={s.statsRow}>
                  <View style={s.statBox}>
                    <Text style={s.statValue}>{e.currentValue}</Text>
                    <Text style={s.statLabel}>{c.unit || (c.type === "consistency" ? "workouts" : "kg")}</Text>
                  </View>
                  <View style={s.statBox}>
                    <Text style={[s.statValue, { color: "#d97706" }]}>#{rank || "—"}</Text>
                    <Text style={s.statLabel}>Rank</Text>
                  </View>
                  <View style={s.statBox}>
                    <Text style={s.statValue}>{c._count.entries}</Text>
                    <Text style={s.statLabel}>Joined</Text>
                  </View>
                </View>

                {/* Progress bar */}
                {pct !== null && (
                  <View style={s.progressContainer}>
                    <View style={s.progressTrack}>
                      <View style={[s.progressFill, { width: `${pct}%` as `${number}%`, backgroundColor: pct >= 100 ? "#10b981" : "#f59e0b" }]} />
                    </View>
                    <Text style={s.progressPct}>{pct}%</Text>
                  </View>
                )}

                {/* Mini leaderboard */}
                {topThree.length > 0 && (
                  <View style={s.leaderboard}>
                    <Text style={s.leaderboardTitle}>🥇 Top Participants</Text>
                    {topThree.map((entry, idx) => (
                      <View key={entry.clientId} style={s.leaderRow}>
                        <Text style={s.leaderRank}>{["🥇","🥈","🥉"][idx]}</Text>
                        <Text style={[s.leaderName, entry.clientId === user?.id && s.leaderNameMe]}>
                          {entry.clientId === user?.id ? "You" : `Participant ${idx + 1}`}
                        </Text>
                        <Text style={s.leaderScore}>{entry.currentValue} {c.unit || ""}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={s.dateRange}>{c.startDate} → {c.endDate}</Text>
              </View>
            );
          })}
        </>
      )}

      {/* Available to join */}
      {(data?.available.length ?? 0) > 0 && (
        <>
          <Text style={[s.sectionLabel, { marginTop: 24 }]}>AVAILABLE TO JOIN</Text>
          {data!.available.map((c) => (
            <View key={c.id} style={s.availableCard}>
              <View style={s.availableLeft}>
                <Text style={s.emoji}>{TYPE_EMOJI[c.type] ?? "🏆"}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle}>{c.title}</Text>
                  {c.description ? <Text style={s.cardDesc} numberOfLines={1}>{c.description}</Text> : null}
                  <Text style={s.dateRange}>{c.startDate} → {c.endDate} · {c._count.entries} joined</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[s.joinBtn, joining === c.id && s.joinBtnDisabled]}
                onPress={() => joinChallenge(c.id)}
                disabled={joining === c.id}
              >
                <Text style={s.joinBtnText}>{joining === c.id ? "..." : "Join"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </>
      )}

      {!data?.enrolled.length && !data?.available.length && (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>🏆</Text>
          <Text style={s.emptyTitle}>No challenges yet</Text>
          <Text style={s.emptySub}>Your trainer hasn't created any challenges yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { marginBottom: 20, paddingTop: 8 },
  headerTitle: { fontSize: 24, fontWeight: "800", color: "#111827" },
  headerSub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", letterSpacing: 0.8, marginBottom: 8 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  emoji: { fontSize: 24, marginTop: 2 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  cardDesc: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  badge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeGreen: { backgroundColor: "#d1fae5" },
  badgeGray: { backgroundColor: "#f3f4f6" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeTextGreen: { color: "#065f46" },
  badgeTextGray: { color: "#6b7280" },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statBox: { flex: 1, backgroundColor: "#f9fafb", borderRadius: 12, padding: 10, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  progressTrack: { flex: 1, height: 8, backgroundColor: "#f3f4f6", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  progressPct: { fontSize: 12, fontWeight: "600", color: "#6b7280", width: 36, textAlign: "right" },
  leaderboard: { backgroundColor: "#f9fafb", borderRadius: 12, padding: 12, marginBottom: 8 },
  leaderboardTitle: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 8 },
  leaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  leaderRank: { fontSize: 16, width: 28 },
  leaderName: { flex: 1, fontSize: 13, color: "#374151" },
  leaderNameMe: { fontWeight: "700", color: "#059669" },
  leaderScore: { fontSize: 13, fontWeight: "700", color: "#111827" },
  dateRange: { fontSize: 11, color: "#9ca3af", marginTop: 4 },
  availableCard: { backgroundColor: "#fff", borderRadius: 16, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  availableLeft: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, marginRight: 10 },
  joinBtn: { backgroundColor: "#059669", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  joinBtnDisabled: { opacity: 0.5 },
  joinBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#111827", marginBottom: 6 },
  emptySub: { fontSize: 14, color: "#6b7280", textAlign: "center" },
});
