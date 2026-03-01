import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  const id = session.user.id!;
  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  if (role === "trainer") {
    const trainer = await prisma.trainer.findUnique({ where: { id } });
    if (!trainer) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const valid = await bcrypt.compare(currentPassword, trainer.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.trainer.update({ where: { id }, data: { passwordHash: hash } });
    return NextResponse.json({ ok: true });
  } else if (role === "client") {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (!client.passwordHash) return NextResponse.json({ error: "No password set." }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, client.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    const hash = await bcrypt.hash(newPassword, 12);
    await prisma.client.update({ where: { id }, data: { passwordHash: hash } });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid role" }, { status: 400 });
}
