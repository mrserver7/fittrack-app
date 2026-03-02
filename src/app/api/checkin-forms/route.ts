import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const forms = await prisma.checkInForm.findMany({
    where: { trainerId: session.user!.id!, isActive: true },
    select: { id: true, name: true, questions: true, recurrence: true },
    orderBy: { createdAt: "desc" },
  });

  // If no forms exist, auto-create a default one for this trainer
  if (forms.length === 0) {
    const defaultQuestions = JSON.stringify([
      { id: "q1", label: "How would you rate your overall energy this week? (1–10)", type: "scale_1_10", required: true },
      { id: "q2", label: "How was your sleep quality? (1–5)", type: "scale_1_5", required: true },
      { id: "q3", label: "Did you follow your nutrition plan?", type: "long_text", required: false },
      { id: "q4", label: "Any pain or discomfort to report?", type: "long_text", required: false },
      { id: "q5", label: "Current bodyweight (kg)", type: "number", required: false },
      { id: "q6", label: "Any notes or wins to share with your trainer?", type: "long_text", required: false },
    ]);

    const created = await prisma.checkInForm.create({
      data: {
        trainerId: session.user!.id!,
        name: "Weekly Check-in",
        questions: defaultQuestions,
        recurrence: "weekly",
        isActive: true,
      },
    });
    return NextResponse.json({ forms: [{ id: created.id, name: created.name, questions: created.questions, recurrence: created.recurrence }] });
  }

  return NextResponse.json({ forms });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as Record<string, unknown>).role !== "trainer")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const form = await prisma.checkInForm.create({
    data: {
      trainerId: session.user!.id!,
      name: body.name,
      questions: typeof body.questions === "string" ? body.questions : JSON.stringify(body.questions),
      recurrence: body.recurrence || "weekly",
    },
  });
  return NextResponse.json({ form }, { status: 201 });
}
