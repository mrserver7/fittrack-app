import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { ArrowLeft, MessageSquare } from "lucide-react";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ trainer?: string; client?: string }>;
}) {
  const session = await auth();
  if (!session || !(session.user as Record<string, unknown>).isAdmin) redirect("/dashboard");

  const { trainer: selectedTrainerId, client: selectedClientId } = await searchParams;

  // Get all trainers with their clients
  const trainers = await prisma.trainer.findMany({
    where: { isAdmin: false, deletedAt: null },
    select: {
      id: true, name: true,
      clients: {
        where: { deletedAt: null },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const activeTrainer = trainers.find((t) => t.id === selectedTrainerId) ?? trainers[0];
  const activeTrainerId = activeTrainer?.id;
  const clients = activeTrainer?.clients ?? [];
  const activeClientId = selectedClientId ?? clients[0]?.id;

  let messages: {
    id: string; body: string; senderRole: string; createdAt: Date; isRead: boolean;
    senderId: string;
  }[] = [];

  if (activeTrainerId && activeClientId) {
    messages = await prisma.message.findMany({
      where: { trainerId: activeTrainerId, clientId: activeClientId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">Message Browser</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Read-only view of all trainer/client conversations</p>
        </div>
      </div>

      {trainers.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">No trainers or messages yet.</p>
        </div>
      ) : (
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Trainer list */}
          <div className="w-48 flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trainers</p>
            </div>
            {trainers.map((trainer) => (
              <Link key={trainer.id}
                href={`/admin/messages?trainer=${trainer.id}`}
                className={`block px-4 py-3 text-sm border-b border-gray-50 dark:border-gray-800 transition-colors ${
                  trainer.id === activeTrainerId
                    ? "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}>
                {trainer.name}
                <span className="block text-xs text-gray-400 dark:text-gray-500">{trainer.clients.length} clients</span>
              </Link>
            ))}
          </div>

          {/* Client list */}
          <div className="w-44 flex-shrink-0 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Clients</p>
            </div>
            {clients.length === 0 ? (
              <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">No clients</p>
            ) : (
              clients.map((client) => (
                <Link key={client.id}
                  href={`/admin/messages?trainer=${activeTrainerId}&client=${client.id}`}
                  className={`block px-4 py-3 text-sm border-b border-gray-50 dark:border-gray-800 transition-colors ${
                    client.id === activeClientId
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}>
                  {client.name}
                </Link>
              ))
            )}
          </div>

          {/* Message thread (read-only) */}
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
            {activeClientId && activeTrainerId ? (
              <>
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-50 text-sm">
                    {activeTrainer?.name} ↔ {clients.find((c) => c.id === activeClientId)?.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{messages.length} message{messages.length !== 1 ? "s" : ""} · read-only</p>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No messages in this conversation.</div>
                  ) : (
                    messages.map((msg) => {
                      const isTrainer = msg.senderRole === "trainer";
                      return (
                        <div key={msg.id} className={`flex ${isTrainer ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                            isTrainer
                              ? "bg-purple-600 text-white rounded-br-sm"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50 rounded-bl-sm"
                          }`}>
                            <p className="text-xs font-medium mb-1 opacity-70">{isTrainer ? activeTrainer?.name : clients.find((c) => c.id === activeClientId)?.name}</p>
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                            <p className={`text-xs mt-1 ${isTrainer ? "text-purple-200" : "text-gray-400 dark:text-gray-500"}`}>
                              {formatDateTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Select a trainer and client to view their conversation.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
