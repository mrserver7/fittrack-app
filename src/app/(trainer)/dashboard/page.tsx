import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatDate, getGreeting } from "@/lib/utils";
import Link from "next/link";
import { Users, Activity, CheckSquare, UserPlus, Bell, ChevronRight, TrendingUp, Calendar } from "lucide-react";
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
  const pendingClients = clients.filter((c) => c.status === "pending");

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

  const statusStyles: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
    skipped: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    in_progress: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
    pending: "bg-muted text-muted-foreground",
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            Good {getGreeting()}, {session?.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <Link href="/clients/new"
          className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" /> Add Client
        </Link>
      </div>

      {/* Pending clients banner */}
      {pendingClients.length > 0 && (
        <Link href="/clients" className="flex items-center gap-3 p-4 mb-6 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-500/15 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <UserPlus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">{pendingClients.length} pending client{pendingClients.length !== 1 ? "s" : ""} need approval</p>
            <p className="text-xs text-amber-700/70 dark:text-amber-400/70 mt-0.5">Review and approve to get started</p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { label: t.dashboard.activeClients, value: activeClients.length, icon: Users, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { label: t.dashboard.sessionsThisWeek, value: completedThisWeek, icon: Activity, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
          { label: "Pain Flags", value: recentPainFlags.length, icon: TrendingUp, color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
          { label: t.dashboard.unreadAlerts, value: notifications.length, icon: Bell, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="section-card p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 tabular-nums">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
        {/* Recent Activity */}
        <div className="section-card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">{t.dashboard.recentSessions}</h2>
            <Link href="/clients" className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors">
              {t.dashboard.viewAll}
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            {recentSessions.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">{t.dashboard.noSessionsYet}</p>
                <Link href="/clients/new" className="mt-3 inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  <UserPlus className="w-3.5 h-3.5" /> {t.dashboard.addFirstClient}
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {recentSessions.map((s) => (
                  <Link key={s.id} href={`/clients/${s.clientId}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs flex-shrink-0">
                      {s.client.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.client.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(s.updatedAt)}</p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${statusStyles[s.status] || "bg-muted text-muted-foreground"}`}>
                      {s.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alerts */}
        <div className="section-card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">{t.dashboard.attentionNeeded}</h2>
            <Link href="/tasks" className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors">
              {t.dashboard.taskList}
            </Link>
          </div>
          <div className="p-4 sm:p-5">
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

      {/* Notifications */}
      {enrichedNotifications.length > 0 && (
        <div id="notifications" className="mt-5 section-card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <h2 className="font-semibold text-foreground text-sm">Unread Notifications</h2>
              <span className="text-[10px] bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-bold tabular-nums">
                {enrichedNotifications.length}
              </span>
            </div>
            <MarkAllReadButton />
          </div>
          <div className="divide-y divide-border">
            {enrichedNotifications.map((n) => {
              const inner = (
                <div className="flex items-start gap-3 p-4 hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bell className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[11px] text-muted-foreground/60 mt-1">{formatDateTime(n.createdAt)}</p>
                  </div>
                  {n.href && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">View</span>
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
