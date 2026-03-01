import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  goalsText: z.string().optional(),
  injuriesText: z.string().optional(),
  startDate: z.string().optional(),
  tags: z.string().optional(),
  trainerNotes: z.string().optional(),
  trainingSchedule: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user! as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainerId = session.user!.id!;
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const clients = await prisma.client.findMany({
    where: {
      trainerId,
      deletedAt: null,
      ...(search ? { name: { contains: search } } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      sessionLogs: {
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        take: 1,
      },
      _count: { select: { sessionLogs: { where: { status: "completed" } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user! as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const trainerId = session.user!.id!;
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

  const existing = await prisma.client.findUnique({ where: { email: parsed.data.email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const client = await prisma.client.create({
    data: {
      trainerId,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      goalsText: parsed.data.goalsText,
      injuriesText: parsed.data.injuriesText,
      startDate: parsed.data.startDate,
      status: "invited",
      tags: parsed.data.tags,
      trainerNotes: parsed.data.trainerNotes,
      trainingSchedule: parsed.data.trainingSchedule,
      invitationToken: token,
      invitationExpiresAt: expiresAt,
    },
  });

  await prisma.auditEvent.create({
    data: { actorId: trainerId, actorRole: "trainer", action: "client.created", resourceType: "Client", resourceId: client.id },
  });

  return NextResponse.json({ client, invitationToken: token }, { status: 201 });
}
