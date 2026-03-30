import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ShieldX, User, CheckCircle, XCircle } from "lucide-react";
import RestoreClientButton from "@/components/admin/restore-client-button";
import ApproveRejectButtons from "@/components/clients/approve-reject-buttons";

const reasonLabels: Record<string, string> = {
  wrong_password: "Wrong password",
  not_found: "Account not found",
  blocked: "Account blocked",
  invalid_input: "Invalid input",
};

export default async function BannedUsersPage() {
  const session = await auth();
  if (!(session?.user as Record<string, unknown> | undefined)?.isAdmin) redirect("/admin");

  const [bannedClients, trainers] = await Promise.all([
    prisma.client.findMany({
      where: { status: { in: ["rejected", "archived"] } },
      include: { trainer: { select: { id: true, name: true, businessName: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.trainer.findMany({
      where: { isAdmin: false, deletedAt: null },
      select: { id: true, name: true, businessName: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Fetch login attempts for all banned users' emails in one query
  const bannedEmails = bannedClients.map((c) => c.email);
  const loginAttempts = bannedEmails.length > 0
    ? await prisma.loginAttempt.findMany({
        where: { email: { in: bannedEmails } },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // Group attempts by email
  const attemptsByEmail = loginAttempts.reduce<Record<string, typeof loginAttempts>>((acc, a) => {
    (acc[a.email] ??= []).push(a);
    return acc;
  }, {});

  const statusColors: Record<string, string> = {
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    archived: "bg-muted text-muted-foreground",
  };

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 mb-6">
        <ShieldX className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banned / Removed Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {bannedClients.length} user{bannedClients.length !== 1 ? "s" : ""} -- rejected or deleted accounts
          </p>
        </div>
      </div>

      {bannedClients.length === 0 ? (
        <div className="text-center py-20 section-card border-dashed">
          <ShieldX className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No banned or removed users.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bannedClients.map((client) => {
            const attempts = attemptsByEmail[client.email] ?? [];
            const failCount = attempts.filter((a) => !a.success).length;
            const lastAttempt = attempts[0];

            return (
              <div key={client.id} className="section-card overflow-hidden">
                {/* User header row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {client.photoUrl ? (
                      <img src={client.photoUrl} alt={client.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{client.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[client.status] ?? ""}`}>
                        {client.status}
                      </span>
                      {failCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                          {failCount} failed attempt{failCount !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client.email}
                      {client.trainer ? ` · ${client.trainer.name}` : " · No trainer"}
                      {" · Joined "}{formatDate(client.createdAt.toISOString())}
                      {lastAttempt && ` · Last attempt ${lastAttempt.createdAt.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <RestoreClientButton clientId={client.id} />
                    <ApproveRejectButtons
                      clientId={client.id}
                      clientTrainerId={client.trainerId}
                      trainers={trainers}
                    />
                  </div>
                </div>

                {/* Login attempt log */}
                {attempts.length > 0 && (
                  <div className="border-t border-border bg-muted/50 px-4 py-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Sign-in attempts ({attempts.length})
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {attempts.map((a) => (
                        <div key={a.id} className="flex items-center gap-3 text-xs">
                          {a.success ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                          )}
                          <span className={`font-medium w-14 flex-shrink-0 ${a.success ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {a.success ? "Success" : "Failed"}
                          </span>
                          <span className="text-muted-foreground flex-shrink-0">
                            {a.reason ? reasonLabels[a.reason] ?? a.reason : "--"}
                          </span>
                          {a.ipAddress && (
                            <span className="text-muted-foreground/50 font-mono flex-shrink-0">{a.ipAddress}</span>
                          )}
                          <span className="text-muted-foreground/50 ml-auto flex-shrink-0 whitespace-nowrap">
                            {a.createdAt.toLocaleString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {attempts.length === 0 && (
                  <div className="border-t border-border bg-muted/50 px-4 py-2">
                    <p className="text-xs text-muted-foreground">No sign-in attempts recorded.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
