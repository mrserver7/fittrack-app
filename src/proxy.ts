import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const publicPaths = ["/", "/login", "/register", "/invite", "/terms", "/privacy"];

export default auth((req) => {
  const { nextUrl } = req;
  const pathname = nextUrl.pathname;
  const session = req.auth;

  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|otf|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as Record<string, unknown>)?.role as string;
  const isAdmin = (session.user as Record<string, unknown>)?.isAdmin as boolean;

  // Admin can access everything
  if (isAdmin) return NextResponse.next();

  const clientOnlyPaths = ["/home", "/workout", "/progress", "/messages", "/checkins"];
  const trainerOnlyPaths = ["/dashboard", "/clients", "/programs", "/exercises", "/analytics", "/tasks", "/settings"];
  const adminOnlyPaths = ["/admin"];

  if (adminOnlyPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (role === "client" && trainerOnlyPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/home", req.url));
  }
  if (role === "trainer" && clientOnlyPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg|.*\\.ico|.*\\.webp|.*\\.woff|.*\\.woff2).*)"],
};
