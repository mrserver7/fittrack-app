import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

type Params = { params: Promise<{ id: string }> };

/** POST — trainer enrolls one or more clients; client self-enrolls */
export async function POST(req: NextRequest, { params }: Params) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? (webSession?.user as Record<string, unknown>)?.id as string;
  const role = mobileUser?.role ?? (webSession?.user as Record<string, unknown>)?.role as string;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const challenge = await prisma.challenge.findUnique({ where: { id } });
  if (!challenge || !challenge.isActive)
    return NextResponse.json({ error: "Challenge not found or inactive" }, { status: 404 });

  // Determine which clients to enroll
  let clientIds: string[] = [];
  if (role === "client") {
    clientIds = [userId];
  } else if (role === "trainer") {
    clientIds = Array.isArray(body.clientIds) ? body.clientIds : [body.clientId].filter(Boolean);
  }
  if (clientIds.length === 0)
    return NextResponse.json({ error: "No clients specified" }, { status: 400 });

  await prisma.challengeEntry.createMany({
    data: clientIds.map((cid) => ({ challengeId: id, clientId: cid })),
    skipDuplicates: true,
  });

  // Push notify newly enrolled clients
  const clients = await prisma.client.findMany({
    where: { id: { in: clientIds } },
    select: { pushToken: true },
  });
  await Promise.all(
    clients.filter((c) => c.pushToken).map((c) =>
      sendPush(c.pushToken, `🏆 Challenge: ${challenge.title}`, "You've been enrolled! Let's go!", { screen: "challenges" })
    )
  );

  return NextResponse.json({ success: true, enrolled: clientIds.length });
}

/** DELETE — remove a client from the challenge */
export async function DELETE(req: NextRequest, { params }: Params) {
  const mobileUser = await getAuthUser(req);
  const webSession = mobileUser ? null : await auth();
  const userId = mobileUser?.id ?? (webSession?.user as Record<string, unknown>)?.id as string;
  const role = mobileUser?.role ?? (webSession?.user as Record<string, unknown>)?.role as string;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const clientId = role === "client" ? userId : body.clientId;

  await prisma.challengeEntry.deleteMany({ where: { challengeId: id, clientId } });
  return NextResponse.json({ success: true });
}
