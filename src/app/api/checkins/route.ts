import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const clientId = user.id;

  const checkIns = await prisma.checkIn.findMany({
    where: { clientId },
    include: { checkInForm: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ checkIns });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user || user.role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();

  const checkIn = await prisma.checkIn.create({
    data: {
      clientId: body.clientId,
      checkInFormId: body.checkInFormId,
      periodStart: body.periodStart,
      periodEnd: body.periodEnd,
      status: "pending",
    },
  });

  const client = await prisma.client.findUnique({
    where: { id: body.clientId },
    select: { pushToken: true },
  });

  await Promise.all([
    prisma.notification.create({
      data: {
        recipientId: body.clientId,
        recipientRole: "client",
        type: "check_in_due",
        referenceId: checkIn.id,
        referenceType: "CheckIn",
        title: "Time for your weekly check-in!",
        body: "Your trainer is waiting for your update.",
      },
    }),
    client?.pushToken
      ? sendPush(client.pushToken, "📋 Check-in time!", "Your trainer is waiting for your weekly update.", { screen: "checkins" })
      : Promise.resolve(),
  ]);

  return NextResponse.json({ checkIn }, { status: 201 });
}
