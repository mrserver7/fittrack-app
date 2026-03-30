import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProgramEditClient from "@/components/programs/program-edit-client";

type Params = { params: Promise<{ id: string }> };

export default async function EditProgramPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const trainerId = session!.user!.id!;

  const [program, exercises] = await Promise.all([
    prisma.program.findUnique({
      where: { id, trainerId, deletedAt: null },
      include: {
        weeks: {
          orderBy: { weekNumber: "asc" },
          include: {
            days: {
              orderBy: { dayOrder: "asc" },
              include: {
                exercises: {
                  orderBy: { sortOrder: "asc" },
                  include: { exercise: true, exerciseGroup: true },
                },
                exerciseGroups: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
      },
    }),
    prisma.exercise.findMany({
      where: { deletedAt: null, OR: [{ isGlobal: true }, { trainerId }] },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!program) notFound();

  return <ProgramEditClient program={program} exercises={exercises} />;
}
