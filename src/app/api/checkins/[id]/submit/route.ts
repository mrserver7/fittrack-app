import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/get-auth-user";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { responses } = await req.json();

  const checkIn = await prisma.checkIn.findUnique({ where: { id }, include: { client: true } });
  if (!checkIn) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const autoSummary = Object.entries(responses).map(([k, v]) => `${k}: ${v}`).join(", ");

  const updated = await prisma.checkIn.update({
    where: { id },
    data: {
      responses: JSON.stringify(responses),
      status: "completed",
      submittedAt: new Date(),
      autoSummary,
    },
  });

  // Notify trainer (DB + push)
  if (checkIn.client.trainerId) {
    await prisma.notification.create({
      data: {
        recipientId: checkIn.client.trainerId,
        recipientRole: "trainer",
        type: "check_in_submitted",
        referenceId: id,
        referenceType: "CheckIn",
        title: `${checkIn.client.name} submitted their check-in`,
        body: "Tap to review their responses.",
      },
    });

    const trainer = await prisma.trainer.findUnique({
      where: { id: checkIn.client.trainerId },
      select: { pushToken: true },
    });
    await sendPush(
      trainer?.pushToken,
      `📋 ${checkIn.client.name} submitted a check-in`,
      "Tap to review their responses.",
      { screen: "clients", clientId: checkIn.clientId }
    );
  }

  return NextResponse.json({ checkIn: updated });
}
