import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ workoutDayId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;
  const { workoutDayId } = await params;

  const clientId = role === "client" ? userId : req.nextUrl.searchParams.get("clientId");
  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  // Find the most recent completed session for this workout day
  const lastSession = await prisma.sessionLog.findFirst({
    where: { clientId, workoutDayId, status: "completed" },
    orderBy: { completedAt: "desc" },
    include: {
      sets: {
        orderBy: [{ exerciseId: "asc" }, { setNumber: "asc" }],
        select: { exerciseId: true, setNumber: true, weightKg: true, repsActual: true, rpeActual: true },
      },
    },
  });

  if (!lastSession) return NextResponse.json({ exercises: {}, sessionDate: null });

  // Group sets by exerciseId
  const exercises: Record<string, { sets: { setNumber: number; weight: number | null; reps: number | null; rpe: number | null }[] }> = {};
  for (const set of lastSession.sets) {
    if (!exercises[set.exerciseId]) exercises[set.exerciseId] = { sets: [] };
    exercises[set.exerciseId].sets.push({
      setNumber: set.setNumber,
      weight: set.weightKg,
      reps: set.repsActual,
      rpe: set.rpeActual,
    });
  }

  return NextResponse.json({
    exercises,
    sessionDate: lastSession.completedAt?.toISOString() || null,
  });
}
