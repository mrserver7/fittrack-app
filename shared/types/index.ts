export type UserRole = "trainer" | "client" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAdmin?: boolean;
  trainerId?: string;
  photoUrl?: string | null;
}

export interface Program {
  id: string;
  name: string;
  description?: string | null;
  weeks: ProgramWeek[];
}

export interface ProgramWeek {
  id: string;
  weekNumber: number;
  days: WorkoutDay[];
}

export interface WorkoutDay {
  id: string;
  dayLabel: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: string;
  order: number;
  sets: number;
  reps: number;
  weight?: number | null;
  notes?: string | null;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string;
  };
}

export interface SessionLog {
  id: string;
  workoutDayId: string;
  scheduledDate: string;
  status: "in_progress" | "completed" | "skipped";
  notes?: string | null;
  startedAt: string;
  completedAt?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  photoUrl?: string | null;
  status: string;
  trainerId: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  read: boolean;
  createdAt: string;
}
