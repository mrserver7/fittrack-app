import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];

  if (role === "trainer") {
    const clientId = req.nextUrl.searchParams.get("clientId");
    const where = clientId ? { trainerId: userId, clientId } : { trainerId: userId };
    const habits = await prisma.habit.findMany({
      where,
      include: { logs: { where: { date: { gte: startDate } } }, client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ habits });
  }

  const habits = await prisma.habit.findMany({
    where: { clientId: userId, isActive: true },
    include: { logs: { where: { date: { gte: startDate } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ habits });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { clientId, name, icon, targetValue, unit } = await req.json();
  if (!clientId || !name) return NextResponse.json({ error: "clientId and name required" }, { status: 400 });

  const habit = await prisma.habit.create({
    data: { trainerId: session.user.id!, clientId, name, icon, targetValue, unit },
  });
  return NextResponse.json({ habit }, { status: 201 });
}
