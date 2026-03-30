import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import MessageThread from "@/components/messaging/message-thread";

type Params = { params: Promise<{ id: string }> };

export default async function ClientMessagesPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const trainerId = session!.user!.id!;

  const client = await prisma.client.findUnique({
    where: { id, trainerId, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!client) notFound();

  const messages = await prisma.message.findMany({
    where: { clientId: id, trainerId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-5 border-b border-border bg-card">
        <Link href={`/clients/${id}`}>
          <button className="p-2 rounded-xl border border-border hover:bg-muted/60 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>
        <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm">
          {client.name.charAt(0)}
        </div>
        <div>
          <h1 className="font-semibold text-foreground">{client.name}</h1>
          <p className="text-xs text-muted-foreground">Messages</p>
        </div>
      </div>
      <MessageThread
        initialMessages={JSON.parse(JSON.stringify(messages))}
        clientId={id}
        senderRole="trainer"
        currentUserId={trainerId}
      />
    </div>
  );
}
