import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MessageThread from "@/components/messaging/message-thread";

export default async function ClientMessagesPage() {
  const session = await auth();
  const clientId = session!.user!.id!;
  const trainerId = (session!.user as Record<string, unknown>).trainerId as string;

  const messages = await prisma.message.findMany({
    where: { clientId, trainerId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  const trainer = await prisma.trainer.findUnique({
    where: { id: trainerId },
    select: { name: true, businessName: true },
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold">
          {trainer?.name?.charAt(0) || "T"}
        </div>
        <div>
          <h1 className="font-semibold text-gray-900 dark:text-gray-50">{trainer?.name}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">{trainer?.businessName || "Your Trainer"}</p>
        </div>
      </div>
      <MessageThread
        initialMessages={JSON.parse(JSON.stringify(messages))}
        clientId={clientId}
        senderRole="client"
        currentUserId={clientId}
      />
    </div>
  );
}
