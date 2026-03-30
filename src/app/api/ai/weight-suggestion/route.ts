import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateWeightSuggestion } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ suggestedWeight: null, reason: "AI not configured" });
  }

  try {
    const body = await req.json();
    const suggestion = await generateWeightSuggestion(body);
    return NextResponse.json(suggestion);
  } catch {
    return NextResponse.json({ suggestedWeight: null, reason: "Could not generate suggestion" });
  }
}
