import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { clientId } = await params;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const startDate = sevenDaysAgo.toISOString().split("T")[0];

  const [sessions, checkIns, messages, habitLogs, client] = await Promise.all([
    prisma.sessionLog.count({
      where: { clientId, status: "completed", completedAt: { gte: sevenDaysAgo } },
    }),
    prisma.checkIn.count({
      where: { clientId, status: "submitted", submittedAt: { gte: sevenDaysAgo } },
    }),
    prisma.message.count({
      where: { clientId, senderRole: "client", senderId: clientId, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.habitLog.count({
      where: { clientId, date: { gte: startDate } },
    }),
    prisma.client.findUnique({
      where: { id: clientId },
      select: { updatedAt: true },
    }),
  ]);

  // Score weights: sessions 40%, check-ins 20%, messages 20%, habits 20%
  const sessionScore = Math.min(sessions / 4, 1) * 40;   // 4 sessions/week = max
  const checkInScore = Math.min(checkIns / 1, 1) * 20;   // 1 check-in/week = max
  const messageScore = Math.min(messages / 3, 1) * 20;   // 3 messages/week = max
  const habitScore = Math.min(habitLogs / 7, 1) * 20;    // 7 habit logs/week = max

  const score = Math.round(sessionScore + checkInScore + messageScore + habitScore);

  return NextResponse.json({
    score,
    breakdown: {
      sessions: { count: sessions, score: Math.round(sessionScore) },
      checkIns: { count: checkIns, score: Math.round(checkInScore) },
      messages: { count: messages, score: Math.round(messageScore) },
      habits: { count: habitLogs, score: Math.round(habitScore) },
    },
    lastActive: client?.updatedAt || null,
  });
}
