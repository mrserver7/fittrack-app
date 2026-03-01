import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ clientId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const role = (session.user! as Record<string, unknown>).role as string;
  if (role === "client" && session.user!.id !== clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const measurements = await prisma.measurement.findMany({
    where: { clientId },
    orderBy: { recordedDate: "desc" },
    take: 52,
  });
  return NextResponse.json({ measurements });
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { clientId } = await params;
  const role = (session.user! as Record<string, unknown>).role as string;
  if (role === "client" && session.user!.id !== clientId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const measurement = await prisma.measurement.create({
    data: {
      clientId,
      recordedDate: body.recordedDate || new Date().toISOString().split("T")[0],
      weightKg: body.weightKg ? parseFloat(body.weightKg) : null,
      bodyFatPct: body.bodyFatPct ? parseFloat(body.bodyFatPct) : null,
      chestCm: body.chestCm ? parseFloat(body.chestCm) : null,
      waistCm: body.waistCm ? parseFloat(body.waistCm) : null,
      hipCm: body.hipCm ? parseFloat(body.hipCm) : null,
      armCm: body.armCm ? parseFloat(body.armCm) : null,
      thighCm: body.thighCm ? parseFloat(body.thighCm) : null,
      notes: body.notes,
    },
  });
  return NextResponse.json({ measurement }, { status: 201 });
}
