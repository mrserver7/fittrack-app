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
  dayId?: string;    // undefined = new day to create
  weekId?: string;   // required when dayId is undefined
  dayLabel?: string; // required when dayId is undefined
  exercises: ExerciseInput[];
};

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const trainerId = session.user!.id!;

  const program = await prisma.program.findUnique({
    where: { id, trainerId, deletedAt: null },
    include: { weeks: { include: { days: true } } },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { days, keptDayIds }: { days: DayInput[]; keptDayIds?: string[] } = await req.json();

  // Delete days that were removed by the trainer (only if they have no session logs)
  if (keptDayIds) {
    const allExistingDayIds = program.weeks.flatMap((w) => w.days.map((d) => d.id));
    const removedDayIds = allExistingDayIds.filter((dayId) => !keptDayIds.includes(dayId));
    for (const dayId of removedDayIds) {
      const hasLogs = await prisma.sessionLog.count({ where: { workoutDayId: dayId } });
      if (hasLogs === 0) {
        await prisma.workoutDay.delete({ where: { id: dayId } });
      }
    }
  }

  for (const day of days) {
    let resolvedDayId = day.dayId;

    // Create new day if no dayId
    if (!resolvedDayId) {
      if (!day.weekId || !day.dayLabel) continue;
      const newDay = await prisma.workoutDay.create({
        data: {
          programWeekId: day.weekId,
          dayLabel: day.dayLabel,
          dayOrder: 99, // will be re-ordered naturally
        },
      });
      resolvedDayId = newDay.id;
    } else if (day.dayId && day.dayLabel) {
      await prisma.workoutDay.update({ where: { id: resolvedDayId }, data: { dayLabel: day.dayLabel } });
    }

    const { exercises } = day;

    const existing = await prisma.workoutExercise.findMany({ where: { workoutDayId: resolvedDayId } });
    const existingIds = new Set(existing.map((e) => e.id));
    const submittedIds = new Set(exercises.filter((e) => e.id).map((e) => e.id!));

    // Delete removed exercises
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
        await prisma.workoutExercise.create({ data: { workoutDayId: resolvedDayId, ...data } });
      }
    }
  }

  return NextResponse.json({ success: true });
}
