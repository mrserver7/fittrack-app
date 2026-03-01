import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  // Notify trainer
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

  return NextResponse.json({ checkIn: updated });
}
