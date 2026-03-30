import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  if (role === "trainer") {
    const challenges = await prisma.challenge.findMany({
      where: { trainerId: userId },
      include: { entries: { include: { client: { select: { id: true, name: true, photoUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ challenges });
  }

  // Client: get challenges they're part of
  const entries = await prisma.challengeEntry.findMany({
    where: { clientId: userId },
    include: {
      challenge: {
        include: { entries: { include: { client: { select: { id: true, name: true } } }, orderBy: { currentValue: "desc" } } },
      },
    },
  });
  const challenges = entries.map(e => e.challenge);
  return NextResponse.json({ challenges });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, type, targetValue, unit, startDate, endDate, clientIds } = await req.json();
  if (!title || !startDate || !endDate)
    return NextResponse.json({ error: "title, startDate, endDate required" }, { status: 400 });

  const challenge = await prisma.challenge.create({
    data: {
      trainerId: session.user.id!,
      title,
      description,
      type: type || "volume",
      targetValue,
      unit,
      startDate,
      endDate,
      entries: {
        create: (clientIds || []).map((cId: string) => ({ clientId: cId })),
      },
    },
    include: { entries: true },
  });
  return NextResponse.json({ challenge }, { status: 201 });
}
