import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import SocialFeed from "@/components/social/social-feed";
import StreakBadge from "@/components/workout/streak-badge";
import { Heart } from "lucide-react";

export default async function CommunityPage() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.nav.community}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">See what your training community is up to</p>
          </div>
        </div>
      </div>

      {/* Streak showcase */}
      <div className="mb-6">
        <StreakBadge size="lg" />
      </div>

      {/* Feed */}
      <SocialFeed />
    </div>
  );
}
