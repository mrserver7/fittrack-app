import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, MessageCircle, Share2, Flame, Trophy, Target } from "lucide-react-native";
import { api } from "@/src/api/client";

type SocialPost = {
  id: string;
  postType: string;
  caption: string | null;
  createdAt: string;
  client: { id: string; name: string; photoUrl: string | null };
  reactions: { id: string; emoji: string; clientId: string }[];
};

export default function CommunityScreen() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await api.get<{ posts: SocialPost[] }>("/api/social/feed?page=1&limit=20");
      setPosts(data.posts || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleReact = async (postId: string) => {
    try {
      await api.post("/api/social/react", { postId, emoji: "\ud83d\udcaa" });
      fetchPosts();
    } catch {}
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "pr": return <Trophy color="#d97706" size={14} />;
      case "streak": return <Flame color="#ea580c" size={14} />;
      default: return <Flame color="#059669" size={14} />;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <View style={{ width: 40, height: 40, backgroundColor: "#fce7f3", borderRadius: 12, justifyContent: "center", alignItems: "center" }}>
            <Heart color="#db2777" size={20} />
          </View>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#111827" }}>Community</Text>
            <Text style={{ fontSize: 13, color: "#6b7280" }}>Your training community feed</Text>
          </View>
        </View>

        {posts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, backgroundColor: "#fff", borderRadius: 16, borderWidth: 2, borderColor: "#e5e7eb", borderStyle: "dashed" }}>
            <Heart color="#d1d5db" size={28} />
            <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>No activity yet</Text>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Complete a workout and share it!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 12, overflow: "hidden" }}>
              {/* Header */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14 }}>
                <View style={{ width: 36, height: 36, backgroundColor: "#d1fae5", borderRadius: 18, justifyContent: "center", alignItems: "center" }}>
                  {post.client.photoUrl ? (
                    <Image source={{ uri: post.client.photoUrl }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#047857" }}>{post.client.name.charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>{post.client.name}</Text>
                  <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                    {new Date(post.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: post.postType === "pr" ? "#fef3c7" : "#d1fae5", justifyContent: "center", alignItems: "center" }}>
                  {getIcon(post.postType)}
                </View>
              </View>

              {/* Caption */}
              {post.caption && (
                <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                  <Text style={{ fontSize: 14, color: "#374151" }}>{post.caption}</Text>
                </View>
              )}

              {/* Type badge */}
              <View style={{ paddingHorizontal: 14, paddingBottom: 10 }}>
                <View style={{
                  alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4,
                  paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
                  backgroundColor: post.postType === "pr" ? "#fef3c7" : post.postType === "streak" ? "#ffedd5" : "#d1fae5",
                }}>
                  {getIcon(post.postType)}
                  <Text style={{ fontSize: 12, fontWeight: "500", color: post.postType === "pr" ? "#92400e" : post.postType === "streak" ? "#9a3412" : "#047857" }}>
                    {post.postType === "pr" ? "Personal Record" : post.postType === "streak" ? "Streak" : "Workout Completed"}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f3f4f6" }}>
                <TouchableOpacity onPress={() => handleReact(post.id)} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontSize: 16 }}>{post.reactions.length > 0 ? "\ud83d\udcaa" : "\u2764\ufe0f"}</Text>
                  {post.reactions.length > 0 && <Text style={{ fontSize: 13, color: "#6b7280" }}>{post.reactions.length}</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <MessageCircle color="#6b7280" size={16} />
                </TouchableOpacity>
                <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                  <Share2 color="#6b7280" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
