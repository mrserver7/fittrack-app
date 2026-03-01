import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const role = (session.user! as Record<string, unknown>).role as string;

  if (role === "client" && session.user!.id !== id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findUnique({
    where: { id, deletedAt: null },
    include: {
      clientPrograms: {
        where: { status: "active" },
        include: { program: { include: { weeks: { include: { days: { include: { exercises: { include: { exercise: true } } } } } } } } },
        orderBy: { assignedAt: "desc" },
      },
      sessionLogs: { orderBy: { scheduledDate: "desc" }, take: 20 },
      measurements: { orderBy: { recordedDate: "desc" }, take: 12 },
      personalRecords: { include: { exercise: true }, orderBy: { recordedAt: "desc" }, take: 10 },
      goalMilestones: { orderBy: { sortOrder: "asc" } },
      _count: {
        select: {
          sessionLogs: { where: { status: "completed" } },
          messages: true,
        },
      },
    },
  });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "trainer" && client.trainerId !== session.user!.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({ client });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user! as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const body = await req.json();
  const client = await prisma.client.update({ where: { id }, data: body });

  await prisma.auditEvent.create({
    data: { actorId: session.user!.id!, actorRole: "trainer", action: "client.updated", resourceType: "Client", resourceId: id },
  });

  return NextResponse.json({ client });
}
