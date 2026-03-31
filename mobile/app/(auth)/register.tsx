import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { API_BASE } from "@/src/api/client";
import { CheckCircle } from "lucide-react-native";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password) {
      return setError("Please fill in your name, email, and password.");
    }
    if (password.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (password !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/register-subscriber`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          goalsText: goals.trim() || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={s.successContainer}>
        <View style={s.successIcon}>
          <CheckCircle size={48} color="#059669" />
        </View>
        <Text style={s.successTitle}>Account Created!</Text>
        <Text style={s.successBody}>
          Your account is pending approval from a trainer. You'll be able to sign in once approved.
        </Text>
        <TouchableOpacity style={s.backBtn} onPress={() => router.replace("/(auth)/login")}>
          <Text style={s.backBtnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={s.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoContainer}>
          <View style={s.logoBox}>
            <Text style={s.logoText}>FT</Text>
          </View>
          <Text style={s.logoLabel}>FitTrack</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          <Text style={s.title}>Create account</Text>
          <Text style={s.subtitle}>Join FitTrack as a subscriber</Text>

          <View style={s.field}>
            <Text style={s.label}>Full Name</Text>
            <TextInput
              style={s.input}
              placeholder="Mohammed Al-Rashid"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              value={name}
              onChangeText={(v) => { setName(v); setError(null); }}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(null); }}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="Min. 8 characters"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={password}
              onChangeText={(v) => { setPassword(v); setError(null); }}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Confirm Password</Text>
            <TextInput
              style={s.input}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Goals <Text style={s.optional}>(optional)</Text></Text>
            <TextInput
              style={[s.input, s.textArea]}
              placeholder="e.g. Lose weight, build muscle, improve endurance..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={goals}
              onChangeText={setGoals}
            />
          </View>

          {error && (
            <View style={s.alert}>
              <Text style={s.alertText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.button, loading && s.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={s.signInRow}>
            <Text style={s.signInHint}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={s.signInLink}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: "#f9fafb" },
  container: { flexGrow: 1, justifyContent: "center", padding: 24 },
  logoContainer: {
    alignItems: "center", marginBottom: 28,
    flexDirection: "row", justifyContent: "center", gap: 10,
  },
  logoBox: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "#059669",
    alignItems: "center", justifyContent: "center",
  },
  logoText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  logoLabel: { fontSize: 22, fontWeight: "700", color: "#111827" },
  card: {
    backgroundColor: "#fff", borderRadius: 20, padding: 28,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 24 },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  optional: { color: "#9ca3af", fontWeight: "400" },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: "#111827", backgroundColor: "#fff",
  },
  textArea: { height: 72, textAlignVertical: "top" },
  alert: {
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 10, padding: 12, marginBottom: 12,
  },
  alertText: { color: "#dc2626", fontSize: 13 },
  button: {
    backgroundColor: "#059669", borderRadius: 10,
    paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
  signInRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#f3f4f6",
  },
  signInHint: { fontSize: 13, color: "#6b7280" },
  signInLink: { fontSize: 13, color: "#059669", fontWeight: "700" },
  // Success state
  successContainer: {
    flex: 1, backgroundColor: "#f9fafb",
    alignItems: "center", justifyContent: "center", padding: 32,
  },
  successIcon: {
    width: 88, height: 88, borderRadius: 44, backgroundColor: "#d1fae5",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: "700", color: "#111827", marginBottom: 12 },
  successBody: {
    fontSize: 15, color: "#6b7280", textAlign: "center",
    lineHeight: 22, marginBottom: 32,
  },
  backBtn: {
    backgroundColor: "#059669", borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 14,
  },
  backBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
