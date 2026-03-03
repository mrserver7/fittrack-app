import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Dumbbell, TrendingUp, CheckSquare, Award, Flame, CheckCircle } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import ClientNotifications from "@/components/client/client-notifications";

export default async function ClientHomePage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const clientId = session!.user!.id!;

  const todayStr = new Date().toISOString().split("T")[0];
  const [client, recentSessions, upcomingCheckins, recentPRs, notifications, todayDone] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        clientPrograms: {
          where: { status: "active" },
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
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
          {t.home.greeting}, {session?.user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      <ClientNotifications initialNotifications={notifications} />

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{completedCount}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.home.sessionsDone}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600 flex items-center justify-center gap-1">
            <Flame className="w-5 h-5" /> {streak}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.home.streak}</div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">{adherence}%</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t.home.adherence}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/workout/today"
          className={`rounded-2xl p-6 text-white hover:shadow-lg transition-shadow group ${todayDone ? "bg-gradient-to-br from-gray-600 to-gray-800" : "bg-gradient-to-br from-emerald-500 to-emerald-700"}`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {todayDone ? <CheckCircle className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs text-white/70">{t.workout.today}</p>
              <p className="font-bold text-lg leading-tight">
                {todayDone ? t.home.workoutDoneToday : t.workout.startWorkout}
              </p>
            </div>
          </div>
          {hasActiveProgram ? (
            <p className="text-white/70 text-sm">{activeProgram.program.name}</p>
          ) : (
            <p className="text-white/50 text-sm">{t.workout.noProgram}</p>
          )}
          <div className="mt-4 flex items-center gap-1 text-sm font-medium">
            {todayDone ? t.home.doItAgain : t.workout.openWorkout + " "}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-50">{t.checkins.title}</h2>
          </div>
          {upcomingCheckins.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t.checkins.noCheckInsYet}</p>
          ) : (
            <div className="space-y-2">
              {upcomingCheckins.map((ci) => (
                <Link key={ci.id} href={`/checkins/${ci.id}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-300">{ci.checkInForm.name}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{t.checkins.complete}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {recentPRs.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-50">{t.home.yourPRs} 🏆</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recentPRs.map((pr) => (
                <div key={pr.id} className="p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium truncate">{pr.exercise.name}</p>
                  <p className="text-base font-bold text-amber-800 dark:text-amber-300">{pr.valueKg}kg</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="font-semibold text-gray-900 dark:text-gray-50">{t.home.recentSessions}</h2>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">{t.home.noSessionsYet}</p>
          ) : (
            <div className="space-y-2">
              {recentSessions.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "completed" ? "bg-emerald-500" : "bg-red-400"}`} />
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{formatDate(s.scheduledDate)}</p>
                  <span className="text-base">{s.overallFeedbackEmoji || ""}</span>
                  {s.totalVolumeKg && <p className="text-xs text-gray-400 dark:text-gray-500">{s.totalVolumeKg}kg</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
