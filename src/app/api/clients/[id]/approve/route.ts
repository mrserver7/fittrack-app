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

  // Parse optional trainerId from body
  let body: { trainerId?: string } = {};
  try {
    body = await req.json();
  } catch { /* no body */ }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Trainer can only approve their own clients; admin can approve any
  if (!isAdmin && client.trainerId !== trainerId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.client.update({
    where: { id },
    data: {
      status: "active",
      ...(body.trainerId ? { trainerId: body.trainerId } : {}),
    },
  });

  // Notify the subscriber
  await prisma.notification.create({
    data: {
      recipientId: id,
      recipientRole: "client",
      type: "account_approved",
      title: "Your account has been approved!",
      body: "You can now sign in to FitTrack and start your fitness journey.",
    },
  });

  return NextResponse.json({ client: updated });
}
