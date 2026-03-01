import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Record<string, unknown>).role as string;
        token.trainerId = (user as Record<string, unknown>).trainerId as string | undefined;
        token.isAdmin = (user as Record<string, unknown>).isAdmin as boolean | undefined;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).trainerId = token.trainerId;
        (session.user as Record<string, unknown>).isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  providers: [],
};
