import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState } from "react";
import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, Clock } from "lucide-react-native";
import { useCheckIns, useSubmitCheckIn } from "@/src/api/queries";

interface Question { label: string; type?: string }

function CheckInCard({ checkIn }: {
  checkIn: {
    id: string;
    status: string;
    periodStart: string | null;
    periodEnd: string | null;
    submittedAt: string | null;
    trainerComment: string | null;
    createdAt: string;
    checkInForm: { id: string; title: string; questions: string };
  };
}) {
  const [expanded, setExpanded] = useState(checkIn.status === "pending");
  const [responses, setResponses] = useState<Record<string, string>>({});
  const submitCheckIn = useSubmitCheckIn();

  let questions: Question[] = [];
  try {
    const parsed = JSON.parse(checkIn.checkInForm.questions);
    questions = Array.isArray(parsed) ? parsed : [];
  } catch {
    questions = [];
  }

  const handleSubmit = () => {
    const unanswered = questions.filter((q) => !responses[q.label]?.trim());
    if (unanswered.length > 0) {
      Alert.alert("Incomplete", "Please answer all questions before submitting.");
      return;
    }
    submitCheckIn.mutate(
      { checkInId: checkIn.id, responses },
      {
        onSuccess: () => {
          Alert.alert("Submitted!", "Your trainer has been notified.");
          setExpanded(false);
        },
        onError: () => Alert.alert("Error", "Failed to submit check-in."),
      }
    );
  };

  return (
    <View style={s.card}>
      <TouchableOpacity
        style={s.cardHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text style={s.formTitle}>{checkIn.checkInForm.title}</Text>
          {checkIn.periodStart && (
            <Text style={s.period}>
              {new Date(checkIn.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {checkIn.periodEnd
                ? ` – ${new Date(checkIn.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                : ""}
            </Text>
          )}
        </View>
        <View style={[s.statusBadge, checkIn.status === "completed" ? s.badgeDone : s.badgePending]}>
          {checkIn.status === "completed"
            ? <CheckCircle size={12} color="#065f46" />
            : <Clock size={12} color="#92400e" />}
          <Text style={[s.statusText, checkIn.status === "completed" ? s.statusTextDone : s.statusTextPending]}>
            {checkIn.status === "completed" ? "Done" : "Pending"}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={s.cardBody}>
          {checkIn.status === "completed" ? (
            <>
              {checkIn.trainerComment && (
                <View style={s.commentBox}>
                  <Text style={s.commentLabel}>Trainer's comment:</Text>
                  <Text style={s.commentText}>{checkIn.trainerComment}</Text>
                </View>
              )}
              <Text style={s.submittedAt}>
                Submitted {checkIn.submittedAt
                  ? new Date(checkIn.submittedAt).toLocaleDateString("en-US", { month: "long", day: "numeric" })
                  : ""}
              </Text>
            </>
          ) : (
            <>
              {questions.map((q) => (
                <View key={q.label} style={s.questionBlock}>
                  <Text style={s.questionLabel}>{q.label}</Text>
                  <TextInput
                    style={s.questionInput}
                    value={responses[q.label] ?? ""}
                    onChangeText={(v) => setResponses((prev) => ({ ...prev, [q.label]: v }))}
                    placeholder="Your answer…"
                    placeholderTextColor="#9ca3af"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              ))}
              <TouchableOpacity
                style={[s.submitBtn, submitCheckIn.isPending && s.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitCheckIn.isPending}
              >
                {submitCheckIn.isPending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.submitBtnText}>Submit Check-in</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

export default function CheckInsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useCheckIns();

  const checkIns = data?.checkIns ?? [];
  const pending = checkIns.filter((c) => c.status === "pending");
  const completed = checkIns.filter((c) => c.status === "completed");

  return (
    <SafeAreaView style={s.container}>
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Check-ins</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={s.centered}><ActivityIndicator size="large" color="#059669" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={s.content}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />}
        >
          {checkIns.length === 0 ? (
            <View style={s.emptyBox}>
              <CheckCircle size={48} color="#d1d5db" />
              <Text style={s.emptyTitle}>All caught up!</Text>
              <Text style={s.emptySub}>No check-ins assigned yet.</Text>
            </View>
          ) : (
            <>
              {pending.length > 0 && (
                <>
                  <Text style={s.groupLabel}>Pending ({pending.length})</Text>
                  {pending.map((c) => <CheckInCard key={c.id} checkIn={c} />)}
                </>
              )}
              {completed.length > 0 && (
                <>
                  <Text style={s.groupLabel}>Completed</Text>
                  {completed.map((c) => <CheckInCard key={c.id} checkIn={c} />)}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "#f3f4f6", backgroundColor: "#fff",
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  topBarTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { padding: 16, paddingBottom: 40 },
  emptyBox: { alignItems: "center", paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 8 },
  emptySub: { fontSize: 14, color: "#9ca3af" },
  groupLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },

  card: {
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12, overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  formTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  period: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  statusBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeDone: { backgroundColor: "#d1fae5" },
  badgePending: { backgroundColor: "#fef9c3" },
  statusText: { fontSize: 12, fontWeight: "600" },
  statusTextDone: { color: "#065f46" },
  statusTextPending: { color: "#92400e" },

  cardBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  questionBlock: { marginTop: 12 },
  questionLabel: { fontSize: 13, fontWeight: "500", color: "#374151", marginBottom: 6 },
  questionInput: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827",
    backgroundColor: "#f9fafb", minHeight: 80,
  },
  submitBtn: { backgroundColor: "#059669", borderRadius: 12, padding: 13, alignItems: "center", marginTop: 16 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  commentBox: {
    backgroundColor: "#eff6ff", borderRadius: 10, padding: 12,
    marginTop: 12, borderWidth: 1, borderColor: "#bfdbfe",
  },
  commentLabel: { fontSize: 12, fontWeight: "600", color: "#1e40af", marginBottom: 4 },
  commentText: { fontSize: 13, color: "#1d4ed8" },
  submittedAt: { fontSize: 12, color: "#9ca3af", marginTop: 10 },
});
