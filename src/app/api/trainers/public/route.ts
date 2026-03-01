import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public endpoint — returns trainers available for subscriber registration
export async function GET() {
  const trainers = await prisma.trainer.findMany({
    where: { deletedAt: null, isAdmin: false },
    select: { id: true, name: true, businessName: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ trainers });
}
