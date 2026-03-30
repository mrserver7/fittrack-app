import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "client")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { sessionLogId, postType, caption, isPublic } = await req.json();

  const post = await prisma.socialPost.create({
    data: {
      clientId: session.user.id!,
      sessionLogId: sessionLogId || null,
      postType: postType || "workout",
      caption: caption || null,
      isPublic: isPublic !== false,
    },
  });
  return NextResponse.json({ post }, { status: 201 });
}
