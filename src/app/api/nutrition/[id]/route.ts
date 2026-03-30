import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const log = await prisma.nutritionLog.findUnique({ where: { id } });
  if (!log || log.clientId !== session.user.id!)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const updated = await prisma.nutritionLog.update({ where: { id }, data: body });
  return NextResponse.json({ log: updated });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const log = await prisma.nutritionLog.findUnique({ where: { id } });
  if (!log || log.clientId !== session.user.id!)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.nutritionLog.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
