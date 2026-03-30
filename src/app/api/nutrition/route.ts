import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { date, meal, name, calories, protein, carbs, fat, photoUrl } = await req.json();
  if (!date || !meal) return NextResponse.json({ error: "date and meal required" }, { status: 400 });

  const log = await prisma.nutritionLog.create({
    data: { clientId: session.user.id!, date, meal, name, calories, protein, carbs, fat, photoUrl },
  });
  return NextResponse.json({ log }, { status: 201 });
}
