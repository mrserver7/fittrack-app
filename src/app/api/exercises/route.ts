import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  // Trainers see global + their own; clients see global only
  const exercises = await prisma.exercise.findMany({
    where: {
      deletedAt: null,
      OR: user.role === "trainer"
        ? [{ isGlobal: true }, { trainerId: user.id }]
        : [{ isGlobal: true }],
      ...(search ? { name: { contains: search } } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: [{ isGlobal: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({ exercises });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user! as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const exercise = await prisma.exercise.create({
    data: {
      trainerId: session.user!.id!,
      name: body.name,
      category: body.category || "other",
      primaryMuscles: body.primaryMuscles,
      equipment: body.equipment,
      defaultSets: body.defaultSets,
      defaultReps: body.defaultReps,
      coachingNotes: body.coachingNotes,
      videoUrl: body.videoUrl,
      bodyRegions: body.bodyRegions,
    },
  });
  return NextResponse.json({ exercise }, { status: 201 });
}
