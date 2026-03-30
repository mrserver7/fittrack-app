import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  const clientId = role === "client" ? userId : req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  const days = parseInt(req.nextUrl.searchParams.get("days") || "7");
  const since = new Date();
  since.setDate(since.getDate() - days);

  const setLogs = await prisma.setLog.findMany({
    where: {
      sessionLog: { clientId, status: "completed", completedAt: { gte: since } },
    },
    include: {
      exercise: { select: { primaryMuscles: true } },
    },
  });

  const muscles: Record<string, { sets: number; volume: number }> = {};

  for (const log of setLogs) {
    const muscleStr = log.exercise.primaryMuscles;
    if (!muscleStr) continue;

    const muscleList = muscleStr.split(",").map((m: string) => m.trim().toLowerCase());
    const volume = (log.weightKg || 0) * (log.repsActual || 0);

    for (const muscle of muscleList) {
      if (!muscles[muscle]) muscles[muscle] = { sets: 0, volume: 0 };
      muscles[muscle].sets += 1;
      muscles[muscle].volume += volume;
    }
  }

  return NextResponse.json({ muscles, period: days });
}
