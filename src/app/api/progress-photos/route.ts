import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  let clientId: string;

  if (role === "client") {
    clientId = userId;
  } else if (role === "trainer") {
    const param = req.nextUrl.searchParams.get("clientId");
    if (!param) return NextResponse.json({ error: "clientId is required" }, { status: 400 });

    const client = await prisma.client.findUnique({ where: { id: param, deletedAt: null } });
    if (!client || client.trainerId !== userId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    clientId = param;
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const [photos, total] = await Promise.all([
    prisma.progressPhoto.findMany({
      where: { clientId },
      orderBy: { takenAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.progressPhoto.count({ where: { clientId } }),
  ]);

  return NextResponse.json({ photos, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  if (role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { photoUrl, pose, takenAt, notes } = body;

  if (!photoUrl || !pose || !takenAt)
    return NextResponse.json({ error: "photoUrl, pose, and takenAt are required" }, { status: 400 });

  const photo = await prisma.progressPhoto.create({
    data: {
      clientId: userId,
      photoUrl,
      pose,
      takenAt,
      notes: notes || null,
    },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
