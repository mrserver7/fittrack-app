import { auth } from "@/lib/auth";
import { getT } from "@/lib/i18n/server";
import SocialFeed from "@/components/social/social-feed";
import StreakBadge from "@/components/workout/streak-badge";
import { Heart } from "lucide-react";

export default async function CommunityPage() {
  const [session, t] = await Promise.all([auth(), getT()]);

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-pink-500/10 dark:bg-pink-500/15 flex items-center justify-center flex-shrink-0">
            <Heart className="w-5 h-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {t.nav.community}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              See what your training community is up to
            </p>
          </div>
        </div>
      </div>

      {/* Streak showcase */}
      <div className="section-card-padded mb-6">
        <StreakBadge size="lg" />
      </div>

      {/* Activity feed */}
      <div className="space-y-4">
        <SocialFeed />
      </div>
    </div>
  );
}
