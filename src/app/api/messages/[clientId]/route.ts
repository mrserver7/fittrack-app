import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const role = user.role;

  if (role === "client" && user.id !== clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!client.trainerId) return NextResponse.json({ error: "No trainer assigned" }, { status: 404 });
  if (role === "trainer" && client.trainerId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainerId = client.trainerId;

  const messages = await prisma.message.findMany({
    where: { clientId, trainerId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      clientId,
      trainerId,
      senderRole: role === "trainer" ? "client" : "trainer",
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const role = user.role;
  const body = await req.json();

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!client.trainerId) return NextResponse.json({ error: "No trainer assigned" }, { status: 404 });

  const message = await prisma.message.create({
    data: {
      trainerId: client.trainerId,
      clientId,
      senderRole: role,
      senderId: user.id,
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
