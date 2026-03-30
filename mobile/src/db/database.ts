/**
 * WatermelonDB Database initialization for FitTrack mobile.
 *
 * Provides a singleton database instance used throughout the app.
 * Import `database` wherever you need to read/write local data.
 *
 * SETUP REQUIRED:
 * 1. npm install @nozbe/watermelondb @nozbe/with-observables
 * 2. Add to babel.config.js plugins: ["@nozbe/watermelondb/babel/plugin"]
 * 3. For iOS: pod install
 * 4. For Android: no extra native config needed
 */

import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import { schema } from "./schema";
import {
  ExerciseModel,
  WorkoutDayModel,
  SetLogModel,
  NutritionLogModel,
  HabitLogModel,
  SyncQueueModel,
} from "./models";

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // use JSI for better performance (React Native)
  onSetUpError: (error) => {
    console.error("[WatermelonDB] Setup error:", error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [
    ExerciseModel,
    WorkoutDayModel,
    SetLogModel,
    NutritionLogModel,
    HabitLogModel,
    SyncQueueModel,
  ],
});
