"use client";
import { useState, useEffect } from "react";
import { Heart, MessageCircle, Share2, Flame, Trophy, Target } from "lucide-react";

interface SocialPost {
  id: string;
  postType: string;
  caption: string | null;
  createdAt: string;
  client: { id: string; name: string; photoUrl: string | null };
  reactions: { id: string; emoji: string; clientId: string }[];
}

const POST_ICONS: Record<string, React.ElementType> = {
  workout: Flame,
  pr: Trophy,
  milestone: Target,
  streak: Flame,
};

export default function SocialFeed() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [page, setPage] = useState(1);

  const fetchPosts = (p: number) => {
    fetch(`/api/social/feed?page=${p}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        if (p === 1) setPosts(d.posts || []);
        else setPosts((prev) => [...prev, ...(d.posts || [])]);
      })
      .catch(() => {});
  };

  useEffect(() => { fetchPosts(1); }, []);

  const handleReact = async (postId: string) => {
    await fetch("/api/social/react", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, emoji: "\ud83d\udcaa" }),
    });
    fetchPosts(page);
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
        <Heart className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No activity yet</p>
        <p className="text-xs text-gray-400">Complete a workout and share it with your community!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const Icon = POST_ICONS[post.postType] || Flame;
        return (
          <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-400">
                {post.client.photoUrl ? (
                  <img src={post.client.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  post.client.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{post.client.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                post.postType === "pr" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"
              }`}>
                <Icon className={`w-4 h-4 ${post.postType === "pr" ? "text-amber-600" : "text-emerald-600"}`} />
              </div>
            </div>

            {/* Content */}
            {post.caption && (
              <div className="px-4 pb-3">
                <p className="text-sm text-gray-700 dark:text-gray-300">{post.caption}</p>
              </div>
            )}

            {/* Type badge */}
            <div className="px-4 pb-3">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                post.postType === "pr"
                  ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                  : post.postType === "streak"
                    ? "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                    : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              }`}>
                <Icon className="w-3 h-3" />
                {post.postType === "pr" ? "Personal Record" : post.postType === "streak" ? "Streak" : "Workout Completed"}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => handleReact(post.id)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors">
                <span className="text-base">{post.reactions.length > 0 ? "\ud83d\udcaa" : "\u2764\ufe0f"}</span>
                {post.reactions.length > 0 && <span>{post.reactions.length}</span>}
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-600 transition-colors ml-auto">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}

      <button onClick={() => { setPage(page + 1); fetchPosts(page + 1); }}
        className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 text-center">
        Load more
      </button>
    </div>
  );
}
