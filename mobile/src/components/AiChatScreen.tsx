import { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Send, Sparkles, Bot } from "lucide-react-native";
import { api } from "@/src/api/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "What's a good warm-up?",
  "How to improve squat form?",
  "How many rest days per week?",
  "Best foods before workout?",
];

export default function AiChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your AI fitness coach. Ask me anything about training, nutrition, recovery, or program design! 💪",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;
    setInput("");

    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const data = await api.post<{ reply: string }>("/api/ai/coach-chat", { message });
      const aiMsg: Message = { id: `a-${Date.now()}`, role: "assistant", content: data.reply };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", content: "Sorry, I couldn't connect. Please try again." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerIcon}>
          <Sparkles size={18} color="#059669" />
        </View>
        <View>
          <Text style={s.headerTitle}>AI Coach</Text>
          <Text style={s.headerSub}>Powered by Gemini</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={s.messages}
          contentContainerStyle={s.messagesContent}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[s.bubble, msg.role === "user" ? s.bubbleUser : s.bubbleAI]}
            >
              {msg.role === "assistant" && (
                <View style={s.botIcon}>
                  <Bot size={11} color="#059669" />
                </View>
              )}
              <View style={[s.bubbleInner, msg.role === "user" ? s.bubbleUserInner : s.bubbleAIInner]}>
                <Text style={[s.bubbleText, msg.role === "user" ? s.bubbleUserText : s.bubbleAIText]}>
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {loading && (
            <View style={[s.bubble, s.bubbleAI]}>
              <View style={s.botIcon}>
                <Bot size={11} color="#059669" />
              </View>
              <View style={[s.bubbleInner, s.bubbleAIInner, { paddingVertical: 14 }]}>
                <ActivityIndicator size="small" color="#059669" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick questions shown only initially */}
        {messages.length === 1 && (
          <View style={s.quickWrap}>
            <Text style={s.quickLabel}>Quick questions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}>
                {QUICK_QUESTIONS.map((q) => (
                  <TouchableOpacity key={q} style={s.quickChip} onPress={() => sendMessage(q)}>
                    <Text style={s.quickChipText}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input bar */}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your AI coach..."
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnOff]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Send size={17} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 12, color: "#6b7280" },
  messages: { flex: 1 },
  messagesContent: { padding: 16, gap: 10, paddingBottom: 8 },
  bubble: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  bubbleAI: { justifyContent: "flex-start" },
  bubbleUser: { justifyContent: "flex-end" },
  botIcon: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "#d1fae5", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  bubbleInner: { maxWidth: "78%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAIInner: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderBottomLeftRadius: 4,
  },
  bubbleUserInner: { backgroundColor: "#059669", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleAIText: { color: "#111827" },
  bubbleUserText: { color: "#fff" },
  quickWrap: { paddingTop: 10, paddingBottom: 6, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  quickLabel: {
    fontSize: 10, fontWeight: "700", color: "#9ca3af",
    paddingHorizontal: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6,
  },
  quickChip: {
    backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb",
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  quickChipText: { fontSize: 13, color: "#374151" },
  inputRow: {
    flexDirection: "row", alignItems: "flex-end", gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e7eb",
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 14,
    color: "#111827", backgroundColor: "#f9fafb", maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#059669", alignItems: "center", justifyContent: "center",
  },
  sendBtnOff: { backgroundColor: "#d1d5db" },
});
