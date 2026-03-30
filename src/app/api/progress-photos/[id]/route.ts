import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;
  const { id } = await params;

  const photo = await prisma.progressPhoto.findUnique({ where: { id } });
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (role === "client") {
    if (photo.clientId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else if (role === "trainer") {
    const client = await prisma.client.findUnique({ where: { id: photo.clientId, deletedAt: null } });
    if (!client || client.trainerId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.progressPhoto.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
