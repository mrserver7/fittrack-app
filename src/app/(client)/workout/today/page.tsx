import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import WorkoutLogger from "@/components/workout/workout-logger";
import WorkoutDayOptions from "@/components/workout/workout-day-options";
import { Dumbbell, CheckCircle, Moon } from "lucide-react";
import { WEEKDAYS, getWeekStart } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export default async function TodayWorkoutPage({ searchParams }: { searchParams: Promise<{ redo?: string }> }) {
  const [{ redo }, t] = await Promise.all([searchParams, getT()]);
  const session = await auth();
  const clientId = session!.user!.id!;

  const todayDate = new Date();
  const todayWeekday = WEEKDAYS[todayDate.getDay()]; // e.g. "Monday"
  const todayStr = todayDate.toISOString().split("T")[0];
  const weekStartDate = getWeekStart(todayDate);

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
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t.workout.noProgramAssigned}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.workout.noProgramSub}</p>
          <Link href="/home" className="mt-4 inline-block text-emerald-600 hover:underline text-sm">{t.workout.backToHome}</Link>
        </div>
      </div>
    );
  }

  const program = activeProgram.program;

  if (program.weeks.flatMap((w) => w.days).length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t.workout.programNoWorkouts}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            <strong>{program.name}</strong> — {t.workout.checkBackSoon}
          </p>
          <Link href="/home" className="mt-4 inline-block text-emerald-600 hover:underline text-sm">{t.workout.backToHome}</Link>
        </div>
      </div>
    );
  }

  // Compute current program week using calendar math
  const startDate = new Date(activeProgram.startDate);
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(daysSinceStart / 7);
  const effectiveWeekIndex = weekIndex % program.weeks.length;
  const currentProgramWeek = program.weeks[effectiveWeekIndex];

  // Get overrides for this client + weekStartDate
  const overrides = await prisma.workoutScheduleOverride.findMany({
    where: { clientId, weekStartDate },
  });

  // Determine today's workout
  let workoutDay: typeof currentProgramWeek.days[0] | null = null;

  // Check if something was moved TO today
  const movedHere = overrides.find((o) => o.newDay === todayWeekday && o.action === "moved");
  if (movedHere) {
    workoutDay = currentProgramWeek.days.find((d) => d.id === movedHere.workoutDayId) ?? null;
  } else {
    // Check original day scheduled for today
    const originalToday = currentProgramWeek.days.find((d) => d.dayLabel === todayWeekday);
    if (originalToday) {
      // Check if it was moved away or skipped
      const movedAway = overrides.find((o) => o.workoutDayId === originalToday.id);
      if (!movedAway) {
        workoutDay = originalToday;
      }
    }
  }

  // Compute available days for moving (days not occupied by program + not already targeted by override)
  const programDayLabels = new Set(currentProgramWeek.days.map((d) => d.dayLabel));
  const overrideTargets = new Set(overrides.filter((o) => o.action === "moved" && o.newDay).map((o) => o.newDay!));
  // Also exclude today and past days
  const todayWeekdayIndex = todayDate.getDay(); // 0=Sun
  const availableDays = WEEKDAYS.filter((day) => {
    if (programDayLabels.has(day)) return false;
    if (overrideTargets.has(day)) return false;
    if (day === todayWeekday) return false; // can't move to today (it is today)
    // Exclude past days
    const dayIdx = WEEKDAYS.indexOf(day);
    // Days from start of week (Monday=1, Tue=2, ... Sun=0)
    // Compare day positions in week relative to Monday
    const daysFromMonday = (di: number) => di === 0 ? 6 : di - 1;
    if (daysFromMonday(dayIdx) < daysFromMonday(todayWeekdayIndex)) return false;
    return true;
  });

  // Rest day screen
  if (!workoutDay) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Moon className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t.workout.restDay}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">{t.workout.noWorkoutToday}</p>
          <Link href="/home"
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
            {t.workout.backToHome}
          </Link>
        </div>
      </div>
    );
  }

  // Check if already completed today
  const todayCompletedSession = !redo && await prisma.sessionLog.findFirst({
    where: { clientId, workoutDayId: workoutDay.id, status: "completed", scheduledDate: todayStr },
  });

  if (todayCompletedSession) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t.workout.workoutComplete}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            {t.workout.alreadyCompleted} <strong>{workoutDay.dayLabel}</strong> {t.workout.todayLabel}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-8">{t.workout.greatWork}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center px-8">
            <Link href="/home"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors">
              {t.workout.backToHome}
            </Link>
            <Link href="/workout/today?redo=1"
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium rounded-xl text-sm transition-colors">
              {t.workout.doItAgain}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const existingSession = await prisma.sessionLog.findFirst({
    where: { clientId, workoutDayId: workoutDay.id, status: "in_progress" },
    include: { sets: true, painFlags: true },
  });

  return (
    <div>
      <div className="flex justify-end px-6 md:px-8 pt-4 max-w-2xl mx-auto">
        <WorkoutDayOptions
          workoutDayId={workoutDay.id}
          weekStartDate={weekStartDate}
          originalDay={workoutDay.dayLabel}
          availableDays={availableDays}
        />
      </div>
      <WorkoutLogger
        clientId={clientId}
        workoutDay={JSON.parse(JSON.stringify(workoutDay))}
        programName={program.name}
        existingSession={existingSession ? JSON.parse(JSON.stringify(existingSession)) : null}
        clientProgramId={activeProgram.id}
      />
    </div>
  );
}
