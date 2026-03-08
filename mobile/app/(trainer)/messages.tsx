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
  Image,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/src/api/client";
import { Send, ChevronLeft, MessageSquare } from "lucide-react-native";

// --- Types ---

interface ClientSummary {
  id: string;
  name: string;
  photoUrl: string | null;
  lastMessage: {
    body: string;
    createdAt: string;
    senderRole: string;
    isRead: boolean;
  } | null;
  unreadCount: number;
}

interface TrainerMessagesResponse {
  clients: ClientSummary[];
}

interface Message {
  id: string;
  body: string;
  senderRole: string;
  createdAt: string;
  isRead: boolean;
}

interface MessagesResponse {
  messages: Message[];
}

// --- Helpers ---

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

function Initials({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: "#d1fae5",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: size * 0.38, fontWeight: "700", color: "#059669" }}>{initials}</Text>
    </View>
  );
}

// --- Client List ---

function ClientList({
  onSelect,
}: {
  onSelect: (client: ClientSummary) => void;
}) {
  const { data, isLoading, refetch, isRefetching } = useQuery<TrainerMessagesResponse>({
    queryKey: ["trainer-messages-hub"],
    queryFn: () => api.get<TrainerMessagesResponse>("/api/mobile/trainer-messages"),
    refetchInterval: 15000,
  });

  const clients = data?.clients ?? [];

  const renderItem = ({ item }: { item: ClientSummary }) => (
    <TouchableOpacity style={styles.clientRow} onPress={() => onSelect(item)} activeOpacity={0.7}>
      <View>
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
        ) : (
          <Initials name={item.name} />
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadDot}>
            <Text style={styles.unreadDotText}>
              {item.unreadCount > 9 ? "9+" : item.unreadCount}
            </Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View style={styles.clientRowTop}>
          <Text style={[styles.clientName, item.unreadCount > 0 && styles.clientNameBold]}>
            {item.name}
          </Text>
          {item.lastMessage && (
            <Text style={styles.clientTime}>
              {formatRelativeTime(item.lastMessage.createdAt)}
            </Text>
          )}
        </View>
        {item.lastMessage ? (
          <Text
            style={[styles.lastMsg, item.unreadCount > 0 && styles.lastMsgBold]}
            numberOfLines={1}
          >
            {item.lastMessage.senderRole === "trainer" ? "You: " : ""}
            {item.lastMessage.body}
          </Text>
        ) : (
          <Text style={styles.noMsg}>No messages yet</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      ) : clients.length === 0 ? (
        <View style={styles.emptyWrap}>
          <MessageSquare size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No clients yet</Text>
          <Text style={styles.emptySubText}>Your clients will appear here once approved.</Text>
        </View>
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#059669" />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

// --- Chat View ---

function ChatView({
  client,
  onBack,
}: {
  client: ClientSummary;
  onBack: () => void;
}) {
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MessagesResponse>({
    queryKey: ["messages", client.id],
    queryFn: () => api.get<MessagesResponse>(`/api/messages/${client.id}`),
    refetchInterval: 10000,
  });

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (body: string) =>
      api.post(`/api/messages/${client.id}`, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", client.id] });
      queryClient.invalidateQueries({ queryKey: ["trainer-messages-hub"] });
      setText("");
    },
  });

  const messages = data?.messages ?? [];

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  type ListItem =
    | { type: "date"; key: string; label: string }
    | { type: "msg"; key: string; msg: Message };

  const grouped: ListItem[] = [];
  let lastDate = "";
  messages.forEach((msg) => {
    const dateLabel = formatDate(msg.createdAt);
    if (dateLabel !== lastDate) {
      grouped.push({ type: "date", key: `date-${msg.createdAt}`, label: dateLabel });
      lastDate = dateLabel;
    }
    grouped.push({ type: "msg", key: msg.id, msg });
  });

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.type === "date") {
      return (
        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>{item.label}</Text>
        </View>
      );
    }
    const msg = item.msg;
    const isMe = msg.senderRole === "trainer";
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

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    sendMessage(trimmed);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Chat header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <ChevronLeft size={24} color="#059669" />
        </TouchableOpacity>
        <View style={styles.chatHeaderInfo}>
          {client.photoUrl ? (
            <Image source={{ uri: client.photoUrl }} style={styles.chatAvatar} />
          ) : (
            <Initials name={client.name} size={34} />
          )}
          <Text style={styles.chatHeaderName}>{client.name}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ flex: 1 } as never} />
      ) : messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No messages yet</Text>
          <Text style={styles.emptySubText}>Start the conversation below.</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={grouped}
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

// --- Main Screen ---

export default function TrainerMessages() {
  const [selectedClient, setSelectedClient] = useState<ClientSummary | null>(null);

  if (selectedClient) {
    return (
      <ChatView
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
      />
    );
  }

  return <ClientList onSelect={setSelectedClient} />;
}

// --- Styles ---

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  // Client list
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#059669",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: "#fff",
  },
  unreadDotText: { fontSize: 10, color: "#fff", fontWeight: "700" },
  clientRowTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  clientName: { fontSize: 15, color: "#111827", fontWeight: "500" },
  clientNameBold: { fontWeight: "700" },
  clientTime: { fontSize: 12, color: "#9ca3af" },
  lastMsg: { fontSize: 13, color: "#6b7280" },
  lastMsgBold: { color: "#111827", fontWeight: "500" },
  noMsg: { fontSize: 13, color: "#d1d5db", fontStyle: "italic" },
  separator: { height: 1, backgroundColor: "#f3f4f6", marginLeft: 68 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 16, marginBottom: 6 },
  emptySubText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
  // Chat header
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
    gap: 8,
  },
  backBtn: { padding: 4 },
  chatHeaderInfo: { flexDirection: "row", alignItems: "center", gap: 10 },
  chatAvatar: { width: 34, height: 34, borderRadius: 17 },
  chatHeaderName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  // Chat bubbles
  list: { padding: 16, paddingBottom: 8 },
  dateSeparator: { alignItems: "center", marginVertical: 12 },
  dateSeparatorText: {
    fontSize: 12,
    color: "#9ca3af",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
  },
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
  // Input
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
