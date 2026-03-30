import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Dumbbell, ChevronRight, Zap } from "lucide-react";
import { redirect } from "next/navigation";
import { getT } from "@/lib/i18n/server";

export default async function WorkoutsHistoryPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  if (!session) redirect("/login");
  const clientId = session.user!.id!;

  const [sessions, activeProgram] = await Promise.all([
    prisma.sessionLog.findMany({
      where: { clientId, status: { in: ["completed", "skipped"] } },
      include: { workoutDay: true },
      orderBy: { scheduledDate: "desc" },
      take: 50,
    }),
    prisma.clientProgram.findFirst({
      where: { clientId, status: "active", program: { deletedAt: null } },
      include: { program: { select: { name: true } } },
    }),
  ]);

  const statusLabels: Record<string, string> = {
    completed: t.workouts.statusCompleted,
    skipped: t.workouts.statusSkipped,
  };

  const statusColors: Record<string, string> = {
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    skipped: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.workouts.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sessions.length} {sessions.length !== 1 ? t.workouts.sessionsLogged : t.workouts.sessionLogged}
          </p>
        </div>
        {activeProgram && (
          <Link href="/workout/today"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
            <Zap className="w-4 h-4" /> {t.workouts.todaysWorkout}
          </Link>
        )}
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 section-card border-dashed">
          <Dumbbell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.workouts.noSessionsYet}</h3>
          <p className="text-muted-foreground text-sm">{t.workouts.noSessionsSub}</p>
          {activeProgram && (
            <Link href="/workout/today"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
              {t.workouts.startTodayWorkout}
            </Link>
          )}
        </div>
      ) : (
        <div className="section-card divide-y divide-border">
          {sessions.map((s) => (
            <Link key={s.id} href={`/workouts/${s.id}`}
              className="flex items-center gap-4 p-4 hover:bg-muted/60 transition-colors group first:rounded-t-2xl last:rounded-b-2xl">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${s.status === "completed" ? "bg-emerald-500" : "bg-red-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{formatDate(s.scheduledDate)}</p>
                  {s.overallFeedbackEmoji && <span className="text-base">{s.overallFeedbackEmoji}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[s.status] || ""}`}>
                    {statusLabels[s.status] || s.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.workoutDay?.dayLabel || t.workouts.freeSession}
                  {s.totalVolumeKg ? ` · ${s.totalVolumeKg}kg volume` : ""}
                  {s.durationMinutes ? ` · ${s.durationMinutes}min` : ""}
                  {s.avgRpe ? ` · RPE ${s.avgRpe}` : ""}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 transition-colors" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
