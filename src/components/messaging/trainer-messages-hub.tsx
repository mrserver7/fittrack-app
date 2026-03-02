"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, MessageSquare } from "lucide-react";
import MessageThread from "@/components/messaging/message-thread";

type Client = { id: string; name: string; email: string; unread: number };
type Message = {
  id: string; body: string; senderRole: string; senderId: string;
  createdAt: string | Date; isRead: boolean;
};

export default function TrainerMessagesHub({
  clients,
  activeClientId,
  initialMessages,
  trainerId,
}: {
  clients: Client[];
  activeClientId: string | null;
  initialMessages: Message[];
  trainerId: string;
}) {
  const router = useRouter();
  const [mobileView, setMobileView] = useState<"list" | "thread">(
    activeClientId ? "thread" : "list"
  );

  const activeClient = clients.find((c) => c.id === activeClientId);

  const selectClient = (clientId: string) => {
    router.push(`/clients/messages?client=${clientId}`);
    setMobileView("thread");
  };

  const ClientList = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <h1 className="font-semibold text-gray-900 dark:text-gray-50 text-lg">Messages</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{clients.length} client{clients.length !== 1 ? "s" : ""}</p>
      </div>
      {clients.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No active clients yet.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
          {clients.map((client) => {
            const initials = client.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
            const isActive = client.id === activeClientId;
            return (
              <button key={client.id} onClick={() => selectClient(client.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-5 py-4 text-left transition-colors",
                  isActive ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                )}>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                    {initials}
                  </div>
                  {client.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {client.unread > 9 ? "9+" : client.unread}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm truncate", isActive ? "font-semibold text-emerald-700 dark:text-emerald-400" : "font-medium text-gray-900 dark:text-gray-50")}>
                    {client.name}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{client.email}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full">
      {/* Desktop: always show list */}
      <div className="hidden md:flex flex-col w-72 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        <ClientList />
      </div>

      {/* Mobile: toggle list / thread */}
      <div className={cn("md:hidden flex flex-col w-full", mobileView === "thread" ? "hidden" : "flex")}>
        <ClientList />
      </div>

      {/* Thread area */}
      <div className={cn(
        "flex flex-col flex-1",
        "md:flex",
        mobileView === "list" ? "hidden md:flex" : "flex"
      )}>
        {activeClient ? (
          <>
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
              <button onClick={() => setMobileView("list")}
                className="md:hidden p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {activeClient.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-gray-50">{activeClient.name}</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{activeClient.email}</p>
              </div>
            </div>
            <MessageThread
              initialMessages={initialMessages}
              clientId={activeClientId!}
              senderRole="trainer"
              currentUserId={trainerId}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Select a client to start messaging</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Choose from the list on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
