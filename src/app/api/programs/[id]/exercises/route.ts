import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

type ExerciseInput = {
  id?: string;
  exerciseId: string;
  sets: number;
  repsMin?: number | null;
  repsMax?: number | null;
  restSeconds: number;
  rpeMin?: number | null;
  rpeMax?: number | null;
  tempo?: string | null;
  coachingNote?: string | null;
};

type DayInput = {
  dayId: string;
  exercises: ExerciseInput[];
};

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const trainerId = session.user!.id!;

  const program = await prisma.program.findUnique({ where: { id, trainerId, deletedAt: null } });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { days }: { days: DayInput[] } = await req.json();

  for (const day of days) {
    const { dayId, exercises } = day;

    const existing = await prisma.workoutExercise.findMany({ where: { workoutDayId: dayId } });
    const existingIds = new Set(existing.map((e) => e.id));
    const submittedIds = new Set(exercises.filter((e) => e.id).map((e) => e.id!));

    // Delete exercises that were removed
    const toDelete = [...existingIds].filter((eid) => !submittedIds.has(eid));
    if (toDelete.length > 0) {
      await prisma.workoutExercise.deleteMany({ where: { id: { in: toDelete } } });
    }

    // Update existing or create new
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const data = {
        exerciseId: ex.exerciseId,
        sets: ex.sets || 3,
        repsMin: ex.repsMin ?? null,
        repsMax: ex.repsMax ?? null,
        restSeconds: ex.restSeconds || 60,
        rpeMin: ex.rpeMin ?? null,
        rpeMax: ex.rpeMax ?? null,
        tempo: ex.tempo || null,
        coachingNote: ex.coachingNote || null,
        sortOrder: i,
      };
      if (ex.id) {
        await prisma.workoutExercise.update({ where: { id: ex.id }, data });
      } else {
        await prisma.workoutExercise.create({ data: { workoutDayId: dayId, ...data } });
      }
    }
  }

  return NextResponse.json({ success: true });
}
