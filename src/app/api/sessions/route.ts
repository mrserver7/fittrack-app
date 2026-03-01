import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId") || session.user.id!;

  if (role === "client" && clientId !== session.user.id!)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const sessions = await prisma.sessionLog.findMany({
    where: { clientId },
    include: {
      workoutDay: { include: { exercises: { include: { exercise: true } } } },
      sets: { include: { exercise: true } },
      painFlags: true,
    },
    orderBy: { scheduledDate: "desc" },
    take: 50,
  });
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as Record<string, unknown>).role as string;
  const body = await req.json();
  const clientId = role === "client" ? session.user.id! : body.clientId;

  const log = await prisma.sessionLog.create({
    data: {
      clientId,
      workoutDayId: body.workoutDayId,
      clientProgramId: body.clientProgramId,
      scheduledDate: body.scheduledDate || new Date().toISOString().split("T")[0],
      status: "in_progress",
      startedAt: new Date(),
    },
  });
  return NextResponse.json({ session: log }, { status: 201 });
}
