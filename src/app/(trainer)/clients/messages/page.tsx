import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import TrainerMessagesHub from "@/components/messaging/trainer-messages-hub";

export default async function TrainerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const trainerId = session.user!.id!;
  const { client: selectedClientId } = await searchParams;

  const clients = await prisma.client.findMany({
    where: { trainerId, deletedAt: null, status: { in: ["active", "paused", "invited"] } },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  // Get unread message counts per client
  const unreadCounts = await prisma.message.groupBy({
    by: ["clientId"],
    where: { trainerId, senderRole: "client", isRead: false },
    _count: { id: true },
  });
  const unreadMap = new Map(unreadCounts.map((u) => [u.clientId, u._count.id]));

  // Load messages for selected client
  let messages: {
    id: string; body: string; senderRole: string; senderId: string;
    createdAt: Date; isRead: boolean;
  }[] = [];
  const activeClientId = selectedClientId || clients[0]?.id;

  if (activeClientId) {
    messages = await prisma.message.findMany({
      where: { clientId: activeClientId, trainerId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Mark client messages as read
    await prisma.message.updateMany({
      where: { clientId: activeClientId, trainerId, senderRole: "client", isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  return (
    <TrainerMessagesHub
      clients={clients.map((c) => ({ ...c, unread: unreadMap.get(c.id) ?? 0 }))}
      activeClientId={activeClientId ?? null}
      initialMessages={JSON.parse(JSON.stringify(messages))}
      trainerId={trainerId}
    />
  );
}
