import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useAuthStore } from "@/src/store/auth-store";
import { useUpdateProfile, useChangePassword } from "@/src/api/queries";

export default function TrainerSettings() {
  const { clearAuth, user, setAuth, token } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const handleSignOut = async () => {
    await clearAuth();
    router.replace("/(auth)/login");
  };

  const handleSaveName = () => {
    if (!name.trim()) return;
    updateProfile.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          if (user && token) {
            setAuth(token, { ...user, name: name.trim() });
          }
          Alert.alert("Saved", "Your name has been updated.");
        },
        onError: () => Alert.alert("Error", "Failed to update name."),
      }
    );
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert("Error", "All password fields are required.");
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert("Error", "New passwords don't match.");
      return;
    }
    if (newPw.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters.");
      return;
    }
    changePassword.mutate(
      { currentPassword: currentPw, newPassword: newPw },
      {
        onSuccess: () => {
          setCurrentPw(""); setNewPw(""); setConfirmPw("");
          Alert.alert("Done", "Password changed successfully.");
        },
        onError: (err) =>
          Alert.alert("Error", err instanceof Error ? err.message : "Failed to change password."),
      }
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Settings</Text>

        {/* Profile card */}
        {user && (
          <View style={s.profileCard}>
            <View style={s.avatarBox}>
              <Text style={s.avatarText}>
                {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </Text>
            </View>
            <View>
              <Text style={s.userName}>{user.name}</Text>
              <Text style={s.userEmail}>{user.email}</Text>
            </View>
          </View>
        )}

        {/* Edit name */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Display Name</Text>
          <View style={s.card}>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[s.saveBtn, updateProfile.isPending && s.btnDisabled]}
              onPress={handleSaveName}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.saveBtnText}>Save Name</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Change password */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Change Password</Text>
          <View style={s.card}>
            <TextInput
              style={[s.input, s.inputBorder]}
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="Current password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
            <TextInput
              style={[s.input, s.inputBorder]}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="New password (min 8 chars)"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
            <TextInput
              style={[s.input, s.inputBorder]}
              value={confirmPw}
              onChangeText={setConfirmPw}
              placeholder="Confirm new password"
              placeholderTextColor="#9ca3af"
              secureTextEntry
            />
            <TouchableOpacity
              style={[s.saveBtn, changePassword.isPending && s.btnDisabled]}
              onPress={handleChangePassword}
              disabled={changePassword.isPending}
            >
              {changePassword.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.saveBtnText}>Change Password</Text>}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut}>
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", marginBottom: 20 },

  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 20,
  },
  avatarBox: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#059669", fontWeight: "700", fontSize: 18 },
  userName: { fontSize: 16, fontWeight: "600", color: "#111827" },
  userEmail: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e5e7eb", gap: 12,
  },
  input: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: "#111827", backgroundColor: "#f9fafb",
  },
  inputBorder: { marginTop: 0 },
  saveBtn: {
    backgroundColor: "#059669", borderRadius: 12,
    padding: 13, alignItems: "center",
  },
  btnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  signOutBtn: {
    backgroundColor: "#fee2e2", borderRadius: 14,
    padding: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#fca5a5",
  },
  signOutText: { color: "#dc2626", fontWeight: "600", fontSize: 15 },
});
