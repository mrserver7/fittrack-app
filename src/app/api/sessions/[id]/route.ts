import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const log = await prisma.sessionLog.findUnique({
    where: { id },
    include: {
      workoutDay: {
        include: {
          exercises: { orderBy: { sortOrder: "asc" }, include: { exercise: true, substitutionExercise: true } },
        },
      },
      sets: { include: { exercise: true }, orderBy: { setNumber: "asc" } },
      painFlags: true,
      client: true,
    },
  });
  if (!log) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ session: log });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const updated = await prisma.sessionLog.update({ where: { id }, data: body });
  return NextResponse.json({ session: updated });
}
