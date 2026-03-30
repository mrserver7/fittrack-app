import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  Dumbbell, TrendingUp, CheckSquare, Award, Flame, CheckCircle,
  Apple, Target, Heart, ChevronRight, Calendar, Zap,
} from "lucide-react";
import { getT } from "@/lib/i18n/server";
import ClientNotifications from "@/components/client/client-notifications";
import AiCoachChat from "@/components/workout/ai-coach-chat";
import HabitTracker from "@/components/habits/habit-tracker";

export default async function ClientHomePage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const clientId = session!.user!.id!;

  const todayStr = new Date().toISOString().split("T")[0];
  const [client, recentSessions, upcomingCheckins, recentPRs, notifications, todayDone] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        clientPrograms: {
          where: { status: "active", program: { deletedAt: null } },
          include: {
            program: {
              include: {
                weeks: {
                  orderBy: { weekNumber: "asc" },
                  include: { days: { orderBy: { dayOrder: "asc" }, include: { exercises: { include: { exercise: true } } } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.sessionLog.findMany({
      where: { clientId, status: { in: ["completed", "skipped"] } },
      orderBy: { scheduledDate: "desc" },
      take: 10,
    }),
    prisma.checkIn.findMany({
      where: { clientId, status: "pending" },
      include: { checkInForm: { select: { name: true } } },
      take: 3,
    }),
    prisma.personalRecord.findMany({
      where: { clientId },
      include: { exercise: true },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.notification.findMany({ where: { recipientId: clientId, recipientRole: "client", isRead: false }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.sessionLog.findFirst({ where: { clientId, status: "completed", scheduledDate: todayStr } }),
  ]);

  let streak = 0;
  const sortedDates = recentSessions.filter((s) => s.status === "completed").map((s) => s.scheduledDate);
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { streak++; continue; }
    const diff = (new Date(sortedDates[i - 1]).getTime() - new Date(sortedDates[i]).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) streak++; else break;
  }

  const activeProgram = client?.clientPrograms[0];
  const hasActiveProgram = !!activeProgram;
  const completedCount = recentSessions.filter((s) => s.status === "completed").length;
  const adherence = recentSessions.length > 0 ? Math.round((completedCount / recentSessions.length) * 100) : 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {t.home.greeting}, {session?.user?.name?.split(" ")[0]}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-full">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak}</span>
            </div>
          )}
        </div>
      </div>

      <ClientNotifications initialNotifications={notifications} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="section-card p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{completedCount}</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">{t.home.sessionsDone}</div>
        </div>
        <div className="section-card p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 tabular-nums">
            <Flame className="w-5 h-5" /> {streak}
          </div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">{t.home.streak}</div>
        </div>
        <div className="section-card p-4 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">{adherence}%</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1 font-medium">{t.home.adherence}</div>
        </div>
      </div>

      {/* Main CTA: Today's Workout */}
      <Link href="/workout/today"
        className={`block rounded-2xl p-5 sm:p-6 text-white mb-6 group transition-all hover:shadow-xl ${
          todayDone
            ? "bg-gradient-to-br from-gray-600 to-gray-800"
            : "bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700"
        }`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
            {todayDone ? <CheckCircle className="w-6 h-6" /> : <Dumbbell className="w-6 h-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/60 font-medium uppercase tracking-wide">{t.workout.today}</p>
            <p className="font-bold text-lg sm:text-xl leading-tight mt-0.5">
              {todayDone ? t.home.workoutDoneToday : t.workout.startWorkout}
            </p>
            {hasActiveProgram && (
              <p className="text-white/60 text-sm mt-1 truncate">{activeProgram.program.name}</p>
            )}
          </div>
          <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      </Link>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Check-ins */}
        <div className="section-card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <CheckSquare className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="font-semibold text-foreground text-sm">{t.checkins.title}</h2>
            </div>
            <Link href="/checkins" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            {upcomingCheckins.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t.checkins.noCheckInsYet}</p>
            ) : (
              <div className="space-y-2">
                {upcomingCheckins.map((ci) => (
                  <Link key={ci.id} href={`/checkins/${ci.id}`}
                    className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-500/15 transition-colors group">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-300 truncate">{ci.checkInForm.name}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70">{t.checkins.complete}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PRs */}
        {recentPRs.length > 0 && (
          <div className="section-card">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <h2 className="font-semibold text-foreground text-sm">{t.home.yourPRs}</h2>
              </div>
              <Link href="/progress" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-2 gap-2.5">
                {recentPRs.map((pr) => (
                  <div key={pr.id} className="p-3 bg-amber-50 dark:bg-amber-500/10 rounded-xl">
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium truncate">{pr.exercise.name}</p>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-300 mt-0.5 tabular-nums">{pr.valueKg}kg</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent sessions */}
        <div className="section-card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="font-semibold text-foreground text-sm">{t.home.recentSessions}</h2>
            </div>
            <Link href="/workouts" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t.home.noSessionsYet}</p>
            ) : (
              <div className="space-y-1.5">
                {recentSessions.slice(0, 5).map((s) => (
                  <Link key={s.id} href={`/workouts/${s.id}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/60 transition-colors group">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "completed" ? "bg-emerald-500" : "bg-red-400"}`} />
                    <p className="text-sm text-foreground flex-1 truncate">{formatDate(s.scheduledDate)}</p>
                    <span className="text-base flex-shrink-0">{s.overallFeedbackEmoji || ""}</span>
                    {s.totalVolumeKg && (
                      <p className="text-xs text-muted-foreground tabular-nums flex-shrink-0">{s.totalVolumeKg}kg</p>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Habits */}
        <div className="section-card">
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              <h2 className="font-semibold text-foreground text-sm">Daily Habits</h2>
            </div>
            <Link href="/habits" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              View all
            </Link>
          </div>
          <div className="p-4 sm:p-5">
            <HabitTracker />
          </div>
        </div>
      </div>

      {/* Quick nav cards */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { href: "/nutrition", icon: Apple, label: t.nav.nutrition, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          { href: "/explore", icon: Dumbbell, label: t.nav.explore, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
          { href: "/community", icon: Heart, label: t.nav.community, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className="section-card p-4 flex flex-col items-center gap-2.5 card-hover group">
              <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <AiCoachChat />
    </div>
  );
}
