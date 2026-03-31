import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? webSession?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      entries: {
        include: { client: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { currentValue: "desc" },
      },
    },
  });
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Auto-sync progress for volume/consistency challenges
  if (challenge.type !== "custom" && challenge.entries.length > 0) {
    const now = new Date().toISOString().split("T")[0];
    const clientIds = challenge.entries.map((e) => e.clientId);
    const sessions = await prisma.sessionLog.findMany({
      where: {
        clientId: { in: clientIds },
        status: "completed",
        scheduledDate: { gte: challenge.startDate, lte: challenge.endDate <= now ? challenge.endDate : now },
      },
      select: { clientId: true, totalVolumeKg: true },
    });

    const updateMap: Record<string, number> = {};
    for (const s of sessions) {
      if (!updateMap[s.clientId]) updateMap[s.clientId] = 0;
      if (challenge.type === "consistency") updateMap[s.clientId] += 1;
      else if (challenge.type === "volume") updateMap[s.clientId] += s.totalVolumeKg ?? 0;
    }

    await Promise.all(
      Object.entries(updateMap).map(([clientId, val]) =>
        prisma.challengeEntry.updateMany({
          where: { challengeId: id, clientId },
          data: { currentValue: Math.round(val * 10) / 10, updatedAt: new Date() },
        })
      )
    );

    const refreshed = await prisma.challenge.findUnique({
      where: { id },
      include: {
        entries: {
          include: { client: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { currentValue: "desc" },
        },
      },
    });
    return NextResponse.json({ challenge: refreshed });
  }

  return NextResponse.json({ challenge });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? webSession?.user?.id;
  const role = mobileUser?.role ?? (webSession?.user as Record<string, unknown>)?.role as string;
  if (!userId || role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge || challenge.trainerId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.challenge.update({ where: { id }, data: body });
  return NextResponse.json({ challenge: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? webSession?.user?.id;
  const role = mobileUser?.role ?? (webSession?.user as Record<string, unknown>)?.role as string;
  if (!userId || role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  await prisma.challengeEntry.deleteMany({ where: { challengeId: id } });
  await prisma.challenge.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
