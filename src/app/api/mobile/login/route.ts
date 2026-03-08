import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { z } from "zod";
import jwt from "jsonwebtoken";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const JWT_SECRET = process.env.MOBILE_JWT_SECRET ?? process.env.AUTH_SECRET ?? "fallback-secret";
const JWT_EXPIRES = "30d";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { email: rawEmail, password } = parsed.data;
    const email = rawEmail.toLowerCase().trim();

    // Check trainer table first
    const trainer = await prisma.trainer.findFirst({
      where: { email, deletedAt: null },
    });

    if (trainer) {
      const valid = await verifyPassword(password, trainer.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      if (!trainer.isAdmin && trainer.status === "pending") {
        return NextResponse.json({ error: "Account pending approval" }, { status: 403 });
      }

      const user = {
        id: trainer.id,
        email: trainer.email,
        name: trainer.name,
        role: "trainer" as const,
        isAdmin: trainer.isAdmin,
        photoUrl: trainer.photoUrl ?? null,
      };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES });
      return NextResponse.json({ token, user });
    }

    // Check client table
    const client = await prisma.client.findUnique({ where: { email } });
    if (!client || !client.passwordHash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, client.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (["pending", "invited", "archived", "rejected"].includes(client.status)) {
      return NextResponse.json({ error: "Account blocked", reason: client.status }, { status: 403 });
    }

    const user = {
      id: client.id,
      email: client.email,
      name: client.name,
      role: "client" as const,
      trainerId: client.trainerId,
      photoUrl: client.photoUrl ?? null,
    };
    const token = jwt.sign(user, JWT_SECRET, { expiresIn: JWT_EXPIRES });
    return NextResponse.json({ token, user });
  } catch (err) {
    console.error("[mobile-login]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
