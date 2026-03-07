import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/hash";
import { z } from "zod";
import { authConfig } from "@/lib/auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function logAttempt(data: {
  email: string;
  success: boolean;
  role?: string;
  userId?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.loginAttempt.create({ data });
  } catch {
    // Non-critical — don't block auth on logging failure
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const ip =
          request?.headers?.get("x-forwarded-for")?.split(",")[0].trim() ??
          request?.headers?.get("x-real-ip") ??
          undefined;
        const userAgent = request?.headers?.get("user-agent") ?? undefined;

        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          await logAttempt({ email: String(credentials?.email ?? ""), success: false, reason: "invalid_input", ipAddress: ip, userAgent });
          return null;
        }
        const { email: rawEmail, password } = parsed.data;
        const email = rawEmail.toLowerCase();

        // Check trainer table first (includes admin)
        const trainer = await prisma.trainer.findFirst({
          where: { email, deletedAt: null },
        });
        if (trainer) {
          const valid = await verifyPassword(password, trainer.passwordHash);
          if (!valid) {
            await logAttempt({ email, success: false, role: "trainer", userId: trainer.id, reason: "wrong_password", ipAddress: ip, userAgent });
            return null;
          }
          // Block pending trainers (unless admin)
          if (!trainer.isAdmin && trainer.status === "pending") {
            await logAttempt({ email, success: false, role: "trainer", userId: trainer.id, reason: "blocked", ipAddress: ip, userAgent });
            return null;
          }
          await logAttempt({ email, success: true, role: trainer.isAdmin ? "admin" : "trainer", userId: trainer.id, ipAddress: ip, userAgent });
          return {
            id: trainer.id,
            email: trainer.email,
            name: trainer.name,
            role: "trainer",
            isAdmin: trainer.isAdmin,
            photoUrl: trainer.photoUrl ?? null,
          } as Record<string, unknown>;
        }

        // Check subscriber/client table
        const client = await prisma.client.findUnique({ where: { email } });
        if (!client || !client.passwordHash) {
          await logAttempt({ email, success: false, reason: "not_found", ipAddress: ip, userAgent });
          return null;
        }
        const valid = await verifyPassword(password, client.passwordHash);
        if (!valid) {
          await logAttempt({ email, success: false, role: "client", userId: client.id, reason: "wrong_password", ipAddress: ip, userAgent });
          return null;
        }
        // Block pending/invited/archived/rejected accounts
        if (["pending", "invited", "archived", "rejected"].includes(client.status)) {
          await logAttempt({ email, success: false, role: "client", userId: client.id, reason: client.status, ipAddress: ip, userAgent });
          return null;
        }
        await logAttempt({ email, success: true, role: "client", userId: client.id, ipAddress: ip, userAgent });
        return {
          id: client.id,
          email: client.email,
          name: client.name,
          role: "client",
          trainerId: client.trainerId,
          photoUrl: client.photoUrl ?? null,
        } as Record<string, unknown>;
      },
    }),
  ],
});
