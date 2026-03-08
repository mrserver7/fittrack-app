import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { WEEKDAYS, getWeekStart } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clientId = user.id;
  const { searchParams } = new URL(req.url);
  const redo = searchParams.get("redo") === "1";

  const todayDate = new Date();
  const todayWeekday = WEEKDAYS[todayDate.getDay()];
  const todayStr = todayDate.toISOString().split("T")[0];
  const weekStartDate = getWeekStart(todayDate);

  // Load active program
  const client = await prisma.client.findUnique({
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
                  days: {
                    orderBy: { dayOrder: "asc" },
                    include: {
                      exercises: {
                        orderBy: { sortOrder: "asc" },
                        include: { exercise: true, substitutionExercise: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 1,
      },
    },
  });

  const activeProgram = client?.clientPrograms[0];
  if (!activeProgram) {
    return NextResponse.json({ status: "no_program" });
  }

  const program = activeProgram.program;
  if (program.weeks.flatMap((w) => w.days).length === 0) {
    return NextResponse.json({ status: "empty_program", programName: program.name });
  }

  // Compute effective week
  const startDate = new Date(activeProgram.assignedAt);
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / 86400000);
  const weekIndex = Math.floor(daysSinceStart / 7);
  const effectiveWeekIndex = weekIndex % program.weeks.length;
  const sortedWeeks = [...program.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
  const currentWeek = sortedWeeks[effectiveWeekIndex];

  // Load overrides
  const overrides = await prisma.workoutScheduleOverride.findMany({
    where: { clientId, weekStartDate },
  });

  // Determine today's workout day
  const movedHere = overrides.find((o) => o.newDay === todayWeekday && o.action === "moved");
  const originalToday = currentWeek.days.find((d) => d.dayLabel === todayWeekday);
  const movedAway = originalToday ? overrides.find((o) => o.workoutDayId === originalToday.id) : undefined;

  let workoutDay = null;
  if (movedHere) {
    workoutDay = currentWeek.days.find((d) => d.id === movedHere.workoutDayId) ?? null;
  } else if (originalToday && !movedAway) {
    workoutDay = originalToday;
  }

  if (!workoutDay) {
    // Compute available days for move option
    const usedDays = new Set([
      ...currentWeek.days.map((d) => d.dayLabel),
      ...overrides.filter((o) => o.newDay).map((o) => o.newDay!),
    ]);
    const todayIndex = WEEKDAYS.indexOf(todayWeekday as (typeof WEEKDAYS)[number]);
    const availableDays = WEEKDAYS.filter((d, i) => {
      if (usedDays.has(d)) return false;
      if (i <= todayIndex) return false; // can't move to past or today
      return true;
    });
    return NextResponse.json({
      status: "rest_day",
      todayWeekday,
      availableDays,
    });
  }

  // Check if already completed
  const existingSession = !redo
    ? await prisma.sessionLog.findFirst({
        where: { clientId, workoutDayId: workoutDay.id, status: "completed", scheduledDate: todayStr },
      })
    : null;

  if (existingSession) {
    return NextResponse.json({
      status: "completed",
      sessionId: existingSession.id,
      workoutDay: { id: workoutDay.id, dayLabel: workoutDay.dayLabel },
    });
  }

  // Compute available days for options component
  const usedDays = new Set([
    ...currentWeek.days.map((d) => d.dayLabel),
    ...overrides.filter((o) => o.newDay).map((o) => o.newDay!),
  ]);
  const todayIndex = WEEKDAYS.indexOf(todayWeekday as (typeof WEEKDAYS)[number]);
  const availableDays = WEEKDAYS.filter((d, i) => {
    if (usedDays.has(d)) return false;
    if (i <= todayIndex) return false;
    return true;
  });

  return NextResponse.json({
    status: "workout",
    todayWeekday,
    weekStartDate,
    clientProgramId: activeProgram.id,
    workoutDay: {
      id: workoutDay.id,
      dayLabel: workoutDay.dayLabel,
      exercises: workoutDay.exercises,
    },
    availableDays,
  });
}
