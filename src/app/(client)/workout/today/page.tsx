import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WorkoutLogger from "@/components/workout/workout-logger";
import { Dumbbell, CheckCircle } from "lucide-react";

export default async function TodayWorkoutPage({ searchParams }: { searchParams: Promise<{ redo?: string }> }) {
  const { redo } = await searchParams;
  const session = await auth();
  const clientId = session!.user!.id!;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      clientPrograms: {
        where: { status: "active" },
        include: {
          program: {
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
            },
          },
        },
        orderBy: { assignedAt: "desc" },
        take: 1,
      },
    },
  });

  const activeProgram = client?.clientPrograms[0];

  if (!activeProgram) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No program assigned</h2>
          <p className="text-gray-500 text-sm">Your trainer hasn&apos;t assigned a program yet. Check back soon!</p>
          <Link href="/home" className="mt-4 inline-block text-emerald-600 hover:underline text-sm">← Back to home</Link>
        </div>
      </div>
    );
  }

  const startDate = new Date(activeProgram.startDate);
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weeksElapsed = Math.floor(daysSinceStart / 7);
  const today = new Date().getDay(); // 0=Sun, 1=Mon, ...

  const program = activeProgram.program;
  const allDays = program.weeks.flatMap((w) => w.days.map((d) => ({ ...d, weekNumber: w.weekNumber })));

  // Handle program with no workout days yet
  if (allDays.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Program has no workouts yet</h2>
          <p className="text-gray-500 text-sm">Your trainer is still building your program <strong>{program.name}</strong>. Check back soon!</p>
          <Link href="/home" className="mt-4 inline-block text-emerald-600 hover:underline text-sm">← Back to home</Link>
        </div>
      </div>
    );
  }

  // Find next unlogged day
  const loggedDayIds = (await prisma.sessionLog.findMany({
    where: { clientId, status: { in: ["completed", "in_progress"] } },
    select: { workoutDayId: true },
  })).map((s) => s.workoutDayId).filter(Boolean);

  const nextDay = allDays.find((d) => !loggedDayIds.includes(d.id)) || allDays[0];

  // Check if today's workout was already completed today (and user didn't choose to redo)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCompletedSession = !redo && await prisma.sessionLog.findFirst({
    where: { clientId, workoutDayId: nextDay.id, status: "completed", scheduledDate: todayStr },
  });

  if (todayCompletedSession) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Workout Complete! 🎉</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            You already completed <strong>{nextDay.dayLabel}</strong> today.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-8">Great work! Come back tomorrow for your next session.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-8">
            <Link href="/home"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
              ← Back to Home
            </Link>
            <Link href="/workout/today?redo=1"
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl text-sm transition-colors">
              Do it again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const existingSession = await prisma.sessionLog.findFirst({
    where: { clientId, workoutDayId: nextDay?.id, status: "in_progress" },
    include: { sets: true, painFlags: true },
  });

  return (
    <WorkoutLogger
      clientId={clientId}
      workoutDay={JSON.parse(JSON.stringify(nextDay))}
      programName={program.name}
      existingSession={existingSession ? JSON.parse(JSON.stringify(existingSession)) : null}
      clientProgramId={activeProgram.id}
    />
  );
}
