import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, Workout, WorkoutExercise, ExerciseSet, SetInput, UserSettings } from '@/services/api';
import { successHaptic } from '@/services/haptics';

const ACTIVE_WORKOUT_KEY = 'iron-log-active-workout';

interface RestTimerState {
  workoutExerciseId: string;
  remaining: number;
  total: number;
}

interface UseActiveWorkoutReturn {
  activeWorkout: Workout | null;
  isLoading: boolean;
  elapsedTime: number;
  restTimer: RestTimerState | null;
  settings: UserSettings | null;
  startWorkout: () => Promise<void>;
  copyLastWorkout: () => Promise<void>;
  startFromTemplate: (templateId: string) => Promise<void>;
  addExercise: (exerciseId: string) => Promise<WorkoutExercise | null>;
  removeExercise: (workoutExerciseId: string) => Promise<void>;
  updateExercise: (workoutExerciseId: string, data: { supersetTag?: string | null; restTimerSec?: number | null }) => Promise<void>;
  addSet: (workoutExerciseId: string, data: SetInput) => Promise<ExerciseSet | null>;
  updateSet: (setId: string, data: Partial<SetInput>) => Promise<void>;
  deleteSet: (setId: string) => Promise<void>;
  finishWorkout: () => Promise<string[]>;
  startRestTimer: (workoutExerciseId: string, duration?: number) => void;
  adjustRestTimer: (adjustment: number) => void;
  skipRestTimer: () => void;
  refreshWorkout: () => Promise<void>;
}

export function useActiveWorkout(): UseActiveWorkoutReturn {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimer, setRestTimer] = useState<RestTimerState | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load settings
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  // Load active workout from storage on mount
  useEffect(() => {
    loadActiveWorkout();
  }, []);

  // Elapsed time timer
  useEffect(() => {
    if (activeWorkout && !activeWorkout.endTime) {
      const startTime = new Date(activeWorkout.startTime).getTime();

      const updateElapsed = () => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      };

      updateElapsed();
      elapsedIntervalRef.current = setInterval(updateElapsed, 1000);

      return () => {
        if (elapsedIntervalRef.current) {
          clearInterval(elapsedIntervalRef.current);
        }
      };
    } else {
      setElapsedTime(0);
    }
  }, [activeWorkout?.id, activeWorkout?.startTime, activeWorkout?.endTime]);

  // Rest timer countdown
  useEffect(() => {
    if (restTimer && restTimer.remaining > 0) {
      restIntervalRef.current = setInterval(() => {
        setRestTimer((prev) => {
          if (!prev || prev.remaining <= 1) {
            successHaptic(); // Rest timer complete
            return null;
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);

      return () => {
        if (restIntervalRef.current) {
          clearInterval(restIntervalRef.current);
        }
      };
    }
  }, [restTimer?.workoutExerciseId, restTimer?.total]);

  const loadActiveWorkout = async () => {
    try {
      const storedId = await AsyncStorage.getItem(ACTIVE_WORKOUT_KEY);
      if (storedId) {
        // Fetch the workout from server to get latest state
        const workouts = await api.getWorkouts(1, 50);
        const workout = workouts.find((w) => w.id === storedId && !w.endTime);
        if (workout) {
          // Fetch full workout details
          const fullWorkout = await fetchFullWorkout(storedId);
          if (fullWorkout) {
            setActiveWorkout(fullWorkout);
          }
        } else {
          // Workout was finished or deleted
          await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to load active workout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFullWorkout = async (workoutId: string): Promise<Workout | null> => {
    try {
      const workouts = await api.getWorkouts(1, 100);
      const workout = workouts.find((w) => w.id === workoutId);
      return workout || null;
    } catch {
      return null;
    }
  };

  const refreshWorkout = useCallback(async () => {
    if (!activeWorkout) return;
    const workouts = await api.getWorkouts(1, 100);
    const updated = workouts.find((w) => w.id === activeWorkout.id);
    if (updated) {
      setActiveWorkout(updated);
    }
  }, [activeWorkout?.id]);

  const startWorkout = useCallback(async () => {
    try {
      const workout = await api.startWorkout();
      setActiveWorkout(workout);
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, workout.id);
    } catch (error) {
      console.error('Failed to start workout:', error);
      throw error;
    }
  }, []);

  const copyLastWorkout = useCallback(async () => {
    try {
      const lastWorkout = await api.getLatestWorkout();
      if (!lastWorkout) {
        // No previous workout, just start empty
        await startWorkout();
        return;
      }

      // Start a new workout
      const newWorkout = await api.startWorkout();
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, newWorkout.id);

      // Copy exercises and sets
      for (const exercise of lastWorkout.exercises) {
        const newExercise = await api.addExerciseToWorkout(
          newWorkout.id,
          exercise.exerciseId,
          exercise.sortOrder,
        );

        // Copy sets
        for (const set of exercise.sets) {
          await api.addSet(newWorkout.id, newExercise.id, {
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            setType: set.setType,
            rpe: set.rpe ?? undefined,
          });
        }
      }

      // Refresh to get full state
      const workouts = await api.getWorkouts(1, 100);
      const updated = workouts.find((w) => w.id === newWorkout.id);
      setActiveWorkout(updated || newWorkout);
    } catch (error) {
      console.error('Failed to copy last workout:', error);
      throw error;
    }
  }, [startWorkout]);

  const startFromTemplate = useCallback(async (templateId: string) => {
    try {
      const workout = await api.startFromTemplate(templateId);
      setActiveWorkout(workout);
      await AsyncStorage.setItem(ACTIVE_WORKOUT_KEY, workout.id);
    } catch (error) {
      console.error('Failed to start from template:', error);
      throw error;
    }
  }, []);

  const addExercise = useCallback(
    async (exerciseId: string): Promise<WorkoutExercise | null> => {
      if (!activeWorkout) return null;
      try {
        const sortOrder = activeWorkout.exercises.length;
        const exercise = await api.addExerciseToWorkout(activeWorkout.id, exerciseId, sortOrder);
        await refreshWorkout();
        return exercise;
      } catch (error) {
        console.error('Failed to add exercise:', error);
        return null;
      }
    },
    [activeWorkout?.id, refreshWorkout],
  );

  const removeExercise = useCallback(
    async (workoutExerciseId: string) => {
      if (!activeWorkout) return;
      try {
        await api.removeExerciseFromWorkout(activeWorkout.id, workoutExerciseId);
        await refreshWorkout();
      } catch (error) {
        console.error('Failed to remove exercise:', error);
      }
    },
    [activeWorkout?.id, refreshWorkout],
  );

  const updateExercise = useCallback(
    async (workoutExerciseId: string, data: { supersetTag?: string | null; restTimerSec?: number | null }) => {
      if (!activeWorkout) return;
      try {
        // Convert null to undefined for API compatibility
        const apiData: { supersetTag?: string; restTimerSec?: number } = {};
        if (data.supersetTag !== undefined) {
          apiData.supersetTag = data.supersetTag === null ? undefined : data.supersetTag;
        }
        if (data.restTimerSec !== undefined) {
          apiData.restTimerSec = data.restTimerSec === null ? undefined : data.restTimerSec;
        }
        await api.updateWorkoutExercise(activeWorkout.id, workoutExerciseId, apiData);
        await refreshWorkout();
      } catch (error) {
        console.error('Failed to update exercise:', error);
      }
    },
    [activeWorkout?.id, refreshWorkout],
  );

  const addSet = useCallback(
    async (workoutExerciseId: string, data: SetInput): Promise<ExerciseSet | null> => {
      if (!activeWorkout) return null;
      try {
        const set = await api.addSet(activeWorkout.id, workoutExerciseId, data);
        await refreshWorkout();
        return set;
      } catch (error) {
        console.error('Failed to add set:', error);
        return null;
      }
    },
    [activeWorkout?.id, refreshWorkout],
  );

  const updateSet = useCallback(
    async (setId: string, data: Partial<SetInput>) => {
      if (!activeWorkout) return;
      try {
        await api.updateSet(activeWorkout.id, setId, data);
        await refreshWorkout();
      } catch (error) {
        console.error('Failed to update set:', error);
      }
    },
    [activeWorkout?.id, refreshWorkout],
  );

  const deleteSet = useCallback(
    async (setId: string) => {
      if (!activeWorkout) return;
      try {
        await api.deleteSet(activeWorkout.id, setId);
        await refreshWorkout();
      } catch (error) {
        console.error('Failed to delete set:', error);
      }
    },
    [activeWorkout?.id, refreshWorkout],
  );

  const finishWorkout = useCallback(async (): Promise<string[]> => {
    if (!activeWorkout) return [];
    try {
      const result = await api.finishWorkout(activeWorkout.id);
      await AsyncStorage.removeItem(ACTIVE_WORKOUT_KEY);
      setActiveWorkout(null);
      setRestTimer(null);
      successHaptic(); // Workout finished
      return result.newPRs;
    } catch (error) {
      console.error('Failed to finish workout:', error);
      throw error;
    }
  }, [activeWorkout?.id]);

  const startRestTimer = useCallback(
    (workoutExerciseId: string, duration?: number) => {
      const exercise = activeWorkout?.exercises.find((e) => e.id === workoutExerciseId);
      const restDuration =
        duration ?? exercise?.restTimerSec ?? settings?.defaultRestTimerSec ?? 90;

      setRestTimer({
        workoutExerciseId,
        remaining: restDuration,
        total: restDuration,
      });
    },
    [activeWorkout?.exercises, settings?.defaultRestTimerSec],
  );

  const adjustRestTimer = useCallback((adjustment: number) => {
    setRestTimer((prev) => {
      if (!prev) return null;
      const newRemaining = Math.max(0, prev.remaining + adjustment);
      return { ...prev, remaining: newRemaining };
    });
  }, []);

  const skipRestTimer = useCallback(() => {
    setRestTimer(null);
  }, []);

  return {
    activeWorkout,
    isLoading,
    elapsedTime,
    restTimer,
    settings,
    startWorkout,
    copyLastWorkout,
    startFromTemplate,
    addExercise,
    removeExercise,
    updateExercise,
    addSet,
    updateSet,
    deleteSet,
    finishWorkout,
    startRestTimer,
    adjustRestTimer,
    skipRestTimer,
    refreshWorkout,
  };
}
