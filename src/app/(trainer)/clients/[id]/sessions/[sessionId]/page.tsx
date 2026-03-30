import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, AlertTriangle } from "lucide-react";

type Params = { params: Promise<{ id: string; sessionId: string }> };

export default async function TrainerSessionSummaryPage({ params }: Params) {
  const { id: clientId, sessionId } = await params;
  const session = await auth();
  const trainerId = session!.user!.id!;

  // Verify trainer owns this client
  const client = await prisma.client.findUnique({
    where: { id: clientId, trainerId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!client) notFound();

  const log = await prisma.sessionLog.findUnique({
    where: { id: sessionId },
    include: {
      workoutDay: true,
      sets: {
        include: { exercise: true },
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
      },
      painFlags: true,
    },
  });

  if (!log || log.clientId !== clientId) notFound();

  // Group sets by exercise
  const setsByExercise = log.sets.reduce<Record<string, typeof log.sets>>((acc, s) => {
    const key = s.exercise.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const statusColor = log.status === "completed"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
    : "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400";

  return (
    <div className="page-container max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/clients/${clientId}`}>
          <button className="p-2 rounded-xl border border-border hover:bg-muted/60 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground truncate">{client.name}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(log.scheduledDate)} · {log.workoutDay?.dayLabel || "Free session"}
          </p>
        </div>
        {log.overallFeedbackEmoji && (
          <span className="text-3xl">{log.overallFeedbackEmoji}</span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="section-card-padded text-center">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${statusColor}`}>{log.status}</span>
        </div>
        <div className="section-card-padded text-center">
          <p className="text-lg font-bold text-foreground">{log.totalVolumeKg ? `${log.totalVolumeKg}kg` : "--"}</p>
          <p className="text-xs text-muted-foreground">Volume</p>
        </div>
        <div className="section-card-padded text-center">
          <p className="text-lg font-bold text-foreground">{log.avgRpe ?? "--"}</p>
          <p className="text-xs text-muted-foreground">Avg RPE</p>
        </div>
      </div>

      {/* Readiness */}
      {(log.readinessSleep || log.readinessSoreness || log.readinessMotivation) && (
        <div className="bg-muted rounded-2xl p-4 mb-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{log.readinessSleep ?? "--"}</p>
            <p className="text-xs text-muted-foreground">Sleep</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{log.readinessSoreness ?? "--"}</p>
            <p className="text-xs text-muted-foreground">Soreness</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{log.readinessMotivation ?? "--"}</p>
            <p className="text-xs text-muted-foreground">Motivation</p>
          </div>
        </div>
      )}

      {/* Client notes */}
      {log.notes && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-4 mb-4">
          <p className="text-xs text-blue-500 dark:text-blue-400 font-medium mb-1">Client notes</p>
          <p className="text-sm text-blue-900 dark:text-blue-200">{log.notes}</p>
        </div>
      )}

      {/* Pain flags */}
      {log.painFlags.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">Pain Flags</p>
          </div>
          <div className="space-y-1">
            {log.painFlags.map((pf) => (
              <p key={pf.id} className="text-sm text-red-600 dark:text-red-300">
                {pf.bodyRegion.replace(/_/g, " ")} -- severity {pf.severity}/5
                {pf.notes ? ` (${pf.notes})` : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Sets by exercise */}
      {Object.keys(setsByExercise).length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">Exercises Logged</h2>
          {Object.entries(setsByExercise).map(([exerciseName, sets]) => (
            <div key={exerciseName} className="section-card overflow-hidden">
              <div className="px-4 py-3 bg-muted border-b border-border">
                <p className="font-semibold text-foreground text-sm">{exerciseName}</p>
                <p className="text-xs text-muted-foreground">{sets.length} set{sets.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="divide-y divide-border">
                {sets.map((s) => (
                  <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {s.setNumber}
                    </span>
                    <div className="flex gap-6 text-sm">
                      {s.weightKg != null && (
                        <div>
                          <span className="font-semibold text-foreground">{s.weightKg}kg</span>
                          <span className="text-xs text-muted-foreground ml-1">weight</span>
                        </div>
                      )}
                      {s.repsActual != null && (
                        <div>
                          <span className="font-semibold text-foreground">{s.repsActual}</span>
                          <span className="text-xs text-muted-foreground ml-1">reps</span>
                        </div>
                      )}
                      {s.rpeActual != null && (
                        <div>
                          <span className="font-semibold text-foreground">{s.rpeActual}</span>
                          <span className="text-xs text-muted-foreground ml-1">RPE</span>
                        </div>
                      )}
                    </div>
                    {s.notes && (
                      <p className="text-xs text-muted-foreground ml-auto truncate max-w-[120px]">{s.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground text-sm">No exercises logged for this session.</div>
      )}
    </div>
  );
}
