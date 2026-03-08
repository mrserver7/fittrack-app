import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainerId = user.id;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";

  const clients = await prisma.client.findMany({
    where: {
      trainerId,
      deletedAt: null,
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      ...(status ? { status } : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      photoUrl: true,
      status: true,
      tags: true,
      createdAt: true,
      sessionLogs: {
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { scheduledDate: true, completedAt: true },
      },
      _count: { select: { sessionLogs: { where: { status: "completed" } } } },
      clientPrograms: {
        where: { status: "active" },
        select: { program: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      photoUrl: c.photoUrl,
      status: c.status,
      tags: c.tags,
      sessionsCount: c._count.sessionLogs,
      lastSession: c.sessionLogs[0]?.scheduledDate ?? null,
      programName: c.clientPrograms[0]?.program.name ?? null,
    })),
  });
}
