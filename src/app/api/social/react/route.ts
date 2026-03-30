import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { postId, emoji } = await req.json();
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  const reaction = await prisma.socialReaction.upsert({
    where: { postId_clientId: { postId, clientId: session.user.id! } },
    create: { postId, clientId: session.user.id!, emoji: emoji || "\ud83d\udcaa" },
    update: { emoji: emoji || "\ud83d\udcaa" },
  });
  return NextResponse.json({ reaction });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  await prisma.socialReaction.deleteMany({
    where: { postId, clientId: session.user.id! },
  });
  return NextResponse.json({ success: true });
}
