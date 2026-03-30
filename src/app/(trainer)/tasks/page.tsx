import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import TaskList from "@/components/tasks/task-list";

export default async function TasksPage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const trainerId = session!.user!.id!;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [staleClients, recentPainFlags, pendingCheckins] = await Promise.all([
    prisma.client.findMany({
      where: {
        trainerId, status: "active", deletedAt: null,
        sessionLogs: { none: { status: "completed", completedAt: { gte: sevenDaysAgo } } },
      },
      include: {
        sessionLogs: { where: { status: "completed" }, orderBy: { completedAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "asc" },
    }),
    prisma.painFlag.findMany({
      where: { client: { trainerId }, severity: { gte: 3 }, flaggedAt: { gte: sevenDaysAgo } },
      include: { client: { select: { id: true, name: true } }, sessionLog: true },
      orderBy: { flaggedAt: "desc" },
    }),
    prisma.checkIn.findMany({
      where: { client: { trainerId }, status: { in: ["pending", "completed"] }, trainerComment: null, submittedAt: { not: null } },
      include: { client: { select: { id: true, name: true } }, checkInForm: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 20,
    }),
  ]);

  const tasks = [
    ...staleClients.map((c) => ({
      id: `stale-${c.id}`,
      type: "stale" as const,
      priority: "medium" as const,
      client: c,
      label: t.tasks.noSessionsIn7Days,
      detail: c.sessionLogs[0]
        ? `${t.tasks.lastSession}: ${formatDate(c.sessionLogs[0].completedAt)}`
        : t.tasks.noSessionsEver,
      href: `/clients/${c.id}`,
    })),
    ...recentPainFlags.map((pf) => ({
      id: `pain-${pf.id}`,
      type: "pain" as const,
      priority: "high" as const,
      client: pf.client,
      label: `${t.tasks.painFlag}: ${pf.bodyRegion} (severity ${pf.severity}/5)`,
      detail: formatDate(pf.flaggedAt),
      href: `/clients/${pf.clientId}`,
    })),
    ...pendingCheckins.map((ci) => ({
      id: `checkin-${ci.id}`,
      type: "checkin" as const,
      priority: "low" as const,
      client: ci.client,
      label: t.tasks.checkInAwaiting,
      detail: `${t.tasks.form}: ${ci.checkInForm.name}`,
      href: `/clients/${ci.clientId}/checkins/${ci.id}`,
    })),
  ];

  const priorityLabel: Record<string, string> = {
    high: t.tasks.high,
    medium: t.tasks.medium,
    low: t.tasks.low,
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t.tasks.title}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {tasks.length} {tasks.length !== 1 ? t.tasks.itemsRequiringAttention : t.tasks.itemRequiringAttention}
        </p>
      </div>

      <TaskList
        tasks={tasks}
        priorityLabel={priorityLabel}
        allClearTitle={t.tasks.allClear}
        allClearSub={t.tasks.allClearSub}
      />
    </div>
  );
}
