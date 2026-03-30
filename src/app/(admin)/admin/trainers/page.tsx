import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Shield, Users, Activity, ArrowLeft, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import ApproveTrainerButton from "@/components/admin/approve-trainer-button";
import CanApproveToggle from "@/components/admin/can-approve-toggle";

export default async function AdminTrainersPage() {
  const [, t] = await Promise.all([auth(), getT()]);

  const trainers = await prisma.trainer.findMany({
    where: { isAdmin: false, deletedAt: null },
    include: { _count: { select: { clients: { where: { deletedAt: null } } } } },
    orderBy: { createdAt: "asc" },
  });
  const pendingTrainers = trainers.filter((t) => t.status === "pending");
  const activeTrainers = trainers.filter((t) => t.status !== "pending");

  const sessionCounts = await prisma.sessionLog.groupBy({
    by: ["clientId"],
    where: { status: "completed" },
    _count: { id: true },
  });

  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, trainerId: true },
  });
  const clientTrainerMap = new Map(clients.map((c) => [c.id, c.trainerId]));
  const trainerSessionMap = new Map<string, number>();
  for (const sc of sessionCounts) {
    const tid = clientTrainerMap.get(sc.clientId);
    if (tid) {
      trainerSessionMap.set(tid, (trainerSessionMap.get(tid) ?? 0) + sc._count.id);
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="p-2 hover:bg-muted/60 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{t.admin.trainers}</h1>
          <p className="text-muted-foreground text-sm">{trainers.length} trainer{trainers.length !== 1 ? "s" : ""} registered</p>
        </div>
      </div>

      {trainers.length === 0 ? (
        <div className="text-center py-20 section-card border-dashed">
          <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.admin.noTrainersYet}</h3>
          <p className="text-muted-foreground text-sm">{t.admin.noTrainersSub}</p>
        </div>
      ) : (
        <>
          {/* Pending trainers */}
          {pendingTrainers.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-foreground">Pending Approval</h2>
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {pendingTrainers.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingTrainers.map((trainer) => (
                  <div key={trainer.id}
                    className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {trainer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{trainer.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">{trainer.email}</p>
                        {trainer.businessName && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{trainer.businessName}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{t.admin.joined} {formatDate(trainer.createdAt)}</p>
                      <ApproveTrainerButton trainerId={trainer.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active trainers */}
          {activeTrainers.length > 0 && (
            <div>
              {pendingTrainers.length > 0 && (
                <h2 className="font-semibold text-foreground mb-3">Active Trainers</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {activeTrainers.map((trainer) => {
                  const sessions = trainerSessionMap.get(trainer.id) ?? 0;
                  return (
                    <div key={trainer.id}
                      className="section-card p-5 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {trainer.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">{trainer.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{trainer.email}</p>
                          {trainer.businessName && (
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{trainer.businessName}</p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-border grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <div className="w-7 h-7 bg-blue-50 dark:bg-blue-500/10 rounded-lg flex items-center justify-center">
                            <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span>{trainer._count.clients} {t.admin.subscribers}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-foreground/70">
                          <div className="w-7 h-7 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                            <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span>{sessions} {t.admin.sessions}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">{t.admin.joined} {formatDate(trainer.createdAt)}</p>
                        <CanApproveToggle trainerId={trainer.id} initialValue={trainer.canApproveClients} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
