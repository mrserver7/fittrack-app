import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSessionSummary } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ summary: "Great workout! Keep pushing." });
  }

  try {
    const body = await req.json();
    const summary = await generateSessionSummary(body);
    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json({ summary: "Solid session! Keep up the consistency." });
  }
}
