const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;

// Types
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  category: string;
  isCustom: boolean;
}

export interface ExerciseSet {
  id: string;
  workoutExerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  setType: string;
  rpe: number | null;
  isPersonalRecord: boolean;
}

export interface WorkoutExercise {
  id: string;
  workoutId: string;
  exerciseId: string;
  sortOrder: number;
  notes: string | null;
  restTimerSec: number | null;
  supersetTag: string | null;
  exercise: Exercise;
  sets: ExerciseSet[];
}

export interface Workout {
  id: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  durationMs: number | null;
  notes: string | null;
  templateName: string | null;
  exercises: WorkoutExercise[];
  exerciseCount?: number;
}

export interface ExerciseHistory {
  exercise: Exercise;
  sessions: {
    workoutId: string;
    date: string;
    startTime: string;
    sets: ExerciseSet[];
  }[];
}

export interface PR {
  weight: number;
  reps: number;
  date: string;
  isPersonalRecord: boolean;
}

export interface E1RM {
  estimated1RM: number;
  basedOn: {
    weight: number;
    reps: number;
  };
  date: string;
}

export interface UserSettings {
  defaultRestTimerSec: number;
  keepScreenAwake: boolean;
  rpeTrackingEnabled: boolean;
  availablePlates: number[];
  barWeight: number;
}

export interface SetInput {
  setNumber: number;
  weight: number;
  reps: number;
  setType?: string;
  rpe?: number;
}

export interface FinishWorkoutResponse {
  workout: Workout;
  newPRs: string[];
}

export interface TemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
  exercise: Exercise;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  exercises: TemplateExercise[];
  exerciseCount?: number;
}

export interface TemplateExerciseInput {
  exerciseId: string;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
}

export interface CreateTemplateInput {
  name: string;
  exercises: TemplateExerciseInput[];
}

// Stats types
export interface Streak {
  currentStreak: number;
  longestStreak: number;
}

export interface StatsSummary {
  totalWorkouts: number;
  totalSets: number;
  totalTimeMs: number;
  prCount: number;
  thisWeekSessions: number;
}

export interface PREntry {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  weight: number;
  reps: number;
  e1rm: number;
  date: string;
}

export interface ExerciseWithHistory {
  id: string;
  name: string;
  muscleGroup: string;
  category: string;
  sessionCount: number;
  maxWeight: number;
}

export interface BodyWeight {
  id: string;
  userId: string;
  date: string;
  weight: number;
  createdAt: string;
}

export interface ProgressPhoto {
  id: string;
  userId: string;
  date: string;
  imageUrl: string;
  createdAt: string;
}

// API Client
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const url = `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY ?? '',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export const api = {
  // Base methods
  get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'POST', body }),
  put: <T>(endpoint: string, body: unknown) => request<T>(endpoint, { method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: unknown) => request<T>(endpoint, { method: 'PATCH', body }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),

  // Workouts
  startWorkout: () => request<Workout>('/workouts', { method: 'POST' }),

  finishWorkout: (id: string) =>
    request<FinishWorkoutResponse>(`/workouts/${id}/finish`, { method: 'PATCH' }),

  getWorkouts: (page = 1, limit = 20) =>
    request<Workout[]>(`/workouts?page=${page}&limit=${limit}`),

  getLatestWorkout: () => request<Workout | null>('/workouts/latest'),

  deleteWorkout: (id: string) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),

  // Exercises in workout
  addExerciseToWorkout: (workoutId: string, exerciseId: string, sortOrder: number) =>
    request<WorkoutExercise>(`/workouts/${workoutId}/exercises`, {
      method: 'POST',
      body: { exerciseId, sortOrder },
    }),

  updateWorkoutExercise: (
    workoutId: string,
    workoutExerciseId: string,
    data: Partial<{ notes: string; restTimerSec: number; sortOrder: number; supersetTag: string }>,
  ) =>
    request<WorkoutExercise>(`/workouts/${workoutId}/exercises/${workoutExerciseId}`, {
      method: 'PATCH',
      body: data,
    }),

  removeExerciseFromWorkout: (workoutId: string, workoutExerciseId: string) =>
    request<void>(`/workouts/${workoutId}/exercises/${workoutExerciseId}`, { method: 'DELETE' }),

  addSet: (workoutId: string, workoutExerciseId: string, data: SetInput) =>
    request<ExerciseSet>(`/workouts/${workoutId}/exercises/${workoutExerciseId}/sets`, {
      method: 'POST',
      body: data,
    }),

  updateSet: (workoutId: string, setId: string, data: Partial<SetInput>) =>
    request<ExerciseSet>(`/workouts/${workoutId}/sets/${setId}`, {
      method: 'PATCH',
      body: data,
    }),

  deleteSet: (workoutId: string, setId: string) =>
    request<void>(`/workouts/${workoutId}/sets/${setId}`, { method: 'DELETE' }),

  // Exercises
  getExercises: (muscle?: string) =>
    request<Exercise[]>(muscle ? `/exercises?muscle=${encodeURIComponent(muscle)}` : '/exercises'),

  getExercise: (id: string) => request<Exercise>(`/exercises/${id}`),

  getExerciseHistory: (id: string) => request<ExerciseHistory>(`/exercises/${id}/history`),

  getExercisePR: (id: string) => request<PR | null>(`/exercises/${id}/pr`),

  getExercise1RM: (id: string) => request<E1RM | null>(`/exercises/${id}/1rm`),

  createExercise: (data: { name: string; muscleGroup: string; category: string }) =>
    request<Exercise>('/exercises', { method: 'POST', body: data }),

  // Settings
  getSettings: () => request<UserSettings>('/settings'),

  updateSettings: (data: Partial<UserSettings>) =>
    request<UserSettings>('/settings', { method: 'PATCH', body: data }),

  // Templates
  getTemplates: () => request<WorkoutTemplate[]>('/templates'),

  getTemplate: (id: string) => request<WorkoutTemplate>(`/templates/${id}`),

  createTemplate: (data: CreateTemplateInput) =>
    request<WorkoutTemplate>('/templates', { method: 'POST', body: data }),

  updateTemplate: (id: string, data: CreateTemplateInput) =>
    request<WorkoutTemplate>(`/templates/${id}`, { method: 'PATCH', body: data }),

  deleteTemplate: (id: string) =>
    request<void>(`/templates/${id}`, { method: 'DELETE' }),

  // Start from template
  startFromTemplate: (templateId: string) =>
    request<Workout>(`/workouts/from-template/${templateId}`, { method: 'POST' }),

  // Stats
  getStreak: () => request<Streak>('/stats/streak'),

  getSummary: () => request<StatsSummary>('/stats/summary'),

  getMuscleActivity: () => request<Record<string, number>>('/stats/muscle-activity'),

  // All PRs
  getAllPRs: () => request<PREntry[]>('/exercises/prs'),

  // Exercises with history
  getExercisesWithHistory: () => request<ExerciseWithHistory[]>('/exercises/with-history'),

  // Body Weight
  getBodyWeights: (days?: number) =>
    request<BodyWeight[]>(days ? `/bodyweight?days=${days}` : '/bodyweight'),

  logBodyWeight: (weight: number) =>
    request<BodyWeight>('/bodyweight', { method: 'POST', body: { weight } }),

  // Photos
  getPhotos: () => request<ProgressPhoto[]>('/photos'),

  uploadPhoto: async (imageUri: string): Promise<ProgressPhoto> => {
    const formData = new FormData();
    formData.append('photo', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'progress.jpg',
    } as any);

    const response = await fetch(`${BASE_URL}/photos/upload`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY ?? '' },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new ApiError(response.status, errorText || `HTTP ${response.status}`);
    }

    return response.json();
  },

  deletePhoto: (id: string) => request<void>(`/photos/${id}`, { method: 'DELETE' }),

  // Export
  exportWorkoutsCSV: async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}/export/workouts`, {
      headers: { 'x-api-key': API_KEY ?? '' },
    });
    return response.text();
  },

  exportBodyWeightCSV: async (): Promise<string> => {
    const response = await fetch(`${BASE_URL}/export/bodyweight`, {
      headers: { 'x-api-key': API_KEY ?? '' },
    });
    return response.text();
  },

  // Notifications
  registerDeviceToken: (token: string, platform: 'ios' | 'android') =>
    request<void>('/notifications/register', { method: 'POST', body: { token, platform } }),

  unregisterDeviceToken: (token: string) =>
    request<void>('/notifications/unregister', { method: 'DELETE', body: { token } }),
};
