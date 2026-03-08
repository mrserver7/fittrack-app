import { useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, Dumbbell } from "lucide-react-native";
import { api } from "@/src/api/client";

interface SessionSummary {
  id: string;
  scheduledDate: string;
  completedAt: string | null;
  durationMinutes: number | null;
  totalVolumeKg: number | null;
  overallFeedbackEmoji: string | null;
  dayLabel: string;
  setsCount: number;
}

interface SessionHistoryPage {
  sessions: SessionSummary[];
  nextCursor: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });
}

export default function WorkoutsHistory() {
  const router = useRouter();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isRefetching,
  } = useInfiniteQuery<SessionHistoryPage>({
    queryKey: ["session-history"],
    queryFn: ({ pageParam }) =>
      api.get<SessionHistoryPage>(
        `/api/mobile/session-history${pageParam ? `?cursor=${pageParam}` : ""}`
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const sessions = data?.pages.flatMap((p) => p.sessions) ?? [];

  const renderItem = ({ item }: { item: SessionSummary }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push({ pathname: "/(client)/workout-detail" as never, params: { id: item.id } })}
      activeOpacity={0.75}
    >
      <View style={s.cardLeft}>
        <View style={s.iconWrap}>
          <Dumbbell size={18} color="#059669" />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.cardTop}>
          <Text style={s.dayLabel}>{item.dayLabel}</Text>
          {item.overallFeedbackEmoji ? (
            <Text style={s.emoji}>{item.overallFeedbackEmoji}</Text>
          ) : null}
        </View>
        <Text style={s.dateText}>{formatDate(item.scheduledDate)}</Text>
        <View style={s.metaRow}>
          {item.durationMinutes != null && (
            <Text style={s.metaChip}>{item.durationMinutes}m</Text>
          )}
          {item.totalVolumeKg != null && (
            <Text style={s.metaChip}>{Math.round(item.totalVolumeKg)}kg vol</Text>
          )}
          <Text style={s.metaChip}>{item.setsCount} sets</Text>
        </View>
      </View>
      <ChevronRight size={16} color="#d1d5db" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={24} color="#059669" />
        </TouchableOpacity>
        <Text style={s.title}>Workout History</Text>
        <View style={{ width: 32 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View style={s.empty}>
          <Dumbbell size={48} color="#d1d5db" />
          <Text style={s.emptyTitle}>No sessions yet</Text>
          <Text style={s.emptyText}>Completed workouts will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? <ActivityIndicator color="#059669" style={{ marginVertical: 16 }} /> : null
          }
        />
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
  title: { fontSize: 17, fontWeight: "700", color: "#111827" },

  list: { padding: 16, gap: 10 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  cardLeft: {},
  iconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  dayLabel: { fontSize: 15, fontWeight: "600", color: "#111827" },
  emoji: { fontSize: 16 },
  dateText: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  metaRow: { flexDirection: "row", gap: 6 },
  metaChip: {
    fontSize: 11, fontWeight: "600", color: "#059669",
    backgroundColor: "#f0fdf4", paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8,
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});
