import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/api/client";
import { ClipboardList, Plus, X } from "lucide-react-native";
import { useState } from "react";

interface WorkoutExercise { id: string }
interface WorkoutDay { exercises: WorkoutExercise[] }
interface ProgramWeek { id: string; weekNumber: number; days: WorkoutDay[] }
interface Program {
  id: string; name: string; description: string | null; durationWeeks: number;
  goalTag: string | null; weeks: ProgramWeek[]; _count: { clientPrograms: number };
}
interface ProgramsResponse { programs: Program[] }

const GOAL_TAGS = ["Weight Loss", "Muscle Gain", "Strength", "Endurance", "General Fitness", "Athletic Performance", "Rehabilitation"];
const DURATIONS = [4, 6, 8, 10, 12, 16];

function countExercises(p: Program) {
  return p.weeks.reduce((t, w) => t + w.days.reduce((dt, d) => dt + d.exercises.length, 0), 0);
}

function CreateProgramModal({ visible, onClose, onCreated }: {
  visible: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [goalTag, setGoalTag] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => { setName(""); setDescription(""); setDurationWeeks(8); setGoalTag(""); };

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert("Required", "Please enter a program name.");
    setSaving(true);
    try {
      await api.post("/api/programs", {
        name: name.trim(),
        description: description.trim() || null,
        durationWeeks,
        goalTag: goalTag || null,
      });
      reset();
      onCreated();
      onClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to create program.";
      Alert.alert("Error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {/* Modal header */}
          <View style={ms.modalHeader}>
            <Text style={ms.modalTitle}>New Program</Text>
            <TouchableOpacity onPress={onClose} style={ms.closeBtn}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={ms.modalBody} keyboardShouldPersistTaps="handled">
            <View style={ms.field}>
              <Text style={ms.label}>Program Name *</Text>
              <TextInput
                style={ms.input}
                placeholder="e.g. 8-Week Strength Builder"
                placeholderTextColor="#9ca3af"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={ms.field}>
              <Text style={ms.label}>Description</Text>
              <TextInput
                style={[ms.input, ms.textArea]}
                placeholder="Brief overview of this program..."
                placeholderTextColor="#9ca3af"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={ms.field}>
              <Text style={ms.label}>Duration</Text>
              <View style={ms.chipRow}>
                {DURATIONS.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[ms.chip, durationWeeks === d && ms.chipActive]}
                    onPress={() => setDurationWeeks(d)}
                  >
                    <Text style={[ms.chipText, durationWeeks === d && ms.chipTextActive]}>{d}w</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={ms.field}>
              <Text style={ms.label}>Goal Tag</Text>
              <View style={ms.chipRow}>
                {GOAL_TAGS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[ms.chip, goalTag === g && ms.chipActive]}
                    onPress={() => setGoalTag(goalTag === g ? "" : g)}
                  >
                    <Text style={[ms.chipText, goalTag === g && ms.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={ms.noteBox}>
              <Text style={ms.noteText}>
                💡 After creating the program, add weeks and exercises from the web app for a better experience.
              </Text>
            </View>

            <TouchableOpacity
              style={[ms.createBtn, saving && ms.createBtnDisabled]}
              onPress={handleCreate}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={ms.createBtnText}>Create Program</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function TrainerPrograms() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

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
        {item.description ? <Text style={styles.description} numberOfLines={2}>{item.description}</Text> : null}
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
        <View>
          <Text style={styles.title}>Programs</Text>
          <Text style={styles.subtitle}>{programs.length} program{programs.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Plus size={18} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={programs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <ClipboardList size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No programs yet</Text>
              <Text style={styles.emptySubText}>Tap "New" to create your first program.</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
                <Plus size={16} color="#059669" />
                <Text style={styles.emptyBtnText}>Create Program</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateProgramModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => queryClient.invalidateQueries({ queryKey: ["trainer-programs"] })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  subtitle: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#059669", borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: "#d1fae5",
    alignItems: "center", justifyContent: "center",
  },
  programName: { fontSize: 16, fontWeight: "700", color: "#111827", flex: 1 },
  goalBadge: {
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0",
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
    alignSelf: "flex-start", marginTop: 4,
  },
  goalBadgeText: { fontSize: 11, color: "#059669", fontWeight: "600" },
  clientsBadge: { backgroundColor: "#059669", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  clientsBadgeText: { fontSize: 12, color: "#fff", fontWeight: "700" },
  description: { fontSize: 13, color: "#6b7280", marginBottom: 12, lineHeight: 18 },
  statsRow: {
    flexDirection: "row", backgroundColor: "#f9fafb",
    borderRadius: 10, padding: 12, marginTop: 4,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  statDivider: { width: 1, backgroundColor: "#e5e7eb" },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: "#9ca3af", textAlign: "center", marginBottom: 20 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1.5, borderColor: "#059669", borderRadius: 10,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  emptyBtnText: { fontSize: 14, color: "#059669", fontWeight: "700" },
});

const ms = StyleSheet.create({
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#f3f4f6",
    alignItems: "center", justifyContent: "center",
  },
  modalBody: { padding: 20, paddingBottom: 40 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: "#d1d5db", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14,
    color: "#111827", backgroundColor: "#fff",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb",
  },
  chipActive: { backgroundColor: "#059669", borderColor: "#059669" },
  chipText: { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  chipTextActive: { color: "#fff", fontWeight: "700" },
  noteBox: {
    backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a",
    borderRadius: 12, padding: 14, marginBottom: 20,
  },
  noteText: { fontSize: 13, color: "#92400e", lineHeight: 18 },
  createBtn: {
    backgroundColor: "#059669", borderRadius: 12,
    paddingVertical: 14, alignItems: "center",
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
