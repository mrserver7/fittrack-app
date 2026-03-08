import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/src/store/auth-store";

export default function AdminOverview() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Admin Panel</Text>
        <Text style={styles.sub}>Admin features coming soon…</Text>
        <TouchableOpacity
          style={styles.signOut}
          onPress={async () => { await clearAuth(); router.replace("/(auth)/login"); }}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  sub: { color: "#9ca3af", marginBottom: 24 },
  signOut: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  signOutText: { color: "#dc2626", fontWeight: "600" },
});
