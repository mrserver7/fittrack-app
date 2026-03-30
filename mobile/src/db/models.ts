/**
 * WatermelonDB Model definitions for FitTrack.
 *
 * Each model maps to a table in schema.ts and provides
 * typed access to columns plus any computed/derived values.
 */

import { Model } from "@nozbe/watermelondb";
import { field, text, date, readonly, json } from "@nozbe/watermelondb/decorators";

export class ExerciseModel extends Model {
  static table = "exercises";

  @text("server_id") serverId!: string;
  @text("name") name!: string;
  @text("category") category!: string;
  @text("primary_muscles") primaryMuscles!: string | null;
  @text("body_regions") bodyRegions!: string | null;
  @text("video_url") videoUrl!: string | null;
  @field("updated_at") updatedAt!: number;
}

export class WorkoutDayModel extends Model {
  static table = "workout_days";

  @text("server_id") serverId!: string;
  @text("day_label") dayLabel!: string;
  @field("week_number") weekNumber!: number;
  @text("program_name") programName!: string;
  @text("exercises_json") exercisesJson!: string;
  @field("updated_at") updatedAt!: number;

  get exercises() {
    try {
      return JSON.parse(this.exercisesJson || "[]");
    } catch {
      return [];
    }
  }
}

export class SetLogModel extends Model {
  static table = "set_logs";

  @text("server_id") serverId!: string | null;
  @text("session_id") sessionId!: string | null;
  @text("exercise_id") exerciseId!: string;
  @text("workout_exercise_id") workoutExerciseId!: string;
  @field("set_number") setNumber!: number;
  @field("weight_kg") weightKg!: number | null;
  @field("reps_actual") repsActual!: number | null;
  @field("rpe_actual") rpeActual!: number | null;
  @text("notes") notes!: string | null;
  @field("is_synced") isSynced!: boolean;
  @field("created_at") createdAt!: number;
}

export class NutritionLogModel extends Model {
  static table = "nutrition_logs";

  @text("server_id") serverId!: string | null;
  @text("date") logDate!: string;
  @text("meal") meal!: string;
  @text("name") name!: string | null;
  @field("calories") calories!: number | null;
  @field("protein") protein!: number | null;
  @field("carbs") carbs!: number | null;
  @field("fat") fat!: number | null;
  @field("is_synced") isSynced!: boolean;
  @field("created_at") createdAt!: number;
}

export class HabitLogModel extends Model {
  static table = "habit_logs";

  @text("server_id") serverId!: string | null;
  @text("habit_id") habitId!: string;
  @text("date") logDate!: string;
  @field("value") value!: number;
  @field("is_synced") isSynced!: boolean;
  @field("created_at") createdAt!: number;
}

export class SyncQueueModel extends Model {
  static table = "sync_queue";

  @text("action") action!: string;
  @text("endpoint") endpoint!: string;
  @text("payload") payload!: string;
  @field("retries") retries!: number;
  @field("created_at") createdAt!: number;
}
