import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: clientId } = await params;
  const trainerId = user.id;

  const client = await prisma.client.findUnique({
    where: { id: clientId, trainerId, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      photoUrl: true,
      status: true,
      tags: true,
      createdAt: true,
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const weekStartDate = getWeekStart();

  const [totalSessions, recentSessions, activeProgram, overrides] = await Promise.all([
    prisma.sessionLog.count({
      where: { clientId, status: "completed" },
    }),
    prisma.sessionLog.findMany({
      where: { clientId },
      orderBy: { scheduledDate: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        scheduledDate: true,
        completedAt: true,
        durationMinutes: true,
        workoutDay: { select: { dayLabel: true } },
      },
    }),
    prisma.clientProgram.findFirst({
      where: { clientId, status: "active" },
      select: {
        id: true,
        startDate: true,
        program: { select: { id: true, name: true } },
      },
    }),
    prisma.workoutScheduleOverride.findMany({
      where: { clientId, weekStartDate },
      include: { workoutDay: { select: { dayLabel: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const lastSession = recentSessions.find((s) => s.status === "completed");

  return NextResponse.json({
    client,
    stats: {
      totalSessions,
      lastSessionDate: lastSession?.completedAt ?? lastSession?.scheduledDate ?? null,
    },
    activeProgram: activeProgram
      ? { id: activeProgram.program.id, name: activeProgram.program.name, startDate: activeProgram.startDate }
      : null,
    recentSessions,
    overrides: overrides.map((o) => ({
      id: o.id,
      action: o.action,
      originalDay: o.originalDay,
      newDay: o.newDay,
      workoutDayLabel: o.workoutDay.dayLabel,
      createdAt: o.createdAt,
    })),
  });
}
