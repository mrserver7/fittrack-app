import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

export async function GET(req: NextRequest) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? webSession?.user?.id;
  const role = mobileUser?.role ?? (webSession?.user as Record<string, unknown>)?.role as string;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (role === "trainer") {
    const challenges = await prisma.challenge.findMany({
      where: { trainerId: userId },
      include: {
        entries: {
          include: { client: { select: { id: true, name: true, photoUrl: true } } },
          orderBy: { currentValue: "desc" },
        },
        _count: { select: { entries: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ challenges });
  }

  // Client: enrolled challenges + available ones not yet joined
  const [enrolled, available] = await Promise.all([
    prisma.challengeEntry.findMany({
      where: { clientId: userId },
      include: {
        challenge: {
          include: {
            entries: { orderBy: { currentValue: "desc" }, select: { clientId: true, currentValue: true } },
            _count: { select: { entries: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.challenge.findMany({
      where: {
        isActive: true,
        endDate: { gte: new Date().toISOString().split("T")[0] },
        entries: { none: { clientId: userId } },
      },
      include: { _count: { select: { entries: true } } },
      orderBy: { startDate: "asc" },
    }),
  ]);
  return NextResponse.json({ enrolled, available });
}

export async function POST(req: NextRequest) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? webSession?.user?.id;
  const role = mobileUser?.role ?? (webSession?.user as Record<string, unknown>)?.role as string;
  if (!userId || role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, type, targetValue, unit, startDate, endDate, clientIds, enrollAll } = await req.json();
  if (!title || !startDate || !endDate)
    return NextResponse.json({ error: "title, startDate, endDate required" }, { status: 400 });

  let idsToEnroll: string[] = clientIds ?? [];
  if (enrollAll) {
    const all = await prisma.client.findMany({
      where: { trainerId: userId, status: "active", deletedAt: null },
      select: { id: true },
    });
    idsToEnroll = all.map((c) => c.id);
  }

  const challenge = await prisma.challenge.create({
    data: {
      trainerId: userId,
      title,
      description,
      type: type || "volume",
      targetValue,
      unit,
      startDate,
      endDate,
      entries: { create: idsToEnroll.map((cId) => ({ clientId: cId })) },
    },
    include: { entries: true },
  });

  if (idsToEnroll.length > 0) {
    const clients = await prisma.client.findMany({
      where: { id: { in: idsToEnroll } },
      select: { id: true, pushToken: true },
    });
    await Promise.all([
      prisma.notification.createMany({
        data: clients.map((c) => ({
          recipientId: c.id,
          recipientRole: "client",
          type: "challenge_started",
          referenceId: challenge.id,
          referenceType: "Challenge",
          title: `🏆 New challenge: ${title}`,
          body: description || "You've been enrolled. Let's go!",
        })),
      }),
      ...clients.filter((c) => c.pushToken).map((c) =>
        sendPush(c.pushToken, `🏆 New Challenge: ${title}`, description || "You've been enrolled!", { screen: "challenges" })
      ),
    ]);
  }

  return NextResponse.json({ challenge }, { status: 201 });
}
