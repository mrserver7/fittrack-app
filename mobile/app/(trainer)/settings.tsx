import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "@/src/store/auth-store";
import { useUpdateProfile, useChangePassword } from "@/src/api/queries";
import { API_BASE } from "@/src/api/client";

export default function TrainerSettings() {
  const { clearAuth, user, setAuth, token } = useAuthStore();
  const router = useRouter();

  const [name, setName] = useState(user?.name ?? "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [uploading, setUploading] = useState(false);

  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const initials = user
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "";

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

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);

      // Upload to backend via multipart FormData
      const formData = new FormData();
      formData.append("file", {
        uri: asset.uri,
        type: "image/jpeg",
        name: "avatar.jpg",
      } as any);

      const uploadRes = await fetch(`${API_BASE}/api/settings/upload-avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();

      // Update profile with new photo URL
      updateProfile.mutate(
        { photoUrl: url },
        {
          onSuccess: () => {
            if (user && token) {
              setAuth(token, { ...user, photoUrl: url });
            }
          },
          onError: () => Alert.alert("Error", "Photo uploaded but failed to save to profile."),
        }
      );
    } catch {
      Alert.alert("Error", "Failed to upload photo.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert("Remove Photo", "Are you sure you want to remove your profile photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          updateProfile.mutate(
            { photoUrl: null },
            {
              onSuccess: () => {
                if (user && token) {
                  setAuth(token, { ...user, photoUrl: null });
                }
              },
              onError: () => Alert.alert("Error", "Failed to remove photo."),
            }
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>Settings</Text>

        {/* Profile card with photo upload */}
        {user && (
          <View style={s.profileCard}>
            <View style={s.avatarSection}>
              <TouchableOpacity
                onPress={handlePickPhoto}
                disabled={uploading}
                activeOpacity={0.7}
              >
                <View style={s.avatarWrapper}>
                  {user.photoUrl ? (
                    <Image
                      source={{ uri: user.photoUrl }}
                      style={s.avatarImage}
                    />
                  ) : (
                    <View style={s.avatarBox}>
                      <Text style={s.avatarText}>{initials}</Text>
                    </View>
                  )}
                  {/* Camera badge */}
                  <View style={s.cameraBadge}>
                    {uploading ? (
                      <ActivityIndicator color="#fff" size={12} />
                    ) : (
                      <Text style={s.cameraIcon}>📷</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
              {user.photoUrl && (
                <TouchableOpacity onPress={handleRemovePhoto} style={s.removePhotoBtn}>
                  <Text style={s.removePhotoText}>Remove photo</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.profileInfo}>
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
  avatarSection: {
    alignItems: "center",
  },
  avatarWrapper: {
    width: 72, height: 72, position: "relative",
  },
  avatarImage: {
    width: 72, height: 72, borderRadius: 36,
  },
  avatarBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#059669", fontWeight: "700", fontSize: 24 },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "#059669",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#fff",
  },
  cameraIcon: { fontSize: 12 },
  removePhotoBtn: {
    marginTop: 6,
  },
  removePhotoText: {
    fontSize: 12, color: "#dc2626", fontWeight: "500",
  },
  profileInfo: {
    flex: 1,
  },
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
