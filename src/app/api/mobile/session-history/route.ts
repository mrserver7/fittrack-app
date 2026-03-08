import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const clientId = user.id;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 20;

  const sessions = await prisma.sessionLog.findMany({
    where: { clientId, status: "completed" },
    orderBy: { scheduledDate: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      scheduledDate: true,
      completedAt: true,
      durationMinutes: true,
      totalVolumeKg: true,
      overallFeedbackEmoji: true,
      workoutDay: { select: { dayLabel: true } },
      _count: { select: { sets: true } },
    },
  });

  const hasMore = sessions.length > limit;
  const data = hasMore ? sessions.slice(0, limit) : sessions;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({
    sessions: data.map((s) => ({
      id: s.id,
      scheduledDate: s.scheduledDate,
      completedAt: s.completedAt,
      durationMinutes: s.durationMinutes,
      totalVolumeKg: s.totalVolumeKg,
      overallFeedbackEmoji: s.overallFeedbackEmoji,
      dayLabel: s.workoutDay?.dayLabel ?? "Workout",
      setsCount: s._count.sets,
    })),
    nextCursor,
  });
}
