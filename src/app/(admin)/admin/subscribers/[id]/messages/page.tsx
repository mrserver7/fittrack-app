import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function AdminSubscriberMessagesPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = (session?.user as Record<string, unknown>)?.isAdmin as boolean;
  if (!session || !isAdmin) redirect("/dashboard");

  const client = await prisma.client.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      trainer: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          senderRole: true,
          senderId: true,
          isRead: true,
          readAt: true,
          createdAt: true,
          attachmentUrl: true,
          attachmentType: true,
        },
      },
    },
  });

  if (!client) notFound();

  return (
    <div className="page-container !max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/subscribers/${id}`}>
          <button className="p-2 rounded-xl border border-border hover:bg-muted/60 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Messages -- {client.name}</h1>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin View
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Conversation between {client.name} and trainer {client.trainer.name}
          </p>
        </div>
      </div>

      {client.messages.length === 0 ? (
        <div className="text-center py-20 section-card">
          <p className="text-muted-foreground">No messages yet in this conversation.</p>
        </div>
      ) : (
        <div className="section-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {client.messages.length} message{client.messages.length !== 1 ? "s" : ""} total
            </p>
          </div>
          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto p-4 space-y-3">
            {client.messages.map((msg) => {
              const isTrainer = msg.senderRole === "trainer";
              return (
                <div key={msg.id} className={`flex ${isTrainer ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                    isTrainer
                      ? "bg-emerald-600 text-white"
                      : "bg-muted text-foreground"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold ${isTrainer ? "text-emerald-100" : "text-muted-foreground"}`}>
                        {isTrainer ? `Trainer: ${client.trainer.name}` : `Client: ${client.name}`}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    {msg.attachmentUrl && (
                      <a href={msg.attachmentUrl} target="_blank" rel="noopener noreferrer"
                        className={`text-xs underline mt-1 block ${isTrainer ? "text-emerald-200" : "text-blue-500"}`}>
                        Attachment
                      </a>
                    )}
                    <div className={`flex items-center gap-2 mt-1 ${isTrainer ? "justify-end" : "justify-start"}`}>
                      <p className={`text-xs ${isTrainer ? "text-emerald-200" : "text-muted-foreground"}`}>
                        {formatDateTime(msg.createdAt)}
                      </p>
                      {isTrainer && (
                        <span className={`text-xs ${msg.isRead ? "text-emerald-200" : "text-emerald-300"}`}>
                          {msg.isRead ? "Read" : "Sent"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-border bg-muted/50">
            <p className="text-xs text-muted-foreground text-center">
              Admin view is read-only. Messages are between the subscriber and their assigned trainer.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
