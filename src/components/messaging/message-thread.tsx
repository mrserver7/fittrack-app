"use client";
import { useState, useRef, useEffect } from "react";
import { formatDateTime } from "@/lib/utils";
import { Send } from "lucide-react";

type Message = {
  id: string;
  body: string;
  senderRole: string;
  senderId: string;
  createdAt: string | Date;
  isRead: boolean;
};

export default function MessageThread({
  initialMessages,
  clientId,
  senderRole,
  currentUserId,
}: {
  initialMessages: Message[];
  clientId: string;
  senderRole: "trainer" | "client";
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/messages/${clientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await res.json();
    setSending(false);
    if (res.ok) {
      setMessages((prev) => [...prev, data.message]);
      setBody("");
    }
  };

  const isMe = (msg: Message) => msg.senderRole === senderRole;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${isMe(msg) ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
              isMe(msg) ? "bg-emerald-600 text-white rounded-br-sm" : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
            }`}>
              <p className="text-sm leading-relaxed">{msg.body}</p>
              <p className={`text-xs mt-1 ${isMe(msg) ? "text-emerald-200" : "text-gray-400"}`}>
                {formatDateTime(msg.createdAt)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex gap-3 p-4 border-t border-gray-200 bg-white">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(e as unknown as React.FormEvent);
            }
          }}
        />
        <button type="submit" disabled={sending || !body.trim()}
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors disabled:opacity-50">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
