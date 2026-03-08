import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Called after a failed sign-in to give the user a specific error reason.
// Only returns a detailed reason if the password was correct (account exists + password valid)
// or if the account is in a blocked state — otherwise returns generic "invalid".
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") return NextResponse.json({ reason: "invalid" });

    const normalized = email.toLowerCase().trim();

    // Check client table
    const client = await prisma.client.findUnique({
      where: { email: normalized },
      select: { status: true, passwordHash: true },
    });

    if (client) {
      const BLOCKED = ["pending", "invited", "archived", "rejected"];
      if (BLOCKED.includes(client.status)) {
        return NextResponse.json({ reason: client.status });
      }
    }

    return NextResponse.json({ reason: "invalid" });
  } catch {
    return NextResponse.json({ reason: "invalid" });
  }
}
