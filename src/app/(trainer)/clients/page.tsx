import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { UserPlus, Search, Clock } from "lucide-react";
import ApproveRejectButtons from "@/components/clients/approve-reject-buttons";
import EngagementBadge from "@/components/clients/engagement-badge";
import { getT } from "@/lib/i18n/server";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  archived: "bg-muted text-muted-foreground",
  invited: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>;
}) {
  const [session, t] = await Promise.all([auth(), getT()]);
  const trainerId = session!.user!.id!;
  const isAdmin = (session!.user as Record<string, unknown>).isAdmin as boolean;
  const { search = "", status = "" } = await searchParams;

  const whereBase = isAdmin ? {} : { trainerId };

  // Check if trainer has permission to approve clients
  const trainerRecord = !isAdmin
    ? await prisma.trainer.findUnique({ where: { id: trainerId }, select: { canApproveClients: true } })
    : null;
  const canApprove = isAdmin || (trainerRecord?.canApproveClients ?? false);

  const [activeClients, pendingClients] = await Promise.all([
    prisma.client.findMany({
      where: {
        ...whereBase,
        deletedAt: null,
        status: { notIn: ["pending"] },
        ...(search ? { name: { contains: search } } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        sessionLogs: {
          where: { status: "completed" },
          orderBy: { completedAt: "desc" },
          take: 1,
        },
        _count: { select: { sessionLogs: { where: { status: "completed" } } } },
        trainer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.findMany({
      // Admin sees all pending; trainer with canApproveClients sees all pending; regular trainer sees only their own
      where: canApprove && !isAdmin ? { status: "pending", deletedAt: null } : { ...whereBase, status: "pending", deletedAt: null },
      include: { trainer: { select: { name: true, businessName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const allStatuses = ["", "active", "paused", "invited", "archived"];
  const currentTab = status === "pending" ? "pending" : "active";
  const statusLabels: Record<string, string> = {
    active: t.clients.statusActive,
    paused: t.clients.statusPaused,
    archived: t.clients.statusArchived,
    invited: t.clients.statusInvited,
    pending: t.clients.statusPending,
  };

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? t.clients.allSubscribers : t.clients.title}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeClients.length} {t.clients.title.toLowerCase()}
            {pendingClients.length > 0 && ` · ${pendingClients.length} ${t.clients.pendingApproval.toLowerCase()}`}
          </p>
        </div>
        {!isAdmin && (
          <Link href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
            <UserPlus className="w-4 h-4" /> {t.clients.inviteClient}
          </Link>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-5 border-b border-border">
        <Link href="/clients"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${currentTab === "active" ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          {t.clients.active}
        </Link>
        <Link href="/clients?status=pending"
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${currentTab === "pending" ? "border-orange-500 text-orange-700 dark:text-orange-400" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
          <Clock className="w-3.5 h-3.5" />
          {t.clients.pendingApproval}
          {pendingClients.length > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingClients.length}
            </span>
          )}
        </Link>
      </div>

      {currentTab === "pending" ? (
        <div className="space-y-3">
          {pendingClients.length === 0 ? (
            <div className="text-center py-16 section-card border-dashed">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">{t.clients.noPendingRequests}</p>
            </div>
          ) : (
            pendingClients.map((client) => (
              <div key={client.id} className="bg-card rounded-2xl border border-orange-200 dark:border-orange-800 p-5 flex items-center gap-4">
                <div className="w-11 h-11 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                  {client.goalsText && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{t.clients.goals}: {client.goalsText}</p>
                  )}
                  {isAdmin && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{t.clients.trainer}: {client.trainer.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">{t.clients.requested}: {formatDate(client.createdAt)}</p>
                </div>
                {canApprove && <ApproveRejectButtons clientId={client.id} />}
              </div>
            ))
          )}
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <form className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input name="search" defaultValue={search} placeholder={t.clients.searchSubscribers}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              {status && <input type="hidden" name="status" value={status} />}
              <button type="submit" className="sr-only">Search</button>
            </form>
            <div className="flex gap-2 flex-wrap">
              {allStatuses.map((s) => (
                <Link key={s} href={`/clients?${s ? `status=${s}` : ""}${search ? `&search=${search}` : ""}`}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    status === s ? "bg-foreground text-background border-foreground" : "bg-card text-muted-foreground border-border hover:border-muted-foreground"
                  }`}>
                  {s ? (statusLabels[s] || s) : t.common.all}
                </Link>
              ))}
            </div>
          </div>

          {activeClients.length === 0 ? (
            <div className="text-center py-20 section-card border-dashed">
              <div className="text-5xl mb-4">&#x1F465;</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{t.clients.noSubscribersFound}</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                {search || status ? t.clients.tryAdjusting : t.clients.noSubscribersSub}
              </p>
              {!search && !status && !isAdmin && (
                <Link href="/clients/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
                  <UserPlus className="w-4 h-4" /> {t.clients.inviteClient2}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}
                  className="section-card p-5 hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all group">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate">{client.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[client.status] || "bg-muted text-muted-foreground"}`}>
                          {statusLabels[client.status] || client.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{client.email}</p>
                      {isAdmin && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">{t.clients.trainer}: {client.trainer.name}</p>
                      )}
                      {client.tags && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {client.tags.split(",").slice(0, 3).map((tag) => (
                            <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{tag.trim()}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{t.clients.sessions}: {client._count.sessionLogs}</span>
                      <EngagementBadge clientId={client.id} />
                    </div>
                    <span>
                      {client.sessionLogs[0]
                        ? `${t.clients.last}: ${formatDate(client.sessionLogs[0].completedAt)}`
                        : client.startDate
                        ? `${t.clients.since} ${formatDate(client.startDate)}`
                        : t.clients.noSessionsYet}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
