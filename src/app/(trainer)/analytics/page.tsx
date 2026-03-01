import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BarChart3, Users, Activity, TrendingUp, Award } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function AnalyticsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const trainerId = session!.user!.id!;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [totalClients, activeClients, sessionsThisWeek, sessionsThisMonth, recentPRs, topExercises] =
    await Promise.all([
      prisma.client.count({ where: { trainerId, deletedAt: null } }),
      prisma.client.count({ where: { trainerId, deletedAt: null, status: "active" } }),
      prisma.sessionLog.count({ where: { client: { trainerId }, status: "completed", completedAt: { gte: sevenDaysAgo } } }),
      prisma.sessionLog.count({ where: { client: { trainerId }, status: "completed", completedAt: { gte: thirtyDaysAgo } } }),
      prisma.personalRecord.findMany({
        where: { client: { trainerId } },
        include: { client: { select: { name: true } }, exercise: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.setLog.groupBy({
        by: ["exerciseId"],
        where: { sessionLog: { client: { trainerId } } },
        _count: { exerciseId: true },
        orderBy: { _count: { exerciseId: "desc" } },
        take: 8,
      }),
    ]);

  const exerciseIds = topExercises.map((e) => e.exerciseId);
  const exerciseNames = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, name: true },
  });
  const nameMap = Object.fromEntries(exerciseNames.map((e) => [e.id, e.name]));

  const stats = [
    { label: t.analytics.totalClients, value: totalClients, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30" },
    { label: t.analytics.activeClients, value: activeClients, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30" },
    { label: t.analytics.sessionsThisWeek, value: sessionsThisWeek, icon: Activity, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/30" },
    { label: t.analytics.sessionsThisMonth, value: sessionsThisMonth, icon: BarChart3, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/30" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.analytics.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.analytics.subtitle}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{s.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${s.bg}`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Exercises */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-4">{t.analytics.topExercises}</h2>
          <div className="space-y-3">
            {topExercises.map((ex) => {
              const maxCount = topExercises[0]._count.exerciseId;
              const pct = Math.round((ex._count.exerciseId / maxCount) * 100);
              return (
                <div key={ex.exerciseId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{nameMap[ex.exerciseId] || "Unknown"}</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 ml-2">{ex._count.exerciseId} {t.analytics.sets}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {topExercises.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t.analytics.noSessionData}</p>
            )}
          </div>
        </div>

        {/* Recent PRs */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
            {t.analytics.recentPRs} <Award className="w-4 h-4 text-amber-500" />
          </h2>
          <div className="space-y-3">
            {recentPRs.map((pr) => (
              <div key={pr.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-700 font-bold text-xs flex-shrink-0">
                  🏆
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{pr.client.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{pr.exercise.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-600">{pr.valueKg}kg</p>
                  {pr.previousPrKg && (
                    <p className="text-xs text-emerald-600">↑ {(pr.valueKg - pr.previousPrKg).toFixed(1)}kg</p>
                  )}
                </div>
              </div>
            ))}
            {recentPRs.length === 0 && (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t.analytics.noPRs}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
