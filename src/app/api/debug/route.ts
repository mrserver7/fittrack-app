import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const trainer = await prisma.trainer.findFirst({
      where: { email: "mrserver.ksa@gmail.com" },
      select: { id: true, email: true, isAdmin: true },
    });
    return NextResponse.json({
      db: process.env.DATABASE_URL ? "SET" : "MISSING",
      auth: process.env.AUTH_SECRET ? "SET" : "MISSING",
      dbUrl: process.env.DATABASE_URL?.substring(0, 40) + "...",
      trainerFound: !!trainer,
      trainer: trainer,
    });
  } catch (e: unknown) {
    return NextResponse.json({
      db: process.env.DATABASE_URL ? "SET" : "MISSING",
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
