import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { getWeekStart, WEEKDAYS } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clientId = user.id;
  const todayStr = new Date().toISOString().split("T")[0];
  const weekStartDate = getWeekStart();

  const [client, recentSessions, recentPRs, pendingCheckins] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: {
        clientPrograms: {
          where: { status: "active" },
          include: {
            program: {
              include: {
                weeks: {
                  orderBy: { weekNumber: "asc" },
                  include: {
                    days: { orderBy: { dayOrder: "asc" } },
                  },
                },
              },
            },
          },
          orderBy: { assignedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.sessionLog.findMany({
      where: { clientId, status: { in: ["completed", "skipped"] } },
      orderBy: { scheduledDate: "desc" },
      take: 20,
      select: { id: true, status: true, scheduledDate: true, completedAt: true, durationMinutes: true, workoutDay: { select: { dayLabel: true } } },
    }),
    prisma.personalRecord.findMany({
      where: { clientId },
      include: { exercise: { select: { name: true, category: true, primaryMuscles: true } } },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    prisma.checkIn.count({ where: { clientId, status: "pending" } }),
  ]);

  // Stats
  const completedSessions = recentSessions.filter((s) => s.status === "completed");
  const adherence = recentSessions.length > 0
    ? Math.round((completedSessions.length / recentSessions.length) * 100)
    : 0;

  // Streak — consecutive workout weeks
  let streak = 0;
  const sortedDates = completedSessions.map((s) => s.scheduledDate);
  for (let i = 0; i < sortedDates.length; i++) {
    if (i === 0) { streak++; continue; }
    const diff = (new Date(sortedDates[i - 1]).getTime() - new Date(sortedDates[i]).getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 7) streak++; else break;
  }

  // Today done?
  const todayDone = recentSessions.some((s) => s.status === "completed" && s.scheduledDate === todayStr);

  // Today's weekday label
  const todayWeekday = WEEKDAYS[new Date().getDay()];

  // Active program info
  const activeProgram = client?.clientPrograms[0];
  let todayWorkoutLabel: string | null = null;

  if (activeProgram) {
    const program = activeProgram.program;
    const startDate = new Date(activeProgram.assignedAt);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
    const weekIndex = Math.floor(daysSinceStart / 7);
    const effectiveWeekIndex = weekIndex % program.weeks.length;
    const sortedWeeks = [...program.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const currentWeek = sortedWeeks[effectiveWeekIndex];

    if (currentWeek) {
      // Check overrides
      const overrides = await prisma.workoutScheduleOverride.findMany({
        where: { clientId, weekStartDate },
      });
      const movedHere = overrides.find((o) => o.newDay === todayWeekday && o.action === "moved");
      const originalToday = currentWeek.days.find((d) => d.dayLabel === todayWeekday);
      const movedAway = originalToday ? overrides.find((o) => o.workoutDayId === originalToday.id) : undefined;

      if (movedHere) {
        const movedDay = currentWeek.days.find((d) => d.id === movedHere.workoutDayId);
        todayWorkoutLabel = movedDay?.dayLabel ?? null;
      } else if (originalToday && !movedAway) {
        todayWorkoutLabel = originalToday.dayLabel;
      }
    }
  }

  return NextResponse.json({
    stats: {
      completedCount: completedSessions.length,
      streak,
      adherence,
      todayDone,
      todayWorkoutLabel,
      pendingCheckins,
    },
    recentSessions: recentSessions.slice(0, 5),
    personalRecords: recentPRs,
    hasActiveProgram: !!activeProgram,
    programName: activeProgram?.program.name ?? null,
  });
}
