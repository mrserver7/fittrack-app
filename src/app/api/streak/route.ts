import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  if (role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const streak = await prisma.workoutStreak.upsert({
    where: { clientId: session.user.id! },
    create: { clientId: session.user.id! },
    update: {},
  });
  return NextResponse.json({ streak });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { clientId } = await req.json();
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];

  const streak = await prisma.workoutStreak.upsert({
    where: { clientId },
    create: { clientId, currentStreak: 1, longestStreak: 1, lastWorkoutDate: today },
    update: {},
  });

  if (streak.lastWorkoutDate === today) {
    return NextResponse.json({ streak });
  }

  const lastDate = streak.lastWorkoutDate ? new Date(streak.lastWorkoutDate) : null;
  const todayDate = new Date(today);
  const daysSinceLast = lastDate
    ? Math.floor((todayDate.getTime() - lastDate.getTime()) / 86400000)
    : 999;

  let newStreak: number;
  if (daysSinceLast <= 7) {
    newStreak = streak.currentStreak + 1;
  } else if (daysSinceLast <= 14 && streak.freezesUsed < streak.freezesAllowed) {
    newStreak = streak.currentStreak + 1;
    await prisma.workoutStreak.update({
      where: { clientId },
      data: { freezesUsed: streak.freezesUsed + 1 },
    });
  } else {
    newStreak = 1;
  }

  const updated = await prisma.workoutStreak.update({
    where: { clientId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastWorkoutDate: today,
    },
  });

  return NextResponse.json({ streak: updated });
}
