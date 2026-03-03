import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { WEEKDAYS, getWeekStart, formatDate } from "@/lib/utils";
import { CalendarDays, Dumbbell, ChevronRight } from "lucide-react";

export default async function SchedulePage() {
  const session = await auth();
  const clientId = session!.user!.id!;

  const todayWeekday = WEEKDAYS[new Date().getDay()];
  const weekStartDate = getWeekStart();
  const todayStr = new Date().toISOString().split("T")[0];

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
                        include: { exercise: { select: { name: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      },
    },
  });

  const activePrograms = client?.clientPrograms ?? [];

  if (activePrograms.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">Schedule</h1>
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">No program assigned</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your trainer hasn&apos;t assigned a program yet. Check back soon!</p>
        </div>
      </div>
    );
  }

  // Get overrides + completed sessions for this week (across all programs)
  const allDayIds = activePrograms.flatMap((cp) =>
    cp.program.weeks.flatMap((w) => w.days.map((d) => d.id))
  );
  const [overrides, completedThisWeek] = await Promise.all([
    prisma.workoutScheduleOverride.findMany({
      where: { clientId, weekStartDate },
    }),
    prisma.sessionLog.findMany({
      where: { clientId, workoutDayId: { in: allDayIds }, status: "completed", scheduledDate: { gte: weekStartDate } },
      select: { workoutDayId: true },
    }),
  ]);

  const completedDayIds = new Set(completedThisWeek.map((s) => s.workoutDayId));

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-6 h-6 text-emerald-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">My Schedule</h1>
      </div>

      {activePrograms.map((cp) => {
        const program = cp.program;

        // Compute current program week
        const startDate = new Date(cp.startDate);
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.floor(Math.max(0, daysSinceStart) / 7);
        const effectiveIdx = weekIdx % program.weeks.length;
        const currentProgramWeek = program.weeks[effectiveIdx];
        const currentWeekNumber = (weekIdx % program.weeks.length) + 1;

        return (
          <div key={cp.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Program header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-gray-50 text-lg">{program.name}</h2>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
                  Started {formatDate(cp.startDate)} · Week {currentWeekNumber} of {program.weeks.length} · {program.durationWeeks} week program
                </p>
              </div>
              <Link href="/workout/today"
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
                <Dumbbell className="w-4 h-4" />
                Today&apos;s Workout
              </Link>
            </div>

            {/* This Week grid */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                This Week
              </h3>
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => {
                  const isToday = day === todayWeekday;
                  const programDay = currentProgramWeek?.days.find((d) => d.dayLabel === day);
                  const movedHere = overrides.find((o) => o.newDay === day && o.action === "moved");
                  const movedAway = programDay ? overrides.find((o) => o.workoutDayId === programDay.id && o.action === "moved") : null;
                  const skipped = programDay ? overrides.find((o) => o.workoutDayId === programDay.id && o.action === "skipped") : null;

                  let effectiveDay = programDay;
                  if (movedHere) effectiveDay = currentProgramWeek?.days.find((d) => d.id === movedHere.workoutDayId);
                  if (movedAway || skipped) effectiveDay = undefined;

                  const done = effectiveDay ? completedDayIds.has(effectiveDay.id) : false;
                  const isActive = isToday && !!effectiveDay && !done;

                  let bg = "bg-gray-50 dark:bg-gray-800/50 text-gray-300 dark:text-gray-600";
                  if (skipped) bg = "bg-red-50 dark:bg-red-900/20 text-red-400";
                  else if (movedAway) bg = "bg-orange-50 dark:bg-orange-900/20 text-orange-500";
                  else if (movedHere && effectiveDay) bg = "bg-orange-50 dark:bg-orange-900/20 text-orange-600";
                  else if (done) bg = "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400";
                  else if (effectiveDay) bg = "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";

                  return (
                    <div key={day}
                      className={`rounded-xl p-2 text-center relative ${bg} ${isToday ? "ring-2 ring-emerald-500" : ""}`}>
                      <p className={`text-xs font-bold mb-1 ${isToday ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                        {day.slice(0, 3)}
                      </p>
                      {effectiveDay ? (
                        <div>
                          <p className="text-xs font-medium leading-tight">{effectiveDay.exercises.length}ex</p>
                          {done && <p className="text-xs mt-0.5">✓</p>}
                          {skipped && <p className="text-xs mt-0.5">✕</p>}
                          {movedAway && <p className="text-xs mt-0.5">→{movedAway.newDay?.slice(0, 3)}</p>}
                          {movedHere && <p className="text-xs mt-0.5">←{movedHere.originalDay?.slice(0, 3)}</p>}
                        </div>
                      ) : (
                        <p className="text-xs">—</p>
                      )}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-3">
                {[
                  { color: "bg-emerald-500", label: "Scheduled" },
                  { color: "bg-emerald-700", label: "Completed" },
                  { color: "bg-red-400", label: "Skipped" },
                  { color: "bg-orange-400", label: "Moved" },
                  { color: "bg-gray-300", label: "Rest day" },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
                    <span className="text-xs text-gray-400 dark:text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Full program structure */}
            <div className="p-5">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
                Full Program — All Weeks
              </h3>
              <div className="space-y-4">
                {program.weeks.map((week) => {
                  const isCurrent = program.weeks.indexOf(week) === effectiveIdx;
                  return (
                    <div key={week.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                          isCurrent
                            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}>
                          Week {week.weekNumber}{week.isDeload ? " 🔄" : ""}{isCurrent ? " · Current" : ""}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {week.days.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 col-span-3">No workout days yet.</p>
                        ) : (
                          week.days.map((day) => {
                            const isDoneInCurrentWeek = isCurrent && completedDayIds.has(day.id);
                            const isSkippedInCurrentWeek = isCurrent && overrides.some((o) => o.workoutDayId === day.id && o.action === "skipped");
                            const isTodayDay = isCurrent && day.dayLabel === todayWeekday;

                            return (
                              <div key={day.id}
                                className={`p-3 rounded-xl border ${
                                  isDoneInCurrentWeek
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                    : isSkippedInCurrentWeek
                                    ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900"
                                    : isTodayDay
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400"
                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                }`}>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                    {day.dayLabel}
                                    {isTodayDay && <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">· Today</span>}
                                  </span>
                                  {isDoneInCurrentWeek && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ Done</span>}
                                  {isSkippedInCurrentWeek && <span className="text-xs text-red-500 font-medium">Skipped</span>}
                                </div>
                                {day.exercises.length === 0 ? (
                                  <p className="text-xs text-gray-400 dark:text-gray-500">No exercises</p>
                                ) : (
                                  <ul className="space-y-0.5">
                                    {day.exercises.slice(0, 4).map((ex) => (
                                      <li key={ex.id} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                        {ex.exercise.name}
                                        <span className="text-gray-300 dark:text-gray-600">·{ex.sets}×{ex.repsMin ?? "?"}-{ex.repsMax ?? "?"}</span>
                                      </li>
                                    ))}
                                    {day.exercises.length > 4 && (
                                      <li className="text-xs text-gray-400 dark:text-gray-500 pl-2.5">+{day.exercises.length - 4} more</li>
                                    )}
                                  </ul>
                                )}
                                {isTodayDay && !isDoneInCurrentWeek && !isSkippedInCurrentWeek && (
                                  <Link href="/workout/today"
                                    className="mt-2 flex items-center justify-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                                    Start workout <ChevronRight className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
