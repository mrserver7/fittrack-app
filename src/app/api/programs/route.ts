import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const programs = await prisma.program.findMany({
    where: { trainerId: user.id, deletedAt: null },
    include: {
      weeks: { include: { days: { include: { exercises: { include: { exercise: true } } } } } },
      _count: { select: { clientPrograms: { where: { status: "active" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ programs });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, durationWeeks, goalTag, weeks } = body;

  if (!name?.trim()) return NextResponse.json({ error: "Program name is required." }, { status: 400 });

  // Validate at least one exercise
  const hasExercise = Array.isArray(weeks) && weeks.some((w: Record<string, unknown>) => {
    const days = w.days as { exercises?: { exerciseId?: string }[] }[] | undefined;
    return days?.some((d) => d.exercises?.some((ex) => ex.exerciseId));
  });
  if (!hasExercise) return NextResponse.json({ error: "Program must have at least one exercise." }, { status: 400 });

  const program = await prisma.program.create({
    data: {
      trainerId: user.id,
      name,
      description,
      durationWeeks: durationWeeks || 4,
      goalTag,
      weeks: weeks
        ? {
            create: weeks.map((w: { weekNumber: number; isDeload?: boolean; days?: { dayLabel: string; dayOrder: number; exercises?: Record<string, unknown>[] }[] }) => ({
              weekNumber: w.weekNumber,
              isDeload: w.isDeload || false,
              days: w.days
                ? {
                    create: w.days.map((d) => ({
                      dayLabel: d.dayLabel,
                      dayOrder: d.dayOrder,
                      exercises: d.exercises
                        ? {
                            create: d.exercises.map((ex, idx) => ({
                              exerciseId: ex.exerciseId,
                              sortOrder: idx,
                              sets: ex.sets || 3,
                              repsMin: ex.repsMin,
                              repsMax: ex.repsMax,
                              tempo: ex.tempo,
                              restSeconds: ex.restSeconds || 60,
                              rpeMin: ex.rpeMin,
                              rpeMax: ex.rpeMax,
                              coachingNote: ex.coachingNote,
                            })),
                          }
                        : undefined,
                    })),
                  }
                : undefined,
            })),
          }
        : undefined,
    },
    include: {
      weeks: { include: { days: { include: { exercises: { include: { exercise: true } } } } } },
    },
  });
  return NextResponse.json({ program }, { status: 201 });
}
