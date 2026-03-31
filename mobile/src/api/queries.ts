import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClientHomeData {
  stats: {
    completedCount: number;
    streak: number;
    adherence: number;
    todayDone: boolean;
    todayWorkoutLabel: string | null;
    pendingCheckins: number;
  };
  recentSessions: {
    id: string;
    status: string;
    scheduledDate: string;
    completedAt: string | null;
    durationMinutes: number | null;
    workoutDay: { dayLabel: string } | null;
  }[];
  personalRecords: {
    id: string;
    valueKg: number;
    repsAtPr: number | null;
    exercise: { name: string; category: string; primaryMuscles: string | null };
  }[];
  hasActiveProgram: boolean;
  programName: string | null;
}

export interface WorkoutExercise {
  id: string;
  order: number;
  sets: number;
  reps: number;
  weight: number | null;
  notes: string | null;
  sortOrder: number;
  exercise: { id: string; name: string; category: string; primaryMuscles?: string | null };
  substitutionExercise: { id: string; name: string } | null;
}

export interface TodayData {
  status: "no_program" | "empty_program" | "rest_day" | "workout" | "completed";
  programName?: string;
  todayWeekday?: string;
  weekStartDate?: string;
  clientProgramId?: string;
  sessionId?: string;
  workoutDay?: {
    id: string;
    dayLabel: string;
    exercises: WorkoutExercise[];
  };
  availableDays?: string[];
}

export interface TrainerDashboardData {
  stats: {
    totalClients: number;
    pendingClients: number;
    sessionsThisWeek: number;
    unreadNotifications: number;
  };
  recentSessions: {
    id: string;
    clientName: string;
    clientPhotoUrl: string | null;
    workoutLabel: string;
    completedAt: string | null;
  }[];
  activeClients: {
    id: string;
    name: string;
    photoUrl: string | null;
    sessionsCount: number;
    lastSession: string | null;
  }[];
}

export interface ClientListItem {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  status: string;
  tags: string | null;
  sessionsCount: number;
  lastSession: string | null;
  programName: string | null;
}

export interface TrainerAnalyticsData {
  totalSessions: number;
  weeklyData: { week: string; count: number }[];
  topExercises: { name: string; count: number }[];
  clientAdherence: { name: string; total: number; recent: number }[];
}

export interface ProgressData {
  measurements: {
    id: string;
    date: string;
    weight: number | null;
    bodyFat: number | null;
    notes: string | null;
  }[];
  sessions: {
    id: string;
    scheduledDate: string;
    completedAt: string | null;
    durationMinutes: number | null;
    status: string;
    workoutDay: { dayLabel: string } | null;
  }[];
  personalRecords: {
    id: string;
    valueKg: number;
    repsAtPr: number | null;
    exercise: { name: string; category: string };
  }[];
}

export interface ClientDetailData {
  client: {
    id: string;
    name: string;
    email: string;
    photoUrl: string | null;
    status: string;
    tags: string | null;
    createdAt: string;
  };
  stats: { totalSessions: number; lastSessionDate: string | null };
  activeProgram: { id: string; name: string; startDate: string } | null;
  recentSessions: {
    id: string;
    status: string;
    scheduledDate: string;
    completedAt: string | null;
    durationMinutes: number | null;
    workoutDay: { dayLabel: string } | null;
  }[];
  overrides: {
    id: string;
    action: string;
    originalDay: string;
    newDay: string | null;
    workoutDayLabel: string;
    createdAt: string;
  }[];
}

export interface TrainerMessagesData {
  clients: {
    id: string;
    name: string;
    photoUrl: string | null;
    lastMessage: string | null;
    lastMessageAt: string | null;
    unreadCount: number;
  }[];
}

export interface MessagesData {
  messages: {
    id: string;
    senderRole: string;
    senderId: string;
    body: string;
    createdAt: string;
    isRead: boolean;
  }[];
}

export interface CheckInsData {
  checkIns: {
    id: string;
    status: string;
    periodStart: string | null;
    periodEnd: string | null;
    submittedAt: string | null;
    trainerComment: string | null;
    createdAt: string;
    checkInForm: {
      id: string;
      title: string;
      questions: string;
    };
  }[];
}

// ─── Client Hooks ─────────────────────────────────────────────────────────────

export function useClientHome() {
  return useQuery<ClientHomeData>({
    queryKey: ["client-home"],
    queryFn: () => api.get("/api/mobile/client-home"),
    staleTime: 30_000,
  });
}

export function useToday(redo = false) {
  return useQuery<TodayData>({
    queryKey: ["today", redo],
    queryFn: () => api.get(`/api/mobile/today${redo ? "?redo=1" : ""}`),
    staleTime: 60_000,
  });
}

export function useProgress() {
  return useQuery<ProgressData>({
    queryKey: ["progress"],
    queryFn: () => api.get("/api/mobile/progress"),
    staleTime: 60_000,
  });
}

export function useMessages(clientId: string) {
  return useQuery<MessagesData>({
    queryKey: ["messages", clientId],
    queryFn: () => api.get(`/api/messages/${clientId}`),
    staleTime: 0,
    refetchInterval: 10_000,
  });
}

export function useCheckIns() {
  return useQuery<CheckInsData>({
    queryKey: ["checkins"],
    queryFn: () => api.get("/api/checkins"),
    staleTime: 30_000,
  });
}

// ─── Trainer Hooks ────────────────────────────────────────────────────────────

export function useTrainerDashboard() {
  return useQuery<TrainerDashboardData>({
    queryKey: ["trainer-dashboard"],
    queryFn: () => api.get("/api/mobile/trainer-dashboard"),
    staleTime: 30_000,
  });
}

export function useClients(search = "", status = "") {
  return useQuery<{ clients: ClientListItem[] }>({
    queryKey: ["clients", search, status],
    queryFn: () =>
      api.get(
        `/api/mobile/clients?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`
      ),
    staleTime: 30_000,
  });
}

export function useClientDetail(clientId: string) {
  return useQuery<ClientDetailData>({
    queryKey: ["client-detail", clientId],
    queryFn: () => api.get(`/api/mobile/client-detail/${clientId}`),
    staleTime: 30_000,
    enabled: !!clientId,
  });
}

export function useTrainerAnalytics() {
  return useQuery<TrainerAnalyticsData>({
    queryKey: ["trainer-analytics"],
    queryFn: () => api.get("/api/mobile/trainer-analytics"),
    staleTime: 60_000,
  });
}

export function useTrainerMessages() {
  return useQuery<TrainerMessagesData>({
    queryKey: ["trainer-messages"],
    queryFn: () => api.get("/api/mobile/trainer-messages"),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useStartSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      workoutDayId: string;
      clientProgramId: string;
      scheduledDate: string;
    }) => api.post<{ session: { id: string } }>("/api/sessions", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today"] }),
  });
}

export function useLogSet() {
  return useMutation({
    mutationFn: (body: {
      sessionId: string;
      exerciseId: string;
      workoutExerciseId: string;
      setNumber: number;
      weightKg: string;
      repsActual: string;
      clientId: string;
    }) => {
      const { sessionId, ...rest } = body;
      return api.post<{ set: { id: string } }>(`/api/sessions/${sessionId}/sets`, rest);
    },
  });
}

export function useCompleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      sessionId: string;
      overallFeedbackEmoji?: string;
      overallFeedbackText?: string;
      notes?: string;
    }) => {
      const { sessionId, ...rest } = body;
      return api.post(`/api/sessions/${sessionId}/complete`, rest);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today"] });
      qc.invalidateQueries({ queryKey: ["client-home"] });
    },
  });
}

export function useCreateOverride() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      workoutDayId: string;
      action: "skipped" | "moved";
      originalDay: string;
      weekStartDate: string;
      newDay?: string;
    }) => api.post("/api/workout/override", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today"] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { clientId: string; message: string }) =>
      api.post(`/api/messages/${body.clientId}`, { body: body.message }),
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["messages", variables.clientId] }),
  });
}

export function useSubmitCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { checkInId: string; responses: Record<string, string> }) =>
      api.post(`/api/checkins/${body.checkInId}/submit`, { responses: body.responses }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkins"] }),
  });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (body: { name?: string; email?: string; photoUrl?: string | null }) =>
      api.patch("/api/settings/profile", body),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      api.post("/api/settings/password", body),
  });
}

export function useApproveClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.post(`/api/clients/${clientId}/approve`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["trainer-dashboard"] });
    },
  });
}

export function useRejectClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api.post(`/api/clients/${clientId}/reject`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["trainer-dashboard"] });
    },
  });
}
