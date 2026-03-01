import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CheckSquare, Clock } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function CheckInsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const clientId = session!.user!.id!;

  const checkIns = await prisma.checkIn.findMany({
    where: { clientId },
    include: { checkInForm: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const statusStyles: Record<string, string> = {
    pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
    completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.checkins.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.checkins.subtitle}</p>
      </div>

      {checkIns.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <CheckSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">{t.checkins.noCheckInsYet}</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm">{t.checkins.noCheckInsSub}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {checkIns.map((ci) => (
            <div key={ci.id} className={`bg-white dark:bg-gray-900 rounded-2xl border ${ci.status === "pending" ? "border-orange-200 dark:border-orange-800" : "border-gray-200 dark:border-gray-700"} p-5`}>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${ci.status === "pending" ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                  {ci.status === "pending" ? (
                    <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  ) : (
                    <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-50">{ci.checkInForm.name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusStyles[ci.status]}`}>
                      {ci.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {formatDate(ci.periodStart)} – {formatDate(ci.periodEnd)}
                  </p>
                  {ci.trainerComment && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                      <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">{t.checkins.trainerResponse}</p>
                      <p className="text-sm text-blue-900 dark:text-blue-300">{ci.trainerComment}</p>
                    </div>
                  )}
                </div>
                {ci.status === "pending" && (
                  <Link href={`/checkins/${ci.id}`}>
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap">
                      {t.checkins.complete}
                    </button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
