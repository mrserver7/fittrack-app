import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { ShieldX, User } from "lucide-react";
import RestoreClientButton from "@/components/admin/restore-client-button";
import ApproveRejectButtons from "@/components/clients/approve-reject-buttons";

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

  const statusColors: Record<string, string> = {
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    archived: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ShieldX className="w-6 h-6 text-red-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Banned / Removed Users</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {bannedClients.length} user{bannedClients.length !== 1 ? "s" : ""} — rejected or deleted accounts
          </p>
        </div>
      </div>

      {bannedClients.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <ShieldX className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No banned or removed users.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
          {bannedClients.map((client) => (
            <div key={client.id} className="flex items-center gap-4 p-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {client.photoUrl ? (
                  <img src={client.photoUrl} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{client.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[client.status] ?? ""}`}>
                    {client.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {client.email}
                  {client.trainer ? ` · ${client.trainer.name}` : " · No trainer"}
                  {" · Joined "}{formatDate(client.createdAt.toISOString())}
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
          ))}
        </div>
      )}
    </div>
  );
}
