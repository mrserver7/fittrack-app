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
      { id: "q1", text: "How would you rate your overall energy this week? (1–10)", type: "scale_1_10" },
      { id: "q2", text: "How was your sleep quality? (1–5)", type: "scale_1_5" },
      { id: "q3", text: "Did you follow your nutrition plan?", type: "text" },
      { id: "q4", text: "Any pain or discomfort to report?", type: "text" },
      { id: "q5", text: "Current bodyweight (kg)", type: "number" },
      { id: "q6", text: "Any notes or wins to share with your trainer?", type: "text" },
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
