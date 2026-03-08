import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const clientId = user.id;

  const [measurements, sessions, prs] = await Promise.all([
    prisma.measurement.findMany({
      where: { clientId },
      orderBy: { recordedDate: "asc" },
      take: 52,
    }),
    prisma.sessionLog.findMany({
      where: { clientId, status: "completed" },
      select: { scheduledDate: true, totalVolumeKg: true, durationMinutes: true },
      orderBy: { scheduledDate: "asc" },
      take: 60,
    }),
    prisma.personalRecord.findMany({
      where: { clientId },
      include: { exercise: { select: { name: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({ measurements, sessions, personalRecords: prs });
}
