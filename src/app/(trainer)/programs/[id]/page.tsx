import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, ClipboardList } from "lucide-react";

type Params = { params: Promise<{ id: string }> };

export default async function ProgramDetailPage({ params }: Params) {
  const { id } = await params;
  const session = await auth();
  const trainerId = session!.user!.id!;

  const program = await prisma.program.findUnique({
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
                include: { exercise: true, substitutionExercise: true },
              },
            },
          },
        },
      },
      clientPrograms: {
        where: { status: "active" },
        include: { client: { select: { id: true, name: true } } },
      },
    },
  });

  if (!program) notFound();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/programs">
          <button className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
            {program.goalTag && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">{program.goalTag}</span>
            )}
          </div>
          {program.description && <p className="text-gray-400 text-sm mt-1">{program.description}</p>}
        </div>
      </div>

      {/* Assigned clients */}
      {program.clientPrograms.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            Assigned to: {program.clientPrograms.map((cp) => (
              <Link key={cp.id} href={`/clients/${cp.clientId}`} className="font-semibold hover:underline mx-1">{cp.client.name}</Link>
            ))}
          </p>
        </div>
      )}

      {/* Weeks */}
      <div className="space-y-6">
        {program.weeks.map((week) => (
          <div key={week.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Week {week.weekNumber}</h2>
                {week.isDeload && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">🔄 Deload</span>
                )}
              </div>
              <span className="text-xs text-gray-400">{week.days.length} day{week.days.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {week.days.map((day) => (
                <div key={day.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-800 text-sm">{day.dayLabel}</h3>
                    <p className="text-xs text-gray-400">{day.exercises.length} exercise{day.exercises.length !== 1 ? "s" : ""}</p>
                  </div>
                  <div className="p-3 space-y-2">
                    {day.exercises.length === 0 ? (
                      <p className="text-xs text-gray-400 py-2 text-center">No exercises</p>
                    ) : (
                      day.exercises.map((ex, idx) => (
                        <div key={ex.id} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50">
                          <span className="text-xs font-bold text-gray-300 w-5 flex-shrink-0 mt-0.5">{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{ex.exercise.name}</p>
                            <p className="text-xs text-gray-400">
                              {ex.sets}×{ex.repsMin}{ex.repsMax && ex.repsMax !== ex.repsMin ? `–${ex.repsMax}` : ""} reps
                              {ex.rpeMin ? ` · RPE ${ex.rpeMin}${ex.rpeMax ? `–${ex.rpeMax}` : ""}` : ""}
                              {ex.restSeconds ? ` · ${ex.restSeconds}s rest` : ""}
                            </p>
                            {ex.coachingNote && (
                              <p className="text-xs text-blue-600 mt-0.5 truncate">{ex.coachingNote}</p>
                            )}
                            {ex.substitutionExercise && (
                              <p className="text-xs text-orange-500 mt-0.5">
                                Sub: {ex.substitutionExercise.name}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
