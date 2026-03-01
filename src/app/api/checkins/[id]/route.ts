import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const checkIn = await prisma.checkIn.findUnique({
    where: { id },
    include: { checkInForm: true },
  });
  if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ checkIn });
}
