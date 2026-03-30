/**
 * WatermelonDB Schema for FitTrack offline mode.
 *
 * This caches key data locally so the app works without network connectivity.
 * Changes made offline are queued in `sync_queue` and pushed when connection returns.
 *
 * Setup: `npm install @nozbe/watermelondb` in the mobile directory,
 * then add the Babel plugin `@nozbe/watermelondb/babel/plugin` to babel.config.js.
 */

import { appSchema, tableSchema } from "@nozbe/watermelondb";

export const schema = appSchema({
  version: 1,
  tables: [
    // Cached exercises (read-only offline)
    tableSchema({
      name: "exercises",
      columns: [
        { name: "server_id", type: "string" },
        { name: "name", type: "string" },
        { name: "category", type: "string" },
        { name: "primary_muscles", type: "string", isOptional: true },
        { name: "body_regions", type: "string", isOptional: true },
        { name: "video_url", type: "string", isOptional: true },
        { name: "updated_at", type: "number" },
      ],
    }),

    // Cached workout day (today's workout)
    tableSchema({
      name: "workout_days",
      columns: [
        { name: "server_id", type: "string" },
        { name: "day_label", type: "string" },
        { name: "week_number", type: "number" },
        { name: "program_name", type: "string" },
        { name: "exercises_json", type: "string" }, // JSON array of workout exercises
        { name: "updated_at", type: "number" },
      ],
    }),

    // Locally created sets (synced up when online)
    tableSchema({
      name: "set_logs",
      columns: [
        { name: "server_id", type: "string", isOptional: true },
        { name: "session_id", type: "string", isOptional: true },
        { name: "exercise_id", type: "string" },
        { name: "workout_exercise_id", type: "string" },
        { name: "set_number", type: "number" },
        { name: "weight_kg", type: "number", isOptional: true },
        { name: "reps_actual", type: "number", isOptional: true },
        { name: "rpe_actual", type: "number", isOptional: true },
        { name: "notes", type: "string", isOptional: true },
        { name: "is_synced", type: "boolean" },
        { name: "created_at", type: "number" },
      ],
    }),

    // Nutrition logs (created offline, synced later)
    tableSchema({
      name: "nutrition_logs",
      columns: [
        { name: "server_id", type: "string", isOptional: true },
        { name: "date", type: "string" },
        { name: "meal", type: "string" },
        { name: "name", type: "string", isOptional: true },
        { name: "calories", type: "number", isOptional: true },
        { name: "protein", type: "number", isOptional: true },
        { name: "carbs", type: "number", isOptional: true },
        { name: "fat", type: "number", isOptional: true },
        { name: "is_synced", type: "boolean" },
        { name: "created_at", type: "number" },
      ],
    }),

    // Habit logs (created offline, synced later)
    tableSchema({
      name: "habit_logs",
      columns: [
        { name: "server_id", type: "string", isOptional: true },
        { name: "habit_id", type: "string" },
        { name: "date", type: "string" },
        { name: "value", type: "number" },
        { name: "is_synced", type: "boolean" },
        { name: "created_at", type: "number" },
      ],
    }),

    // Generic sync queue for any pending operations
    tableSchema({
      name: "sync_queue",
      columns: [
        { name: "action", type: "string" },   // "POST", "PATCH", "DELETE"
        { name: "endpoint", type: "string" },  // API path
        { name: "payload", type: "string" },   // JSON body
        { name: "retries", type: "number" },
        { name: "created_at", type: "number" },
      ],
    }),
  ],
});
