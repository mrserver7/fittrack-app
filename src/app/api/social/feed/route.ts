import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as Record<string, unknown>).role as string;
  const userId = session.user.id!;

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") || "1"));
  const limit = Math.min(50, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "20")));
  const skip = (page - 1) * limit;

  let trainerId: string | undefined;

  if (role === "client") {
    const client = await prisma.client.findUnique({ where: { id: userId }, select: { trainerId: true } });
    trainerId = client?.trainerId || undefined;
  } else if (role === "trainer") {
    trainerId = userId;
  }

  if (!trainerId) return NextResponse.json({ posts: [] });

  const clientIds = await prisma.client.findMany({
    where: { trainerId, deletedAt: null },
    select: { id: true },
  });

  const posts = await prisma.socialPost.findMany({
    where: { clientId: { in: clientIds.map(c => c.id) }, isPublic: true },
    include: {
      client: { select: { id: true, name: true, photoUrl: true } },
      reactions: { select: { id: true, emoji: true, clientId: true } },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take: limit,
  });

  return NextResponse.json({ posts, page, limit });
}
