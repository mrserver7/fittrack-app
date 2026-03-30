import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, Dumbbell, Activity, Clock, Shield } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function AdminOverviewPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const adminName = session?.user?.name?.split(" ")[0];

  const [trainerCount, totalSubscribers, activeSubscribers, pendingSubscribers, sessionsToday, totalSessions] =
    await Promise.all([
      prisma.trainer.count({ where: { deletedAt: null, isAdmin: false } }),
      prisma.client.count({ where: { deletedAt: null } }),
      prisma.client.count({ where: { deletedAt: null, status: "active" } }),
      prisma.client.count({ where: { deletedAt: null, status: "pending" } }),
      prisma.sessionLog.count({
        where: { status: "completed", completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      prisma.sessionLog.count({ where: { status: "completed" } }),
    ]);

  const stats = [
    { label: t.admin.trainers, value: trainerCount, icon: Shield, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10", href: "/admin/trainers" },
    { label: t.admin.totalSubscribers, value: totalSubscribers, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10", href: "/admin/subscribers" },
    { label: t.admin.activeSubscribers, value: activeSubscribers, icon: Dumbbell, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10", href: "/admin/subscribers?status=active" },
    { label: t.admin.pendingApproval, value: pendingSubscribers, icon: Clock, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10", href: "/admin/subscribers?status=pending" },
    { label: t.admin.sessionsToday, value: sessionsToday, icon: Activity, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10", href: "/analytics" },
    { label: t.admin.totalSessions, value: totalSessions, icon: Activity, color: "text-muted-foreground", bg: "bg-muted", href: "/analytics" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{t.admin.adminPanel}</h1>
        </div>
        <p className="text-muted-foreground text-sm">Welcome, {adminName}. {t.admin.welcomeAdmin}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}
              className="section-card p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground mt-1 tabular-nums">{s.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/trainers"
          className="section-card p-5 sm:p-6 hover:shadow-md hover:border-purple-200 dark:hover:border-purple-700 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-50 dark:bg-purple-500/10 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-purple-700 dark:group-hover:text-purple-400">{t.admin.manageTrainers}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t.admin.manageTrainersSub}</p>
        </Link>

        <Link href="/admin/subscribers"
          className="section-card p-5 sm:p-6 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all group">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{t.admin.manageSubscribers}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.admin.manageSubscribersSub}
            {pendingSubscribers > 0 && (
              <span className="ml-2 inline-flex items-center bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingSubscribers} {t.admin.pending}
              </span>
            )}
          </p>
        </Link>
      </div>
    </div>
  );
}
