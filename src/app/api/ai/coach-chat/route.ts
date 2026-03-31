import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { chatWithCoach } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === "") {
    console.error("[coach-chat] GEMINI_API_KEY is", process.env.GEMINI_API_KEY === undefined ? "undefined" : "empty string");
    return NextResponse.json({ reply: "AI coach is not configured yet. Please contact your trainer." });
  }

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let context: { clientName: string; currentProgram?: string; recentWorkouts?: string; goals?: string } = {
      clientName: user.name || "Athlete",
    };

    if (user.role === "client") {
      const client = await prisma.client.findUnique({
        where: { id: user.id },
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
  } catch (err) {
    console.error("[coach-chat] Gemini error:", err);
    return NextResponse.json({ reply: "I'm having trouble connecting to the AI service. Please try again later." });
  }
}
