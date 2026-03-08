import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/src/store/auth-store";
import { api } from "@/src/api/client";
import { Send } from "lucide-react-native";

interface Message {
  id: string;
  body: string;
  senderRole: string;
  senderId: string;
  createdAt: string;
  isRead: boolean;
}

interface MessagesResponse {
  messages: Message[];
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ClientMessages() {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();
  const clientId = user?.id ?? "";

  const { data, isLoading } = useQuery<MessagesResponse>({
    queryKey: ["messages", clientId],
    queryFn: () => api.get<MessagesResponse>(`/api/messages/${clientId}`),
    refetchInterval: 10000,
    enabled: !!clientId,
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (body: string) =>
      api.post(`/api/messages/${clientId}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", clientId] });
      setText("");
    },
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    sendMessage(trimmed);
  };

  // Group messages by date
  const grouped: { type: "date"; key: string; label: string } | { type: "msg"; key: string; msg: Message }[] = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.createdAt);
    if (dateLabel !== lastDate) {
      (grouped as unknown[]).push({ type: "date", key: `date-${msg.createdAt}`, label: dateLabel });
      lastDate = dateLabel;
    }
    (grouped as unknown[]).push({ type: "msg", key: msg.id, msg });
  });

  type ListItem =
    | { type: "date"; key: string; label: string }
    | { type: "msg"; key: string; msg: Message };

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{item.label}</Text>
        </View>
      );
    }
    const msg = item.msg;
    const isMe = msg.senderRole === "client";
    return (
      <View style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMine : styles.bubbleTheirs]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {msg.body}
          </Text>
        </View>
        <Text style={[styles.timestamp, isMe ? { textAlign: "right" } : {}]}>
          {formatTime(msg.createdAt)}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ flex: 1, justifyContent: "center" } as never} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No messages yet.</Text>
          <Text style={styles.emptySubText}>Send a message to your trainer below.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={grouped as ListItem[]}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || isSending}
          >
            <Send size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#e5e7eb", backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  list: { padding: 16, paddingBottom: 8 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 6 },
  emptySubText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
  dateSeparator: { alignItems: "center", marginVertical: 12 },
  dateSeparatorText: { fontSize: 12, color: "#9ca3af", backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10 },
  bubbleWrap: { marginBottom: 10, maxWidth: "80%" },
  bubbleLeft: { alignSelf: "flex-start" },
  bubbleRight: { alignSelf: "flex-end" },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: "#059669", borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: "#e5e7eb", borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMine: { color: "#fff" },
  bubbleTextTheirs: { color: "#111827" },
  timestamp: { fontSize: 11, color: "#9ca3af", marginTop: 3, paddingHorizontal: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 12,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#111827",
    maxHeight: 100,
  },
  sendBtn: {
    backgroundColor: "#059669",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#a7f3d0" },
});
