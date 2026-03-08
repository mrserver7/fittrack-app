import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const trainerId = user.id;
  const isAdmin = user.isAdmin;

  // Parse optional trainerId from body
  let body: { trainerId?: string } = {};
  try {
    body = await req.json();
  } catch { /* no body */ }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Admin can approve any; trainer with canApproveClients can approve any pending subscriber
  if (!isAdmin) {
    const trainerRecord = await prisma.trainer.findUnique({ where: { id: trainerId }, select: { canApproveClients: true } });
    if (!trainerRecord?.canApproveClients)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.client.update({
    where: { id },
    data: {
      status: "active",
      // Admin can reassign via body.trainerId; trainer always assigns to themselves
      trainerId: isAdmin && body.trainerId ? body.trainerId : isAdmin ? client.trainerId : trainerId,
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
