import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      entries: {
        include: { client: { select: { id: true, name: true, photoUrl: true } } },
        orderBy: { currentValue: "desc" },
      },
    },
  });
  if (!challenge) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ challenge });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge || challenge.trainerId !== session.user.id!)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.challenge.update({ where: { id }, data: body });
  return NextResponse.json({ challenge: updated });
}
