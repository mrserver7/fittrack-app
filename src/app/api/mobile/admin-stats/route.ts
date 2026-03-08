import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || !user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    totalTrainers,
    totalClients,
    totalSessions,
    pendingClients,
    recentTrainers,
    recentClients,
  ] = await Promise.all([
    prisma.trainer.count({ where: { deletedAt: null, isAdmin: false } }),
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.sessionLog.count({ where: { status: "completed" } }),
    prisma.client.count({ where: { deletedAt: null, status: "pending" } }),
    prisma.trainer.findMany({
      where: { deletedAt: null, isAdmin: false },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        status: true,
        canApproveClients: true,
        createdAt: true,
        _count: { select: { clients: { where: { deletedAt: null } } } },
      },
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        trainer: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    stats: { totalTrainers, totalClients, totalSessions, pendingClients },
    trainers: recentTrainers.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      businessName: t.businessName,
      status: t.status,
      canApproveClients: t.canApproveClients,
      clientCount: t._count.clients,
      createdAt: t.createdAt,
    })),
    clients: recentClients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      trainerName: c.trainer?.name ?? null,
      createdAt: c.createdAt,
    })),
  });
}
