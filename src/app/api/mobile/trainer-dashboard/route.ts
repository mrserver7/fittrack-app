import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainerId = user.id;

  const [
    totalClients,
    pendingClients,
    recentSessions,
    unreadNotifications,
    activeClients,
  ] = await Promise.all([
    prisma.client.count({ where: { trainerId, deletedAt: null, status: "active" } }),
    prisma.client.count({ where: { trainerId, deletedAt: null, status: "pending" } }),
    prisma.sessionLog.findMany({
      where: {
        client: { trainerId },
        status: "completed",
      },
      include: {
        client: { select: { id: true, name: true, photoUrl: true } },
        workoutDay: { select: { dayLabel: true } },
      },
      orderBy: { completedAt: "desc" },
      take: 8,
    }),
    prisma.notification.count({
      where: { recipientId: trainerId, recipientRole: "trainer", isRead: false },
    }),
    prisma.client.findMany({
      where: { trainerId, deletedAt: null, status: "active" },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        sessionLogs: {
          where: { status: "completed" },
          orderBy: { completedAt: "desc" },
          take: 1,
          select: { completedAt: true, scheduledDate: true },
        },
        _count: { select: { sessionLogs: { where: { status: "completed" } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Sessions this week
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const sessionsThisWeek = recentSessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= weekStart
  ).length;

  return NextResponse.json({
    stats: {
      totalClients,
      pendingClients,
      sessionsThisWeek,
      unreadNotifications,
    },
    recentSessions: recentSessions.slice(0, 5).map((s) => ({
      id: s.id,
      clientName: s.client.name,
      clientPhotoUrl: s.client.photoUrl,
      workoutLabel: s.workoutDay?.dayLabel ?? "Workout",
      completedAt: s.completedAt,
    })),
    activeClients: activeClients.map((c) => ({
      id: c.id,
      name: c.name,
      photoUrl: c.photoUrl,
      sessionsCount: c._count.sessionLogs,
      lastSession: c.sessionLogs[0]?.scheduledDate ?? null,
    })),
  });
}
