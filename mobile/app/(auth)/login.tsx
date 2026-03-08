import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore, AuthUser } from "@/src/store/auth-store";
import { API_BASE } from "@/src/api/client";

type BlockedReason = "pending" | "invited" | "archived" | "rejected" | "invalid" | null;

const blockedMessages: Record<Exclude<BlockedReason, "invalid" | null>, string> = {
  rejected: "Your account has been rejected. Please contact your trainer.",
  archived: "Your account has been removed. Please contact your trainer.",
  pending: "Your account is awaiting approval from your trainer.",
  invited: "Please use the invitation link sent to your email to activate your account.",
};

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blocked, setBlocked] = useState<BlockedReason>(null);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    setBlocked(null);

    try {
      const res = await fetch(`${API_BASE}/api/auth/mobile-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      if (res.ok) {
        const { token, user } = await res.json() as { token: string; user: AuthUser };
        await setAuth(token, user);
        router.replace("/");
        return;
      }

      // Failed — check specific reason
      const statusRes = await fetch(`${API_BASE}/api/auth/check-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const statusData = await statusRes.json() as { reason: BlockedReason };
      const reason = statusData.reason ?? "invalid";
      if (reason !== "invalid") {
        setBlocked(reason);
      } else {
        setError("Incorrect email or password.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
    setBlocked(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>FT</Text>
          </View>
          <Text style={styles.logoLabel}>FitTrack</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); clearError(); }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); clearError(); }}
            />
          </View>

          {/* Error states */}
          {error && (
            <View style={[styles.alert, styles.alertRed]}>
              <Text style={styles.alertRed_text}>{error}</Text>
            </View>
          )}
          {blocked && blocked !== "invalid" && (
            <View style={[styles.alert, styles.alertAmber]}>
              <Text style={styles.alertAmber_text}>{blockedMessages[blocked]}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f9fafb" },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#059669",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  logoLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#fff",
  },
  alert: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  alertRed: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  alertRed_text: { color: "#dc2626", fontSize: 13 },
  alertAmber: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  alertAmber_text: { color: "#92400e", fontSize: 13 },
  button: {
    backgroundColor: "#059669",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
});
