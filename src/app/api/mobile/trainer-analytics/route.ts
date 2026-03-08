import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const trainerId = user.id;

  const now = new Date();
  const twelveWeeksAgo = new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000);

  const [weeklySessionCounts, topExercises, clientAdherence, totalStats] = await Promise.all([
    // Sessions per week for last 12 weeks
    prisma.sessionLog.findMany({
      where: {
        client: { trainerId },
        status: "completed",
        scheduledDate: { gte: twelveWeeksAgo.toISOString().split("T")[0] },
      },
      select: { scheduledDate: true },
      orderBy: { scheduledDate: "asc" },
    }),
    // Top exercises by set count
    prisma.setLog.groupBy({
      by: ["exerciseId"],
      where: {
        sessionLog: { client: { trainerId }, status: "completed" },
      },
      _count: { _all: true },
      orderBy: { _count: { exerciseId: "desc" } },
      take: 5,
    }),
    // Per-client session counts
    prisma.client.findMany({
      where: { trainerId, deletedAt: null, status: "active" },
      select: {
        id: true,
        name: true,
        _count: { select: { sessionLogs: { where: { status: "completed" } } } },
        sessionLogs: {
          where: {
            status: "completed",
            scheduledDate: { gte: twelveWeeksAgo.toISOString().split("T")[0] },
          },
          select: { scheduledDate: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    // Total counts
    prisma.sessionLog.count({
      where: { client: { trainerId }, status: "completed" },
    }),
  ]);

  // Group sessions by week
  const weekMap: Record<string, number> = {};
  weeklySessionCounts.forEach((s) => {
    const d = new Date(s.scheduledDate);
    const mon = new Date(d);
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const key = mon.toISOString().split("T")[0];
    weekMap[key] = (weekMap[key] ?? 0) + 1;
  });
  const weeklyData = Object.entries(weekMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  // Resolve exercise names
  const exerciseIds = topExercises.map((e) => e.exerciseId);
  const exercises = await prisma.exercise.findMany({
    where: { id: { in: exerciseIds } },
    select: { id: true, name: true },
  });
  const exMap = Object.fromEntries(exercises.map((e) => [e.id, e.name]));
  const topExercisesNamed = topExercises.map((e) => ({
    name: exMap[e.exerciseId] ?? "Unknown",
    count: e._count._all,
  }));

  return NextResponse.json({
    totalSessions: totalStats,
    weeklyData,
    topExercises: topExercisesNamed,
    clientAdherence: clientAdherence.map((c) => ({
      name: c.name,
      total: c._count.sessionLogs,
      recent: c.sessionLogs.length,
    })),
  });
}
