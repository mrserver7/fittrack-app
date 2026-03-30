import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDeloadSuggestion } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  const clientId = role === "client"
    ? session.user.id!
    : req.nextUrl.searchParams.get("clientId");

  if (!clientId) return NextResponse.json({ error: "clientId required" }, { status: 400 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ shouldDeload: false, reason: "AI not configured", suggestedAction: "Continue training" });
  }

  try {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const sessions = await prisma.sessionLog.findMany({
      where: {
        clientId,
        status: "completed",
        completedAt: { gte: fourWeeksAgo },
      },
      orderBy: { completedAt: "desc" },
      select: { completedAt: true, avgRpe: true, totalVolumeKg: true },
    });

    if (sessions.length < 4) {
      return NextResponse.json({ shouldDeload: false, reason: "Not enough data yet", suggestedAction: "Keep training consistently" });
    }

    const weeks = Math.ceil(sessions.length / 3);
    const avgRPE = sessions.reduce((sum, s) => sum + (s.avgRpe || 0), 0) / sessions.length;
    const volumes = sessions.map(s => s.totalVolumeKg || 0);
    const recentAvg = volumes.slice(0, Math.ceil(volumes.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(volumes.length / 2);
    const olderAvg = volumes.slice(Math.ceil(volumes.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(volumes.length / 2);

    const volumeTrend = recentAvg > olderAvg * 1.05 ? "increasing" : recentAvg < olderAvg * 0.95 ? "decreasing" : "stable";
    const performanceTrend = avgRPE > 8.5 ? "high fatigue" : avgRPE > 7 ? "moderate" : "manageable";

    const suggestion = await generateDeloadSuggestion({
      weeksTraining: weeks,
      avgRPE: Math.round(avgRPE * 10) / 10,
      volumeTrend,
      performanceTrend,
    });

    return NextResponse.json(suggestion);
  } catch {
    return NextResponse.json({ shouldDeload: false, reason: "Could not analyze", suggestedAction: "Continue as planned" });
  }
}
