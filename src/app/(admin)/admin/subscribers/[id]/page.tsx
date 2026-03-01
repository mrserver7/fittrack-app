import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, AlertTriangle, Calendar, MessageSquare, ClipboardList, Shield } from "lucide-react";
import { formatDate, formatDateTime } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function AdminSubscriberDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = (session?.user as Record<string, unknown>)?.isAdmin as boolean;
  if (!session || !isAdmin) redirect("/dashboard");

  const client = await prisma.client.findUnique({
    where: { id, deletedAt: null },
    include: {
      trainer: { select: { id: true, name: true, email: true, businessName: true } },
      clientPrograms: {
        include: { program: true },
        orderBy: { assignedAt: "desc" },
      },
      sessionLogs: {
        orderBy: { scheduledDate: "desc" },
        take: 20,
        include: { painFlags: true, workoutDay: { include: { exercises: { include: { exercise: true } } } } },
      },
      measurements: { orderBy: { recordedDate: "desc" }, take: 5 },
      personalRecords: { include: { exercise: true }, orderBy: { createdAt: "desc" }, take: 8 },
      goalMilestones: { orderBy: { sortOrder: "asc" } },
      _count: {
        select: {
          sessionLogs: { where: { status: "completed" } },
          messages: true,
          checkIns: true,
        },
      },
    },
  });

  if (!client) notFound();

  const completedSessions = client.sessionLogs.filter((s) => s.status === "completed").length;
  const adherence = client.sessionLogs.length > 0 ? Math.round((completedSessions / client.sessionLogs.length) * 100) : 0;
  const lastMeasurement = client.measurements[0];

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-yellow-100 text-yellow-700",
    archived: "bg-gray-100 text-gray-500",
    invited: "bg-blue-100 text-blue-700",
    pending: "bg-orange-100 text-orange-700",
  };

  const sessionStatusColors: Record<string, string> = {
    completed: "bg-emerald-500",
    skipped: "bg-red-400",
    in_progress: "bg-blue-400",
    pending: "bg-gray-200",
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/subscribers">
          <button className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
            {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{client.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColors[client.status] || "bg-gray-100 text-gray-500"}`}>
                {client.status}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Admin View
              </span>
            </div>
            <p className="text-gray-400 text-sm">{client.email}</p>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              Trainer: {client.trainer.name}
              {client.trainer.businessName ? ` · ${client.trainer.businessName}` : ""}
            </p>
          </div>
        </div>
        <Link href={`/admin/subscribers/${id}/messages`}>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <MessageSquare className="w-4 h-4" /> View Messages
          </button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions Done", value: client._count.sessionLogs },
          { label: "Adherence", value: `${adherence}%` },
          { label: "Current Weight", value: lastMeasurement?.weightKg ? `${lastMeasurement.weightKg}kg` : "—" },
          { label: "Messages", value: client._count.messages },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-50">{s.value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Goals */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Goals</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{client.goalsText || "No goals recorded."}</p>
          </div>

          {/* Injuries */}
          {client.injuriesText && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">Injuries / Contraindications</h3>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 leading-relaxed">{client.injuriesText}</p>
            </div>
          )}

          {/* Active Programs */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Programs</h3>
            </div>
            {client.clientPrograms.length > 0 ? (
              <div className="space-y-2">
                {client.clientPrograms.map((cp) => (
                  <div key={cp.id} className={`p-3 rounded-xl ${cp.status === "active" ? "bg-blue-50 dark:bg-blue-950/30" : "bg-gray-50 dark:bg-gray-800"}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{cp.program.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cp.status === "active" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400"}`}>
                        {cp.status}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-500 mt-0.5">
                      Started: {formatDate(cp.startDate)} · {cp.program.durationWeeks}w
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500">No program assigned.</p>
            )}
          </div>

          {/* Trainer Notes (admin can see) */}
          {client.trainerNotes && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-yellow-200 dark:border-yellow-800 p-5">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300 text-sm mb-2">Trainer Private Notes</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">{client.trainerNotes}</p>
            </div>
          )}
        </div>

        {/* Right: Sessions + PRs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Goal Milestones */}
          {client.goalMilestones.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm mb-4">Goal Milestones</h3>
              <div className="space-y-3">
                {client.goalMilestones.map((m) => {
                  const pct = m.targetValue && m.progressValue
                    ? Math.min(100, Math.round((m.progressValue / m.targetValue) * 100))
                    : m.achievedAt ? 100 : 0;
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{m.title}</p>
                        <span className={`text-xs ${m.achievedAt ? "text-emerald-600" : "text-gray-400"}`}>
                          {m.achievedAt ? "✓ Achieved" : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${m.achievedAt ? "bg-emerald-500" : "bg-blue-400"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Session History */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm">Session History (last 20)</h3>
            </div>
            {client.sessionLogs.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No sessions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {client.sessionLogs.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${sessionStatusColors[s.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{formatDate(s.scheduledDate)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          s.status === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                          s.status === "skipped" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" :
                          "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}>{s.status}</span>
                        {s.overallFeedbackEmoji && <span>{s.overallFeedbackEmoji}</span>}
                        {s.painFlags.some((pf) => pf.severity >= 3) && (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      {s.workoutDay && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {s.workoutDay.dayLabel} · {s.workoutDay.exercises.length} exercises
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {s.totalVolumeKg ? `${s.totalVolumeKg}kg volume` : ""}
                        {s.avgRpe ? ` · RPE ${s.avgRpe}` : ""}
                        {s.durationMinutes ? ` · ${s.durationMinutes} min` : ""}
                      </p>
                      {s.painFlags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {s.painFlags.map((pf) => (
                            <span key={pf.id} className={`text-xs px-2 py-0.5 rounded-full ${pf.severity >= 3 ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"}`}>
                              ⚠ {pf.bodyRegion} {pf.severity}/5
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 whitespace-nowrap">{formatDateTime(s.updatedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRs */}
          {client.personalRecords.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-gray-50 text-sm mb-4">Personal Records 🏆</h3>
              <div className="grid grid-cols-2 gap-3">
                {client.personalRecords.map((pr) => (
                  <div key={pr.id} className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl">
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">{pr.exercise.name}</p>
                    <p className="text-lg font-bold text-amber-800 dark:text-amber-300">{pr.valueKg}kg</p>
                    {pr.repsAtPr && <p className="text-xs text-amber-600 dark:text-amber-400">× {pr.repsAtPr} reps</p>}
                    <p className="text-xs text-amber-400 mt-1">{formatDate(pr.recordedAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
