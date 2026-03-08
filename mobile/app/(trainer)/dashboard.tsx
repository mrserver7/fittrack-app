import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/store/auth-store";

export default function TrainerDashboard() {
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.greeting}>Hey, {user?.name?.split(" ")[0]} 👋</Text>
        <Text style={styles.subtitle}>Here's your overview</Text>

        {/* TODO: fetch and display real stats */}
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Dashboard coming soon…</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20 },
  greeting: { fontSize: 24, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 14, color: "#6b7280", marginTop: 4, marginBottom: 24 },
  placeholder: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  placeholderText: { color: "#9ca3af", fontSize: 14 },
});
