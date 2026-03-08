import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/api/client";
import { ClipboardList } from "lucide-react-native";

interface WorkoutExercise {
  id: string;
}

interface WorkoutDay {
  exercises: WorkoutExercise[];
}

interface ProgramWeek {
  id: string;
  weekNumber: number;
  days: WorkoutDay[];
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  durationWeeks: number;
  goalTag: string | null;
  weeks: ProgramWeek[];
  _count: { clientPrograms: number };
}

interface ProgramsResponse {
  programs: Program[];
}

function countExercises(program: Program): number {
  let total = 0;
  for (const week of program.weeks) {
    for (const day of week.days) {
      total += day.exercises.length;
    }
  }
  return total;
}

export default function TrainerPrograms() {
  const { data, isLoading, refetch, isRefetching } = useQuery<ProgramsResponse>({
    queryKey: ["trainer-programs"],
    queryFn: () => api.get<ProgramsResponse>("/api/programs"),
  });

  const programs = data?.programs ?? [];

  const renderItem = ({ item }: { item: Program }) => {
    const exerciseCount = countExercises(item);
    const activeClients = item._count.clientPrograms;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconWrap}>
            <ClipboardList size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.programName}>{item.name}</Text>
            {item.goalTag && (
              <View style={styles.goalBadge}>
                <Text style={styles.goalBadgeText}>{item.goalTag}</Text>
              </View>
            )}
          </View>
          {activeClients > 0 && (
            <View style={styles.clientsBadge}>
              <Text style={styles.clientsBadgeText}>{activeClients} active</Text>
            </View>
          )}
        </View>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.durationWeeks}</Text>
            <Text style={styles.statLabel}>weeks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{item.weeks.length}</Text>
            <Text style={styles.statLabel}>phases</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{exerciseCount}</Text>
            <Text style={styles.statLabel}>exercises</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Programs</Text>
        <Text style={styles.subtitle}>{programs.length} program{programs.length !== 1 ? "s" : ""}</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : programs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <ClipboardList size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No programs yet</Text>
          <Text style={styles.emptySubText}>Create programs from the web app.</Text>
        </View>
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  programName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  goalBadge: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  goalBadgeText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  clientsBadge: {
    backgroundColor: "#059669",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clientsBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  description: { fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 18 },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#e5e7eb" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
});
