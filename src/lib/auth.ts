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

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        // Check trainer table first (includes admin)
        const trainer = await prisma.trainer.findFirst({
          where: { email, deletedAt: null },
        });
        if (trainer) {
          const valid = await verifyPassword(password, trainer.passwordHash);
          if (!valid) return null;
          return {
            id: trainer.id,
            email: trainer.email,
            name: trainer.name,
            role: "trainer",
            isAdmin: trainer.isAdmin,
          } as Record<string, unknown>;
        }

        // Check subscriber/client table
        const client = await prisma.client.findUnique({ where: { email } });
        if (!client || !client.passwordHash) return null;
        const valid = await verifyPassword(password, client.passwordHash);
        if (!valid) return null;
        // Block pending/invited/archived accounts
        if (["pending", "invited", "archived"].includes(client.status)) return null;
        return {
          id: client.id,
          email: client.email,
          name: client.name,
          role: "client",
          trainerId: client.trainerId,
        } as Record<string, unknown>;
      },
    }),
  ],
});
