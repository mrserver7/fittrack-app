import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate, formatDateTime, getStatusColor } from "@/lib/utils";
import { ArrowLeft, Target, AlertTriangle, Calendar, MessageSquare, ClipboardList } from "lucide-react";
import AssignProgramButton from "@/components/clients/assign-program-button";
import SendCheckinButton from "@/components/clients/send-checkin-button";

type Params = { params: Promise<{ id: string }> };

export default async function ClientProfilePage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const trainerId = session!.user!.id!;

  const [client, programs] = await Promise.all([
    prisma.client.findUnique({
      where: { id, trainerId, deletedAt: null },
      include: {
        clientPrograms: {
          where: { status: "active" },
          include: { program: true },
          orderBy: { assignedAt: "desc" },
        },
        sessionLogs: {
          orderBy: { scheduledDate: "desc" },
          take: 15,
          include: { painFlags: true },
        },
        measurements: { orderBy: { recordedDate: "desc" }, take: 5 },
        personalRecords: { include: { exercise: true }, orderBy: { createdAt: "desc" }, take: 8 },
        goalMilestones: { orderBy: { sortOrder: "asc" } },
        _count: {
          select: {
            sessionLogs: { where: { status: "completed" } },
            messages: true,
          },
        },
      },
    }),
    prisma.program.findMany({
      where: { trainerId, deletedAt: null },
      select: { id: true, name: true, durationWeeks: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!client) notFound();

  const completedSessions = client.sessionLogs.filter((s) => s.status === "completed").length;
  const scheduledSessions = client.sessionLogs.length;
  const adherence = scheduledSessions > 0 ? Math.round((completedSessions / scheduledSessions) * 100) : 0;
  const lastMeasurement = client.measurements[0];

  const statusColors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    paused: "bg-yellow-100 text-yellow-700",
    archived: "bg-gray-100 text-gray-500",
    invited: "bg-blue-100 text-blue-700",
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
        <Link href="/clients">
          <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </Link>
        <div className="flex-1 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold">
            {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${statusColors[client.status]}`}>
                {client.status}
              </span>
            </div>
            <p className="text-gray-400 text-sm">{client.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/clients/${id}/messages`}>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message
            </button>
          </Link>
          <SendCheckinButton clientId={id} />
          <AssignProgramButton clientId={id} programs={programs} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions Done", value: client._count.sessionLogs },
          { label: "Adherence", value: `${adherence}%` },
          { label: "Current Weight", value: lastMeasurement?.weightKg ? `${lastMeasurement.weightKg}kg` : "—" },
          { label: "PRs", value: client.personalRecords.length },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: profile details */}
        <div className="space-y-4">
          {/* Goals */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Goals</h3>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">{client.goalsText || "No goals recorded."}</p>
          </div>

          {/* Injuries */}
          {client.injuriesText && (
            <div className="bg-white rounded-2xl border border-red-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-red-800 text-sm">Injuries / Contraindications</h3>
              </div>
              <p className="text-sm text-red-700 leading-relaxed">{client.injuriesText}</p>
            </div>
          )}

          {/* Active Program */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Active Program</h3>
            </div>
            {client.clientPrograms.length > 0 ? (
              <div className="space-y-2">
                {client.clientPrograms.map((cp) => (
                  <div key={cp.id} className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900">{cp.program.name}</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      Started: {formatDate(cp.startDate)} · {cp.program.durationWeeks} weeks
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No program assigned.</p>
            )}
          </div>

          {/* Tags */}
          {client.tags && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {client.tags.split(",").map((t) => (
                  <span key={t} className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">{t.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {/* Trainer notes */}
          {client.trainerNotes && (
            <div className="bg-white rounded-2xl border border-yellow-200 p-5">
              <h3 className="font-semibold text-yellow-800 text-sm mb-2">Private Notes</h3>
              <p className="text-sm text-yellow-700 leading-relaxed">{client.trainerNotes}</p>
            </div>
          )}
        </div>

        {/* Right column: sessions + PRs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Goal Milestones */}
          {client.goalMilestones.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Goal Milestones</h3>
              <div className="space-y-3">
                {client.goalMilestones.map((m) => {
                  const pct = m.targetValue && m.progressValue
                    ? Math.min(100, Math.round((m.progressValue / m.targetValue) * 100))
                    : m.achievedAt ? 100 : 0;
                  return (
                    <div key={m.id}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-900">{m.title}</p>
                        <span className={`text-xs ${m.achievedAt ? "text-emerald-600" : "text-gray-400"}`}>
                          {m.achievedAt ? "✓ Achieved" : `${pct}%`}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${m.achievedAt ? "bg-emerald-500" : "bg-blue-400"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 text-sm">Recent Sessions</h3>
            </div>
            {client.sessionLogs.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No sessions logged yet.</p>
            ) : (
              <div className="space-y-2">
                {client.sessionLogs.slice(0, 10).map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${sessionStatusColors[s.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(s.scheduledDate)}
                        </p>
                        {s.overallFeedbackEmoji && (
                          <span className="text-base">{s.overallFeedbackEmoji}</span>
                        )}
                        {s.painFlags.some((pf) => pf.severity >= 3) && (
                          <AlertTriangle className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {s.status} {s.totalVolumeKg ? `· ${s.totalVolumeKg}kg total volume` : ""} {s.avgRpe ? `· RPE ${s.avgRpe}` : ""}
                      </p>
                    </div>
                    {s.trainerComment && (
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" title="Trainer commented" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PRs */}
          {client.personalRecords.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Personal Records 🏆</h3>
              <div className="grid grid-cols-2 gap-3">
                {client.personalRecords.map((pr) => (
                  <div key={pr.id} className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-xs text-amber-600 font-medium">{pr.exercise.name}</p>
                    <p className="text-lg font-bold text-amber-800">{pr.valueKg}kg</p>
                    {pr.repsAtPr && <p className="text-xs text-amber-600">× {pr.repsAtPr} reps</p>}
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
