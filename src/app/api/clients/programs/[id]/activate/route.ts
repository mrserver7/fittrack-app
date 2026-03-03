import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = session.user!.id!;
  const { id: clientProgramId } = await params;

  // Verify this ClientProgram belongs to this client
  const target = await prisma.clientProgram.findFirst({
    where: { id: clientProgramId, clientId },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Archive all other active programs for this client, activate the chosen one
  await prisma.$transaction([
    prisma.clientProgram.updateMany({
      where: { clientId, id: { not: clientProgramId }, status: "active" },
      data: { status: "archived" },
    }),
    prisma.clientProgram.update({
      where: { id: clientProgramId },
      data: { status: "active" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
