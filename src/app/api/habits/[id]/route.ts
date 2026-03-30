import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.trainerId !== session.user.id!)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.habit.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      icon: body.icon ?? undefined,
      targetValue: body.targetValue ?? undefined,
      unit: body.unit ?? undefined,
      isActive: body.isActive ?? undefined,
    },
  });
  return NextResponse.json({ habit: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.trainerId !== session.user.id!)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.habit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
