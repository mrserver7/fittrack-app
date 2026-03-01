import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

export async function POST(req: NextRequest) {
  try {
    const { token, password, name } = await req.json();
    if (!token || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const client = await prisma.client.findUnique({ where: { invitationToken: token } });
    if (!client) return NextResponse.json({ error: "Invalid invitation link" }, { status: 400 });
    if (client.invitationExpiresAt && client.invitationExpiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation link has expired" }, { status: 400 });
    }
    if (client.status === "active") return NextResponse.json({ error: "Account already activated" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    await prisma.client.update({
      where: { id: client.id },
      data: {
        passwordHash,
        status: "active",
        invitationToken: null,
        healthDisclaimerAccepted: true,
        name: name || client.name,
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
