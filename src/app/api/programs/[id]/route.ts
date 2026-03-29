import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const program = await prisma.program.findUnique({
    where: { id, trainerId: session.user.id!, deletedAt: null },
    include: {
      weeks: {
        orderBy: { weekNumber: "asc" },
        include: {
          days: {
            orderBy: { dayOrder: "asc" },
            include: {
              exercises: {
                orderBy: { sortOrder: "asc" },
                include: { exercise: true, substitutionExercise: true },
              },
            },
          },
        },
      },
      _count: { select: { clientPrograms: { where: { status: "active" } } } },
    },
  });
  if (!program) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ program });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const program = await prisma.program.update({ where: { id }, data: body });
  return NextResponse.json({ program });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const existing = await prisma.program.findUnique({ where: { id, trainerId: session.user.id!, deletedAt: null } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.program.update({ where: { id }, data: { deletedAt: new Date() } });
  return NextResponse.json({ success: true });
}

// POST to /api/programs/[id]/assign
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { clientId, startDate } = await req.json();

  const cp = await prisma.clientProgram.create({
    data: {
      clientId,
      programId: id,
      startDate,
      assignedBy: session.user.id!,
      status: "active",
    },
  });

  await prisma.notification.create({
    data: {
      recipientId: clientId,
      recipientRole: "client",
      type: "program_assigned",
      referenceId: id,
      referenceType: "Program",
      title: "New program assigned!",
      body: "Your trainer has assigned you a new workout program.",
    },
  });

  return NextResponse.json({ clientProgram: cp }, { status: 201 });
}
