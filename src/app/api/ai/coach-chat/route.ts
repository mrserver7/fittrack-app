import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithCoach } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ reply: "AI coach is not configured yet. Please contact your trainer." });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const role = (session.user as Record<string, unknown>).role as string;
    const userId = session.user.id!;

    let context: { clientName: string; currentProgram?: string; recentWorkouts?: string; goals?: string } = {
      clientName: session.user.name || "Athlete",
    };

    if (role === "client") {
      const client = await prisma.client.findUnique({
        where: { id: userId },
        include: {
          clientPrograms: {
            where: { status: "active" },
            include: { program: { select: { name: true, goalTag: true } } },
            take: 1,
          },
          sessionLogs: {
            where: { status: "completed" },
            orderBy: { completedAt: "desc" },
            take: 3,
            select: { completedAt: true, totalVolumeKg: true, durationMinutes: true },
          },
        },
      });

      if (client) {
        context.goals = client.goalsText || undefined;
        if (client.clientPrograms[0]) {
          context.currentProgram = `${client.clientPrograms[0].program.name} (${client.clientPrograms[0].program.goalTag || "general"})`;
        }
        if (client.sessionLogs.length > 0) {
          context.recentWorkouts = client.sessionLogs
            .map(s => `${s.completedAt?.toLocaleDateString()}: ${s.durationMinutes}min, ${s.totalVolumeKg}kg`)
            .join("; ");
        }
      }
    }

    const reply = await chatWithCoach(message, context);
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "I'm having trouble right now. Try again in a moment!" });
  }
}
