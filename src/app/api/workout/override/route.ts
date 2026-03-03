import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WEEKDAYS, getWeekStart } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = session.user!.id!;
  const body = await req.json();
  const { workoutDayId, action, originalDay, newDay, weekStartDate } = body as {
    workoutDayId: string;
    action: string;
    originalDay: string;
    newDay?: string;
    weekStartDate: string;
  };

  if (!workoutDayId || !action || !originalDay || !weekStartDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (action !== "skipped" && action !== "moved") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get client's active program to validate workoutDayId belongs to it
  const client = await prisma.client.findUnique({
    where: { id: clientId, deletedAt: null },
    include: {
      clientPrograms: {
        where: { status: "active" },
        include: {
          program: {
            include: {
              weeks: { include: { days: true } },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const activeProgram = client.clientPrograms[0];
  if (!activeProgram) return NextResponse.json({ error: "No active program" }, { status: 400 });

  const allDayIds = activeProgram.program.weeks.flatMap((w) => w.days.map((d) => d.id));
  if (!allDayIds.includes(workoutDayId)) {
    return NextResponse.json({ error: "Workout day not in active program" }, { status: 400 });
  }

  if (action === "moved") {
    if (!newDay || !WEEKDAYS.includes(newDay)) {
      return NextResponse.json({ error: "Invalid newDay" }, { status: 400 });
    }

    // Compute current week's program days
    const startDate = new Date(activeProgram.startDate);
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysSinceStart / 7);
    const effectiveWeekIndex = weekIndex % activeProgram.program.weeks.length;
    const sortedWeeks = [...activeProgram.program.weeks].sort((a, b) => a.weekNumber - b.weekNumber);
    const currentWeekDays = sortedWeeks[effectiveWeekIndex]?.days ?? [];

    // Check newDay is not already occupied by a program day
    const programDayLabels = new Set(currentWeekDays.map((d) => d.dayLabel));
    if (programDayLabels.has(newDay)) {
      return NextResponse.json({ error: "That day already has a workout" }, { status: 400 });
    }

    // Check newDay is not already targeted by another override this week
    const existingOverrideTarget = await prisma.workoutScheduleOverride.findFirst({
      where: { clientId, weekStartDate, newDay, action: "moved" },
    });
    if (existingOverrideTarget) {
      return NextResponse.json({ error: "That day already has a moved workout" }, { status: 400 });
    }

    // Check newDay is not in the past within the current week
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(weekStartDate);
    const newDayIndex = WEEKDAYS.indexOf(newDay); // 0=Sun
    // Days from Monday: Sun=6 offset, Mon=0, Tue=1, etc.
    const daysFromMonday = newDayIndex === 0 ? 6 : newDayIndex - 1;
    const newDayDate = new Date(weekStart);
    newDayDate.setDate(weekStart.getDate() + daysFromMonday);
    if (newDayDate < today) {
      return NextResponse.json({ error: "Cannot move to a past day" }, { status: 400 });
    }
  }

  // Upsert the override (one per client + workoutDayId + weekStartDate)
  const existing = await prisma.workoutScheduleOverride.findFirst({
    where: { clientId, workoutDayId, weekStartDate },
  });

  let override;
  if (existing) {
    override = await prisma.workoutScheduleOverride.update({
      where: { id: existing.id },
      data: { action, newDay: newDay ?? null },
    });
  } else {
    override = await prisma.workoutScheduleOverride.create({
      data: { clientId, workoutDayId, weekStartDate, action, originalDay, newDay: newDay ?? null },
    });
  }

  // Notify trainer
  if (client.trainerId) {
    const actionLabel = action === "skipped" ? "skipped" : "moved";
    const title = action === "skipped"
      ? `${client.name} skipped their workout`
      : `${client.name} moved their workout`;
    const body2 = action === "skipped"
      ? `Skipped ${originalDay} workout`
      : `Moved ${originalDay} workout → ${newDay}`;

    await prisma.notification.create({
      data: {
        recipientId: client.trainerId,
        recipientRole: "trainer",
        type: "workout_rescheduled",
        referenceId: override.id,
        referenceType: "WorkoutScheduleOverride",
        title,
        body: body2,
      },
    });
    void actionLabel; // suppress unused warning
  }

  return NextResponse.json({ success: true, override });
}
