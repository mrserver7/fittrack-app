import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || !(session.user as Record<string, unknown>).isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const trainer = await prisma.trainer.update({
    where: { id },
    data: { status: "active" },
    select: { id: true, name: true, status: true },
  });
  return NextResponse.json({ trainer });
}
