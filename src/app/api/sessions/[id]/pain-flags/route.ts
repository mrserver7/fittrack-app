import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: sessionLogId } = await params;
  const body = await req.json();

  const sessionLog = await prisma.sessionLog.findUnique({ where: { id: sessionLogId }, include: { client: true } });
  if (!sessionLog) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const flag = await prisma.painFlag.create({
    data: {
      sessionLogId,
      clientId: sessionLog.clientId,
      bodyRegion: body.bodyRegion,
      severity: body.severity,
      notes: body.notes,
    },
  });

  // Notify trainer if severity >= 3
  if (body.severity >= 3) {
    await prisma.notification.create({
      data: {
        recipientId: sessionLog.client.trainerId,
        recipientRole: "trainer",
        type: "pain_flag",
        referenceId: sessionLogId,
        referenceType: "SessionLog",
        title: `⚠️ ${sessionLog.client.name} — Pain flag: ${body.bodyRegion}`,
        body: `Severity ${body.severity}/5 reported during session.`,
      },
    });
  }

  // Get substitution suggestions
  let suggestions: { id: string; name: string }[] = [];
  if (body.severity >= 3 && body.bodyRegion) {
    suggestions = await prisma.exercise.findMany({
      where: {
        deletedAt: null,
        bodyRegions: { not: { contains: body.bodyRegion.toLowerCase() } },
        OR: [{ isGlobal: true }, { trainerId: sessionLog.client.trainerId }],
      },
      select: { id: true, name: true },
      take: 5,
    });
  }

  return NextResponse.json({ flag, suggestions }, { status: 201 });
}
