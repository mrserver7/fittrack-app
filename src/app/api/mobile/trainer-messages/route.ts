import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const trainerId = user.id;

  const clients = await prisma.client.findMany({
    where: { trainerId, deletedAt: null, status: { in: ["active", "pending"] } },
    select: {
      id: true,
      name: true,
      photoUrl: true,
      messages: {
        where: { trainerId },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderRole: true, isRead: true },
      },
    },
    orderBy: { name: "asc" },
  });

  // Unread counts per client
  const unreadCounts = await prisma.message.groupBy({
    by: ["clientId"],
    where: { trainerId, senderRole: "client", isRead: false },
    _count: { id: true },
  });
  const unreadMap = Object.fromEntries(unreadCounts.map((u) => [u.clientId, u._count.id]));

  return NextResponse.json({
    clients: clients.map((c) => ({
      id: c.id,
      name: c.name,
      photoUrl: c.photoUrl,
      lastMessage: c.messages[0] ?? null,
      unreadCount: unreadMap[c.id] ?? 0,
    })),
  });
}
