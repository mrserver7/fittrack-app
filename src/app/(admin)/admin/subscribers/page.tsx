import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, ArrowLeft, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import ApproveRejectButtons from "@/components/clients/approve-reject-buttons";
import { getT } from "@/lib/i18n/server";

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  archived: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
  invited: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
};

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [, t] = await Promise.all([auth(), getT()]);
  const { status = "" } = await searchParams;

  const [allSubscribers, pendingCount] = await Promise.all([
    prisma.client.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      include: {
        trainer: { select: { name: true, businessName: true } },
        _count: { select: { sessionLogs: { where: { status: "completed" } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.client.count({ where: { deletedAt: null, status: "pending" } }),
  ]);

  const allStatuses = ["", "active", "pending", "paused", "invited", "archived"];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.admin.allSubscribers}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {allSubscribers.length} {t.admin.subscribers}
            {pendingCount > 0 && ` · ${pendingCount} ${t.admin.pending}`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {allStatuses.map((s) => (
          <Link
            key={s}
            href={`/admin/subscribers${s ? `?status=${s}` : ""}`}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              status === s
                ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
            }`}>
            {s ? s.charAt(0).toUpperCase() + s.slice(1) : t.common.all}
            {s === "pending" && pendingCount > 0 && (
              <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold ${status === "pending" ? "bg-white text-gray-900" : "bg-orange-500 text-white"}`}>
                {pendingCount}
              </span>
            )}
          </Link>
        ))}
      </div>

      {allSubscribers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">{t.admin.noSubscribersFound}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.admin.tryAdjustingFilter}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allSubscribers.map((client) => (
            <div
              key={client.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border p-5 flex items-center gap-4 ${
                client.status === "pending" ? "border-orange-200 dark:border-orange-800" : "border-gray-200 dark:border-gray-700"
              }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                client.status === "pending"
                  ? "bg-gradient-to-br from-orange-400 to-orange-600"
                  : "bg-gradient-to-br from-emerald-400 to-emerald-600"
              }`}>
                {client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 dark:text-gray-50">{client.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[client.status] || "bg-gray-100 text-gray-500"}`}>
                    {client.status}
                  </span>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">{client.email}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                  {t.admin.trainer}: {client.trainer.name}
                  {client.trainer.businessName ? ` · ${client.trainer.businessName}` : ""}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{client._count.sessionLogs} {t.admin.sessions}</span>
                  <span>·</span>
                  {client.status === "pending" ? (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {t.admin.requested} {formatDate(client.createdAt)}
                    </span>
                  ) : (
                    <span>{t.admin.joined} {formatDate(client.createdAt)}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {client.status === "pending" && (
                  <ApproveRejectButtons clientId={client.id} />
                )}
                <Link href={`/admin/subscribers/${client.id}`}
                  className="px-3 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap">
                  View →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
