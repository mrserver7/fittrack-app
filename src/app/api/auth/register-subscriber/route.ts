import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  trainerId: z.string().optional(),
  phone: z.string().optional(),
  goalsText: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 422 });

    const { name, email, password, trainerId, phone, goalsText } = parsed.data;

    // Check if email already used in either table
    const existingClient = await prisma.client.findUnique({ where: { email } });
    if (existingClient) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const existingTrainer = await prisma.trainer.findUnique({ where: { email } });
    if (existingTrainer) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const passwordHash = await hashPassword(password);
    const client = await prisma.client.create({
      data: {
        trainerId: trainerId ?? null,
        name,
        email,
        passwordHash,
        phone,
        goalsText,
        status: "pending",
        healthDisclaimerAccepted: true,
        startDate: new Date().toISOString().split("T")[0],
      },
    });

    // Notify trainer if one is assigned
    if (trainerId) {
      await prisma.notification.create({
        data: {
          recipientId: trainerId,
          recipientRole: "trainer",
          type: "subscriber_request",
          referenceId: client.id,
          referenceType: "Client",
          title: `New subscriber request: ${name}`,
          body: `${name} (${email}) wants to join your roster. Review and approve in the Clients tab.`,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
