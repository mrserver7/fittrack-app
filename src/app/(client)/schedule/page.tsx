import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { WEEKDAYS, getWeekStart, formatDate } from "@/lib/utils";
import { CalendarDays, Dumbbell, ChevronRight } from "lucide-react";
import WorkoutDayOptions from "@/components/workout/workout-day-options";
import ProgramSwitcher from "@/components/clients/program-switcher";
import { getT } from "@/lib/i18n/server";

export default async function SchedulePage() {
  const [session, t] = await Promise.all([auth(), getT()]);
  const clientId = session!.user!.id!;

  const todayDate = new Date();
  const todayWeekday = WEEKDAYS[todayDate.getDay()];
  const todayDayIndex = todayDate.getDay(); // 0=Sun
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

  // Day name translation helper
  const dayTranslations: Record<string, string> = {
    Sunday: t.programs.sunday,
    Monday: t.programs.monday,
    Tuesday: t.programs.tuesday,
    Wednesday: t.programs.wednesday,
    Thursday: t.programs.thursday,
    Friday: t.programs.friday,
    Saturday: t.programs.saturday,
  };
  const tDay = (day: string) => dayTranslations[day] ?? day;

  // No program
  if (activePrograms.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-6">{t.schedule.title}</h1>
        <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Dumbbell className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">{t.schedule.noProgramAssigned}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.schedule.noProgramSub}</p>
        </div>
      </div>
    );
  }

  // Multiple active programs — force selection
  if (activePrograms.length > 1) {
    return (
      <ProgramSwitcher
        programs={activePrograms.map((cp) => ({
          id: cp.id,
          name: cp.program.name,
          startDate: formatDate(cp.startDate),
          durationWeeks: cp.program.durationWeeks,
          weekCount: cp.program.weeks.length,
        }))}
      />
    );
  }

  // Single active program — show full schedule
  const cp = activePrograms[0];
  const program = cp.program;

  // Compute current program week
  const startDate = new Date(cp.startDate);
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const weekIdx = Math.floor(Math.max(0, daysSinceStart) / 7);
  const effectiveIdx = weekIdx % program.weeks.length;
  const currentProgramWeek = program.weeks[effectiveIdx];
  const currentWeekNumber = effectiveIdx + 1;

  // Get overrides + completed sessions this week
  const allDayIds = program.weeks.flatMap((w) => w.days.map((d) => d.id));
  const [overrides, completedThisWeek] = await Promise.all([
    prisma.workoutScheduleOverride.findMany({ where: { clientId, weekStartDate } }),
    prisma.sessionLog.findMany({
      where: { clientId, workoutDayId: { in: allDayIds }, status: "completed", scheduledDate: { gte: weekStartDate } },
      select: { workoutDayId: true },
    }),
  ]);

  const completedDayIds = new Set(completedThisWeek.map((s) => s.workoutDayId));
  const programDayLabels = new Set(currentProgramWeek?.days.map((d) => d.dayLabel) ?? []);
  const overrideTargets = new Set(
    overrides.filter((o) => o.action === "moved" && o.newDay).map((o) => o.newDay!)
  );

  // Helper: days from Monday (for ordering within the week)
  const daysFromMonday = (di: number) => (di === 0 ? 6 : di - 1);
  const todayOffset = daysFromMonday(todayDayIndex);

  // Compute available days for moving (relative to today — can't move to past days)
  function getAvailableDays(excludeDay: string): string[] {
    return WEEKDAYS.filter((day) => {
      if (programDayLabels.has(day)) return false;
      if (overrideTargets.has(day)) return false;
      if (day === excludeDay) return false;
      const dayOffset = daysFromMonday(WEEKDAYS.indexOf(day));
      if (dayOffset < todayOffset) return false; // past day
      return true;
    });
  }

  // For each weekday, compute effective workout (applying overrides)
  function getEffectiveDay(day: string) {
    const programDay = currentProgramWeek?.days.find((d) => d.dayLabel === day);
    const movedHere = overrides.find((o) => o.newDay === day && o.action === "moved");
    const movedAway = programDay ? overrides.find((o) => o.workoutDayId === programDay.id && o.action === "moved") : null;
    const skipped = programDay ? overrides.find((o) => o.workoutDayId === programDay.id && o.action === "skipped") : null;

    if (movedHere) {
      const src = currentProgramWeek?.days.find((d) => d.id === movedHere.workoutDayId);
      return { day: src ?? null, override: movedHere, skipped: null };
    }
    if (skipped) return { day: programDay ?? null, override: skipped, skipped: true };
    if (movedAway) return { day: null, override: movedAway, skipped: null };
    return { day: programDay ?? null, override: null, skipped: false };
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">{t.schedule.title}</h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
            {program.name} · {t.schedule.week} {currentWeekNumber} {t.schedule.of} {program.weeks.length} · {t.schedule.started} {formatDate(cp.startDate)}
          </p>
        </div>
        <Link href="/workout/today"
          className="ml-auto flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors">
          <Dumbbell className="w-4 h-4" />
          {t.workouts.todaysWorkout}
        </Link>
      </div>

      {/* This Week grid */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t.schedule.thisWeek}</h2>
        <div className="grid grid-cols-7 gap-1.5 mb-4">
          {WEEKDAYS.map((day) => {
            const isToday = day === todayWeekday;
            const dayOffset = daysFromMonday(WEEKDAYS.indexOf(day));
            const isPast = dayOffset < todayOffset;
            const { day: effectiveDay, override, skipped } = getEffectiveDay(day);
            const done = effectiveDay ? completedDayIds.has(effectiveDay.id) : false;
            const movedHereOverride = overrides.find((o) => o.newDay === day && o.action === "moved");
            const movedAwayOverride = override?.action === "moved" && !movedHereOverride ? override : null;

            let bg = "bg-gray-50 dark:bg-gray-800/50";
            let textColor = "text-gray-300 dark:text-gray-600";
            if (skipped) { bg = "bg-red-50 dark:bg-red-900/20"; textColor = "text-red-400"; }
            else if (movedAwayOverride) { bg = "bg-orange-50 dark:bg-orange-900/20"; textColor = "text-orange-500"; }
            else if (movedHereOverride && effectiveDay) { bg = "bg-orange-50 dark:bg-orange-900/20"; textColor = "text-orange-600"; }
            else if (done) { bg = "bg-emerald-50 dark:bg-emerald-900/30"; textColor = "text-emerald-600 dark:text-emerald-400"; }
            else if (effectiveDay) { bg = "bg-emerald-50 dark:bg-emerald-900/20"; textColor = "text-emerald-700 dark:text-emerald-400"; }

            return (
              <div key={day}
                className={`rounded-xl p-2 text-center relative ${bg} ${isToday ? "ring-2 ring-emerald-500" : ""} ${isPast ? "opacity-60" : ""}`}>
                <p className={`text-xs font-bold mb-1 ${isToday ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>
                  {day.slice(0, 3)}
                </p>
                {effectiveDay ? (
                  <p className={`text-xs font-medium ${textColor}`}>
                    {effectiveDay.exercises.length}ex
                    {done && " ✓"}
                  </p>
                ) : (
                  <p className={`text-xs ${textColor}`}>
                    {skipped ? "✕" : movedAwayOverride ? `→${movedAwayOverride.newDay?.slice(0, 3)}` : "—"}
                  </p>
                )}
                {isToday && effectiveDay && !done && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap gap-4">
          {[
            { color: "bg-emerald-400", label: t.schedule.scheduled },
            { color: "bg-emerald-700", label: t.schedule.completed },
            { color: "bg-red-400", label: t.schedule.skipped },
            { color: "bg-orange-400", label: t.schedule.moved },
            { color: "bg-gray-300 dark:bg-gray-600", label: t.schedule.restDay },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${l.color}`} />
              <span className="text-xs text-gray-400 dark:text-gray-500">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full Program */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">{t.schedule.fullProgram}</h2>
        <div className="space-y-6">
          {program.weeks.map((week) => {
            const isCurrent = program.weeks.indexOf(week) === effectiveIdx;
            return (
              <div key={week.id}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    isCurrent
                      ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  }`}>
                    {t.schedule.week} {week.weekNumber}{week.isDeload ? " 🔄" : ""}{isCurrent ? ` · ${t.schedule.current}` : ""}
                  </span>
                </div>

                {week.days.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.schedule.noWorkoutDays}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {week.days.map((day) => {
                      const isCurrentWeek = isCurrent;
                      const dayOffset = daysFromMonday(WEEKDAYS.indexOf(day.dayLabel));
                      const isPastDay = isCurrentWeek && dayOffset < todayOffset;
                      const isToday = isCurrentWeek && day.dayLabel === todayWeekday;

                      // Override state (only relevant for current week)
                      const skippedOverride = isCurrentWeek
                        ? overrides.find((o) => o.workoutDayId === day.id && o.action === "skipped")
                        : null;
                      const movedAwayOverride = isCurrentWeek
                        ? overrides.find((o) => o.workoutDayId === day.id && o.action === "moved")
                        : null;
                      const isDone = isCurrentWeek && completedDayIds.has(day.id);

                      // Whether skip/move options should show
                      const canReschedule = isCurrentWeek && !isPastDay && !isDone && !skippedOverride && !movedAwayOverride;
                      const availableDays = canReschedule ? getAvailableDays(day.dayLabel) : [];

                      let cardClass = "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700";
                      if (isDone) cardClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
                      else if (skippedOverride) cardClass = "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900";
                      else if (movedAwayOverride) cardClass = "bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900";
                      else if (isToday) cardClass = "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700 ring-1 ring-emerald-400";

                      return (
                        <div key={day.id} className={`p-3 rounded-xl border ${cardClass}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                {tDay(day.dayLabel)}
                                {isToday && <span className="ml-1.5 text-emerald-600 dark:text-emerald-400">· {t.schedule.today}</span>}
                              </span>
                              {isDone && <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400 font-bold">✓ {t.schedule.done}</span>}
                              {skippedOverride && <span className="ml-2 text-xs text-red-500 font-medium">{t.schedule.skipped}</span>}
                              {movedAwayOverride && (
                                <span className="ml-2 text-xs text-orange-500 font-medium">→ {tDay(movedAwayOverride.newDay!)}</span>
                              )}
                            </div>
                            {canReschedule && (
                              <WorkoutDayOptions
                                workoutDayId={day.id}
                                weekStartDate={weekStartDate}
                                originalDay={day.dayLabel}
                                scheduledDay={day.dayLabel}
                                availableDays={availableDays}
                              />
                            )}
                          </div>

                          {day.exercises.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500">{t.schedule.noExercisesYet}</p>
                          ) : (
                            <ul className="space-y-0.5">
                              {day.exercises.slice(0, 4).map((ex) => (
                                <li key={ex.id} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
                                  {ex.exercise.name}
                                  <span className="text-gray-300 dark:text-gray-600">
                                    · {ex.sets}×{ex.repsMin ?? "?"}–{ex.repsMax ?? "?"}
                                  </span>
                                </li>
                              ))}
                              {day.exercises.length > 4 && (
                                <li className="text-xs text-gray-400 dark:text-gray-500 pl-2.5">
                                  +{day.exercises.length - 4} {t.schedule.more}
                                </li>
                              )}
                            </ul>
                          )}

                          {isToday && !isDone && !skippedOverride && !movedAwayOverride && (
                            <Link href="/workout/today"
                              className="mt-2.5 flex items-center justify-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                              {t.schedule.startWorkout} <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
