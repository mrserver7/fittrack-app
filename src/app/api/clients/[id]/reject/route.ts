import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const trainerId = session.user!.id!;
  const isAdmin = (session.user as Record<string, unknown>).isAdmin as boolean;

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!isAdmin && client.trainerId !== trainerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Soft-delete the rejected subscriber
  await prisma.client.update({
    where: { id },
    data: { status: "archived", deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
