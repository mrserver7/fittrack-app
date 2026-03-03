import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDate, getGreeting } from "@/lib/utils";
import Link from "next/link";
import { Users, Activity, CheckSquare, UserPlus, Bell } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import DashboardAlerts from "@/components/dashboard/dashboard-alerts";
import MarkAllReadButton from "@/components/dashboard/mark-all-read-button";

export default async function DashboardPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const trainerId = session!.user!.id!;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [clients, recentSessions, notifications, staleClients, recentPainFlags, completedThisWeek] =
    await Promise.all([
      prisma.client.findMany({ where: { trainerId, deletedAt: null } }),
      prisma.sessionLog.findMany({
        where: { client: { trainerId } },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { updatedAt: "desc" },
        take: 8,
      }),
      prisma.notification.findMany({
        where: { recipientId: trainerId, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.client.findMany({
        where: {
          trainerId, status: "active", deletedAt: null,
          createdAt: { lt: sevenDaysAgo },
          sessionLogs: { none: { status: "completed", completedAt: { gte: sevenDaysAgo } } },
        },
        take: 5,
      }),
      prisma.painFlag.findMany({
        where: { client: { trainerId }, severity: { gte: 3 }, flaggedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        include: { client: { select: { id: true, name: true } } },
        orderBy: { flaggedAt: "desc" },
        take: 5,
      }),
      prisma.sessionLog.count({
        where: { client: { trainerId }, status: "completed", completedAt: { gte: sevenDaysAgo } },
      }),
    ]);

  const activeClients = clients.filter((c) => c.status === "active");

  // Enrich notifications with navigation links
  const checkInIds = notifications.filter((n) => n.type === "check_in_submitted" && n.referenceId).map((n) => n.referenceId!);
  const overrideIds = notifications.filter((n) => n.type === "workout_rescheduled" && n.referenceId).map((n) => n.referenceId!);
  const [notifCheckIns, notifOverrides] = await Promise.all([
    checkInIds.length ? prisma.checkIn.findMany({ where: { id: { in: checkInIds } }, select: { id: true, clientId: true } }) : [],
    overrideIds.length ? prisma.workoutScheduleOverride.findMany({ where: { id: { in: overrideIds } }, select: { id: true, clientId: true } }) : [],
  ]);
  const ciMap = Object.fromEntries(notifCheckIns.map((ci) => [ci.id, ci.clientId]));
  const ovMap = Object.fromEntries(notifOverrides.map((ov) => [ov.id, ov.clientId]));

  const enrichedNotifications = notifications.map((n) => {
    let href: string | null = null;
    if (n.type === "check_in_submitted" && n.referenceId && ciMap[n.referenceId]) {
      href = `/clients/${ciMap[n.referenceId]}/checkins/${n.referenceId}`;
    } else if (n.type === "workout_rescheduled" && n.referenceId && ovMap[n.referenceId]) {
      href = `/clients/${ovMap[n.referenceId]}`;
    }
    return { ...n, href };
  });

  const stats = [
    { label: t.dashboard.activeClients, value: activeClients.length, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/30", border: "border-emerald-100 dark:border-emerald-800" },
    { label: t.dashboard.sessionsThisWeek, value: completedThisWeek, icon: Activity, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30", border: "border-blue-100 dark:border-blue-800" },
  ];

  const statusStyles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    skipped: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    pending: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          Good {getGreeting()}, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`bg-white dark:bg-gray-900 rounded-2xl border ${s.border} p-5 shadow-sm`}>
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
        {/* Unread Alerts — separate so we can add mark-all button */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-orange-100 dark:border-orange-800 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t.dashboard.unreadAlerts}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-gray-50 mt-1">{notifications.length}</p>
              {notifications.length > 0 && <MarkAllReadButton />}
            </div>
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/30">
              <CheckSquare className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-50">{t.dashboard.recentSessions}</h2>
            <Link href="/clients" className="text-sm text-emerald-600 hover:underline">{t.dashboard.viewAll}</Link>
          </div>
          <div className="p-5">
            {recentSessions.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-gray-500 text-sm">{t.dashboard.noSessionsYet}</p>
                <Link href="/clients/new" className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline">
                  <UserPlus className="w-3.5 h-3.5" /> {t.dashboard.addFirstClient}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <Link key={s.id} href={`/clients/${s.clientId}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs flex-shrink-0">
                      {s.client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-50 truncate">{s.client.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(s.updatedAt)}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${statusStyles[s.status] || "bg-gray-100 text-gray-500"}`}>
                      {s.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-gray-50">{t.dashboard.attentionNeeded}</h2>
            <Link href="/tasks" className="text-sm text-emerald-600 hover:underline">{t.dashboard.taskList}</Link>
          </div>
          <div className="p-5">
            <DashboardAlerts
              staleClients={staleClients.map((c) => ({ id: c.id, name: c.name }))}
              recentPainFlags={recentPainFlags.map((pf) => ({ id: pf.id, clientId: pf.clientId, bodyRegion: pf.bodyRegion, severity: pf.severity, client: pf.client }))}
              allClearLabel={t.dashboard.allClear}
              allClearSub={t.dashboard.allClearSub}
              noSessions7DaysLabel={t.dashboard.noSessions7Days}
              painFlagLabel={t.dashboard.painFlag}
              severityLabel={t.dashboard.severity}
            />
          </div>
        </div>
      </div>

      {/* Notifications list */}
      {enrichedNotifications.length > 0 && (
        <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">Unread Notifications</h2>
              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                {enrichedNotifications.length}
              </span>
            </div>
            <MarkAllReadButton />
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {enrichedNotifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{n.title}</p>
                    {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
                    <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {n.href && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">View →</span>
                  )}
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href}>{inner}</Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
