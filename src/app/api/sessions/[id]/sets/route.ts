import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: sessionLogId } = await params;
  const body = await req.json();

  const setLog = await prisma.setLog.create({
    data: {
      sessionLogId,
      exerciseId: body.exerciseId,
      workoutExerciseId: body.workoutExerciseId,
      setNumber: body.setNumber,
      weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
      repsActual: body.repsActual ? parseInt(body.repsActual) : null,
      rpeActual: body.rpeActual ? parseFloat(body.rpeActual) : null,
      notes: body.notes,
      isSubstituted: body.isSubstituted || false,
    },
  });

  // Auto-detect PR
  if (body.weightKg) {
    const clientId = body.clientId;
    const exerciseId = body.exerciseId;
    const weightKg = parseFloat(body.weightKg);

    if (clientId && exerciseId) {
      const existingPr = await prisma.personalRecord.findFirst({
        where: { clientId, exerciseId },
        orderBy: { valueKg: "desc" },
      });
      if (!existingPr || weightKg > existingPr.valueKg) {
        await prisma.personalRecord.create({
          data: {
            clientId,
            exerciseId,
            valueKg: weightKg,
            repsAtPr: body.repsActual ? parseInt(body.repsActual) : null,
            setLogId: setLog.id,
            recordedAt: new Date().toISOString().split("T")[0],
            previousPrKg: existingPr?.valueKg ?? null,
          },
        });
      }
    }
  }

  return NextResponse.json({ set: setLog }, { status: 201 });
}
