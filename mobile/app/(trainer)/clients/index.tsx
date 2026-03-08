import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Search, User, ChevronRight } from "lucide-react-native";
import { useClients } from "@/src/api/queries";

const STATUS_TABS = ["all", "active", "pending"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function ClientsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusTab>("all");

  const { data, isLoading } = useClients(search, status === "all" ? "" : status);
  const clients = data?.clients ?? [];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Clients</Text>
        <Text style={s.count}>{clients.length}</Text>
      </View>

      {/* Search */}
      <View style={s.searchRow}>
        <Search size={16} color="#9ca3af" style={s.searchIcon} />
        <TextInput
          style={s.searchInput}
          placeholder="Search clients…"
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
      </View>

      {/* Status filter tabs */}
      <View style={s.tabs}>
        {STATUS_TABS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[s.tab, status === t && s.tabActive]}
            onPress={() => setStatus(t)}
          >
            <Text style={[s.tabText, status === t && s.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#059669" />
      ) : clients.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>No clients found</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => router.push({ pathname: "/(trainer)/clients/[id]" as any, params: { id: item.id } })}
              activeOpacity={0.7}
            >
              {item.photoUrl ? (
                <Image source={{ uri: item.photoUrl }} style={s.avatar} />
              ) : (
                <View style={s.avatarFallback}>
                  <User size={20} color="#9ca3af" />
                </View>
              )}
              <View style={s.cardBody}>
                <Text style={s.clientName}>{item.name}</Text>
                <Text style={s.clientEmail}>{item.email}</Text>
                <View style={s.metaRow}>
                  <View style={[s.badge, item.status === "active" ? s.badgeGreen : s.badgeYellow]}>
                    <Text style={[s.badgeText, item.status === "active" ? s.badgeTextGreen : s.badgeTextYellow]}>
                      {item.status}
                    </Text>
                  </View>
                  {item.programName && (
                    <Text style={s.program}>{item.programName}</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={16} color="#d1d5db" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", flex: 1 },
  count: { fontSize: 14, color: "#6b7280", fontWeight: "600" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, height: 40, color: "#111827", fontSize: 14 },
  tabs: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  tabActive: { backgroundColor: "#059669" },
  tabText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  tabTextActive: { color: "#fff" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyText: { color: "#9ca3af", fontSize: 15 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#f0fdf4",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardBody: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  clientEmail: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeGreen: { backgroundColor: "#d1fae5" },
  badgeYellow: { backgroundColor: "#fef9c3" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  badgeTextGreen: { color: "#065f46" },
  badgeTextYellow: { color: "#854d0e" },
  program: { fontSize: 12, color: "#6b7280", flex: 1 },
});
