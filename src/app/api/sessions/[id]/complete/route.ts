import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { computeReadinessScore } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.sessionLog.findUnique({
    where: { id },
    include: { client: true, sets: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const readinessScore =
    body.readinessSleep && body.readinessSoreness && body.readinessMotivation
      ? computeReadinessScore(body.readinessSleep, body.readinessSoreness, body.readinessMotivation)
      : null;

  const totalVolumeKg = existing.sets.reduce((sum, s) => {
    if (s.weightKg && s.repsActual) return sum + s.weightKg * s.repsActual;
    return sum;
  }, 0);

  const avgRpe =
    existing.sets.filter((s) => s.rpeActual).length > 0
      ? existing.sets.reduce((sum, s) => sum + (s.rpeActual || 0), 0) / existing.sets.filter((s) => s.rpeActual).length
      : null;

  const completedAt = new Date();
  const durationMinutes = existing.startedAt
    ? Math.round((completedAt.getTime() - existing.startedAt.getTime()) / 60000)
    : null;

  const updated = await prisma.sessionLog.update({
    where: { id },
    data: {
      status: "completed",
      completedAt,
      durationMinutes,
      totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
      avgRpe: avgRpe ? Math.round(avgRpe * 10) / 10 : null,
      readinessSleep: body.readinessSleep,
      readinessSoreness: body.readinessSoreness,
      readinessMotivation: body.readinessMotivation,
      readinessScore,
      overallFeedbackEmoji: body.overallFeedbackEmoji,
      overallFeedbackText: body.overallFeedbackText,
      notes: body.notes,
    },
  });

  // Notify trainer
  await prisma.notification.create({
    data: {
      recipientId: existing.client.trainerId,
      recipientRole: "trainer",
      type: "session_completed",
      referenceId: id,
      referenceType: "SessionLog",
      title: `${existing.client.name} completed a workout`,
      body: body.overallFeedbackEmoji
        ? `Feedback: ${body.overallFeedbackEmoji} ${body.overallFeedbackText || ""}`
        : "Session complete.",
    },
  });

  return NextResponse.json({ session: updated });
}
