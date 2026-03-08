import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "client") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const session = await prisma.sessionLog.findUnique({
    where: { id, clientId: user.id },
    include: {
      workoutDay: { select: { dayLabel: true } },
      sets: {
        orderBy: [{ workoutExerciseId: "asc" }, { setNumber: "asc" }],
        include: {
          exercise: { select: { id: true, name: true, category: true, primaryMuscles: true } },
        },
      },
    },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Group sets by exercise
  const exerciseMap = new Map<string, { exercise: { id: string; name: string; category: string; primaryMuscles: string | null }; sets: { setNumber: number; weightKg: number | null; repsActual: number | null; rpeActual: number | null }[] }>();
  for (const set of session.sets) {
    const key = set.exerciseId;
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, {
        exercise: set.exercise,
        sets: [],
      });
    }
    exerciseMap.get(key)!.sets.push({
      setNumber: set.setNumber,
      weightKg: set.weightKg,
      repsActual: set.repsActual,
      rpeActual: set.rpeActual,
    });
  }

  return NextResponse.json({
    session: {
      id: session.id,
      scheduledDate: session.scheduledDate,
      completedAt: session.completedAt,
      durationMinutes: session.durationMinutes,
      totalVolumeKg: session.totalVolumeKg,
      overallFeedbackEmoji: session.overallFeedbackEmoji,
      overallFeedbackText: session.overallFeedbackText,
      notes: session.notes,
      dayLabel: session.workoutDay?.dayLabel ?? "Workout",
    },
    exercises: Array.from(exerciseMap.values()),
  });
}
