import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const userId = session.user.id!;

  const { habitId, date, value } = await req.json();
  if (!habitId || !date) return NextResponse.json({ error: "habitId and date required" }, { status: 400 });

  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.clientId !== userId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId, date } },
    create: { habitId, clientId: userId, date, value: value ?? 1 },
    update: { value: value ?? 1 },
  });
  return NextResponse.json({ log });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  const clientId = role === "client" ? userId : req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const startDate = req.nextUrl.searchParams.get("startDate") || new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0];
  const endDate = req.nextUrl.searchParams.get("endDate") || new Date().toISOString().split("T")[0];

  const logs = await prisma.habitLog.findMany({
    where: { clientId, date: { gte: startDate, lte: endDate } },
    include: { habit: { select: { name: true, icon: true, targetValue: true, unit: true } } },
    orderBy: { date: "desc" },
  });
  return NextResponse.json({ logs });
}
