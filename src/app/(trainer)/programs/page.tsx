import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { Plus, ClipboardList, Users } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export default async function ProgramsPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const trainerId = session!.user!.id!;

  const programs = await prisma.program.findMany({
    where: { trainerId, deletedAt: null },
    include: {
      weeks: { include: { days: { include: { _count: { select: { exercises: true } } } } } },
      _count: { select: { clientPrograms: { where: { status: "active" } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalDays = (p: typeof programs[0]) => p.weeks.reduce((wSum, w) => wSum + w.days.length, 0);

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.programs.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{programs.length} {programs.length !== 1 ? t.programs.programs : t.programs.program}</p>
        </div>
        <Link href="/programs/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
          <Plus className="w-4 h-4" /> {t.programs.newProgram}
        </Link>
      </div>

      {programs.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{t.programs.noProgramsYet}</h3>
          <p className="text-muted-foreground mb-6 text-sm">{t.programs.noProgramsSub}</p>
          <Link href="/programs/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl text-sm transition-colors">
            <Plus className="w-4 h-4" /> {t.programs.createProgram}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {programs.map((p) => (
            <Link key={p.id} href={`/programs/${p.id}`}
              className="section-card-padded hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                {p.goalTag && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded-full font-medium">{p.goalTag}</span>
                )}
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors mb-1 line-clamp-2">
                {p.name}
              </h3>
              {p.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{p.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-border">
                <span>{p.durationWeeks} {t.programs.weeks}</span>
                <span>·</span>
                <span>{totalDays(p)} {t.programs.workoutDays}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {p._count.clientPrograms} {t.programs.active}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
