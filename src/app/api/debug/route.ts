import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    db: process.env.DATABASE_URL ? "SET" : "MISSING",
    auth: process.env.AUTH_SECRET ? "SET" : "MISSING", 
    authUrl: process.env.AUTH_URL ?? "not set",
    nextauthUrl: process.env.NEXTAUTH_URL ?? "not set",
    node: process.version,
    env: process.env.NODE_ENV,
  });
}
