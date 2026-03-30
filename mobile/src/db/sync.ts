/**
 * Offline Sync Engine for FitTrack mobile.
 *
 * Handles:
 * 1. Caching server data locally when online (pull)
 * 2. Queuing mutations when offline
 * 3. Flushing the sync queue when connectivity returns (push)
 * 4. Conflict resolution (server wins for reads, client wins for writes)
 *
 * Usage:
 *   import { syncEngine } from "@/src/db/sync";
 *   syncEngine.cacheExercises(exercises);
 *   syncEngine.queueAction("POST", "/api/nutrition", { ... });
 *   syncEngine.flushQueue(); // call when network comes back
 */

import { Q } from "@nozbe/watermelondb";
import { database } from "./database";
import {
  ExerciseModel,
  WorkoutDayModel,
  SetLogModel,
  NutritionLogModel,
  HabitLogModel,
  SyncQueueModel,
} from "./models";
import { api } from "@/src/api/client";

type Exercise = {
  id: string;
  name: string;
  category: string;
  primaryMuscles?: string | null;
  bodyRegions?: string | null;
  videoUrl?: string | null;
};

type WorkoutDay = {
  id: string;
  dayLabel: string;
  weekNumber: number;
  programName: string;
  exercises: unknown[];
};

export const syncEngine = {
  /**
   * Cache exercises from server into local DB
   */
  async cacheExercises(exercises: Exercise[]) {
    const collection = database.get<ExerciseModel>("exercises");
    await database.write(async () => {
      // Clear old cache
      const existing = await collection.query().fetch();
      for (const record of existing) {
        await record.destroyPermanently();
      }
      // Insert fresh data
      for (const ex of exercises) {
        await collection.create((record) => {
          record.serverId = ex.id;
          record.name = ex.name;
          record.category = ex.category;
          record.primaryMuscles = ex.primaryMuscles || null;
          record.bodyRegions = ex.bodyRegions || null;
          record.videoUrl = ex.videoUrl || null;
          record.updatedAt = Date.now();
        });
      }
    });
  },

  /**
   * Cache today's workout locally
   */
  async cacheWorkoutDay(workout: WorkoutDay) {
    const collection = database.get<WorkoutDayModel>("workout_days");
    await database.write(async () => {
      const existing = await collection.query(Q.where("server_id", workout.id)).fetch();
      if (existing.length > 0) {
        await existing[0].update((record) => {
          record.dayLabel = workout.dayLabel;
          record.weekNumber = workout.weekNumber;
          record.programName = workout.programName;
          record.exercisesJson = JSON.stringify(workout.exercises);
          record.updatedAt = Date.now();
        });
      } else {
        await collection.create((record) => {
          record.serverId = workout.id;
          record.dayLabel = workout.dayLabel;
          record.weekNumber = workout.weekNumber;
          record.programName = workout.programName;
          record.exercisesJson = JSON.stringify(workout.exercises);
          record.updatedAt = Date.now();
        });
      }
    });
  },

  /**
   * Get cached exercises (for offline use)
   */
  async getCachedExercises(): Promise<ExerciseModel[]> {
    return database.get<ExerciseModel>("exercises").query().fetch();
  },

  /**
   * Get cached workout day
   */
  async getCachedWorkoutDay(): Promise<WorkoutDayModel | null> {
    const records = await database
      .get<WorkoutDayModel>("workout_days")
      .query()
      .fetch();
    return records[0] || null;
  },

  /**
   * Save a set log locally (for offline workout logging)
   */
  async saveSetLog(data: {
    exerciseId: string;
    workoutExerciseId: string;
    setNumber: number;
    weightKg?: number;
    repsActual?: number;
    rpeActual?: number;
    notes?: string;
    sessionId?: string;
  }) {
    const collection = database.get<SetLogModel>("set_logs");
    await database.write(async () => {
      await collection.create((record) => {
        record.exerciseId = data.exerciseId;
        record.workoutExerciseId = data.workoutExerciseId;
        record.setNumber = data.setNumber;
        record.weightKg = data.weightKg ?? null;
        record.repsActual = data.repsActual ?? null;
        record.rpeActual = data.rpeActual ?? null;
        record.notes = data.notes || null;
        record.sessionId = data.sessionId || null;
        record.isSynced = false;
        record.createdAt = Date.now();
      });
    });
  },

  /**
   * Save a nutrition log locally
   */
  async saveNutritionLog(data: {
    date: string;
    meal: string;
    name?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  }) {
    const collection = database.get<NutritionLogModel>("nutrition_logs");
    await database.write(async () => {
      await collection.create((record) => {
        record.logDate = data.date;
        record.meal = data.meal;
        record.name = data.name || null;
        record.calories = data.calories ?? null;
        record.protein = data.protein ?? null;
        record.carbs = data.carbs ?? null;
        record.fat = data.fat ?? null;
        record.isSynced = false;
        record.createdAt = Date.now();
      });
    });
  },

  /**
   * Save a habit log locally
   */
  async saveHabitLog(data: { habitId: string; date: string; value: number }) {
    const collection = database.get<HabitLogModel>("habit_logs");
    await database.write(async () => {
      await collection.create((record) => {
        record.habitId = data.habitId;
        record.logDate = data.date;
        record.value = data.value;
        record.isSynced = false;
        record.createdAt = Date.now();
      });
    });
  },

  /**
   * Queue a generic API action for later sync
   */
  async queueAction(action: string, endpoint: string, payload: unknown) {
    const collection = database.get<SyncQueueModel>("sync_queue");
    await database.write(async () => {
      await collection.create((record) => {
        record.action = action;
        record.endpoint = endpoint;
        record.payload = JSON.stringify(payload);
        record.retries = 0;
        record.createdAt = Date.now();
      });
    });
  },

  /**
   * Flush all pending items in the sync queue.
   * Call this when the device comes back online.
   */
  async flushQueue(): Promise<{ synced: number; failed: number }> {
    const queue = await database
      .get<SyncQueueModel>("sync_queue")
      .query(Q.sortBy("created_at", "asc"))
      .fetch();

    let synced = 0;
    let failed = 0;

    for (const item of queue) {
      try {
        const payload = JSON.parse(item.payload);
        if (item.action === "POST") {
          await api.post(item.endpoint, payload);
        } else if (item.action === "PATCH") {
          await api.patch(item.endpoint, payload);
        } else if (item.action === "DELETE") {
          await api.delete(item.endpoint);
        }
        // Remove from queue on success
        await database.write(async () => {
          await item.destroyPermanently();
        });
        synced++;
      } catch {
        // Increment retry count, remove if too many retries
        await database.write(async () => {
          if (item.retries >= 5) {
            await item.destroyPermanently();
          } else {
            await item.update((record) => {
              record.retries = item.retries + 1;
            });
          }
        });
        failed++;
      }
    }

    // Also sync unsynced set logs
    const unsyncedSets = await database
      .get<SetLogModel>("set_logs")
      .query(Q.where("is_synced", false))
      .fetch();

    for (const setLog of unsyncedSets) {
      try {
        if (setLog.sessionId) {
          await api.post(`/api/sessions/${setLog.sessionId}/sets`, {
            exerciseId: setLog.exerciseId,
            workoutExerciseId: setLog.workoutExerciseId,
            setNumber: setLog.setNumber,
            weightKg: setLog.weightKg,
            repsActual: setLog.repsActual,
            rpeActual: setLog.rpeActual,
            notes: setLog.notes,
          });
          await database.write(async () => {
            await setLog.update((record) => {
              record.isSynced = true;
            });
          });
          synced++;
        }
      } catch {
        failed++;
      }
    }

    // Sync unsynced nutrition logs
    const unsyncedNutrition = await database
      .get<NutritionLogModel>("nutrition_logs")
      .query(Q.where("is_synced", false))
      .fetch();

    for (const log of unsyncedNutrition) {
      try {
        await api.post("/api/nutrition", {
          date: log.logDate,
          meal: log.meal,
          name: log.name,
          calories: log.calories,
          protein: log.protein,
          carbs: log.carbs,
          fat: log.fat,
        });
        await database.write(async () => {
          await log.update((record) => {
            record.isSynced = true;
          });
        });
        synced++;
      } catch {
        failed++;
      }
    }

    // Sync unsynced habit logs
    const unsyncedHabits = await database
      .get<HabitLogModel>("habit_logs")
      .query(Q.where("is_synced", false))
      .fetch();

    for (const log of unsyncedHabits) {
      try {
        await api.post("/api/habits/log", {
          habitId: log.habitId,
          date: log.logDate,
          value: log.value,
        });
        await database.write(async () => {
          await log.update((record) => {
            record.isSynced = true;
          });
        });
        synced++;
      } catch {
        failed++;
      }
    }

    return { synced, failed };
  },

  /**
   * Get count of pending sync items
   */
  async getPendingCount(): Promise<number> {
    const queueCount = await database
      .get<SyncQueueModel>("sync_queue")
      .query()
      .fetchCount();
    const unsyncedSets = await database
      .get<SetLogModel>("set_logs")
      .query(Q.where("is_synced", false))
      .fetchCount();
    const unsyncedNutrition = await database
      .get<NutritionLogModel>("nutrition_logs")
      .query(Q.where("is_synced", false))
      .fetchCount();
    const unsyncedHabits = await database
      .get<HabitLogModel>("habit_logs")
      .query(Q.where("is_synced", false))
      .fetchCount();
    return queueCount + unsyncedSets + unsyncedNutrition + unsyncedHabits;
  },
};
