import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
    include: { checkInForm: true },
  });
  if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ checkIn });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const trainerId = session.user!.id!;
  const { trainerComment } = await req.json();

  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
    include: { client: { select: { trainerId: true } } },
  });
  if (!checkIn || checkIn.client.trainerId !== trainerId)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.checkIn.update({
    where: { id },
    data: { trainerComment, trainerRespondedAt: new Date() },
  });

  return NextResponse.json({ checkIn: updated });
}
