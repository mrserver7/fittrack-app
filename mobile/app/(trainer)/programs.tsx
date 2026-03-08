import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TrainerPrograms() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Programs</Text>
        <Text style={styles.sub}>Programs coming soon…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  sub: { color: "#9ca3af" },
});
