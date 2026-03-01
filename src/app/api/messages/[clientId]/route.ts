import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const role = (session.user! as Record<string, unknown>).role as string;

  if (role === "client" && session.user!.id !== clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (role === "trainer" && client.trainerId !== session.user!.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const messages = await prisma.message.findMany({
    where: { clientId, trainerId: client.trainerId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      clientId,
      trainerId: client.trainerId,
      senderRole: role === "trainer" ? "client" : "trainer",
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const role = (session.user! as Record<string, unknown>).role as string;
  const body = await req.json();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      trainerId: client.trainerId,
      clientId,
      senderRole: role,
      senderId: session.user!.id!,
      body: body.body,
    },
  });

  // Notify recipient
  const recipientId = role === "trainer" ? clientId : client.trainerId;
  const recipientRole = role === "trainer" ? "client" : "trainer";
  await prisma.notification.create({
    data: {
      recipientId,
      recipientRole,
      type: "message_received",
      referenceId: clientId,
      referenceType: "Message",
      title: "New message",
      body: body.body.substring(0, 100),
    },
  });

  return NextResponse.json({ message }, { status: 201 });
}
