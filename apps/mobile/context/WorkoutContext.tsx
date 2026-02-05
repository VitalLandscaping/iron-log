import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface WorkoutContextType {
  pendingExerciseId: string | null;
  setPendingExerciseId: (id: string | null) => void;
  consumePendingExercise: () => string | null;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export function WorkoutProvider({ children }: { children: ReactNode }) {
  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(null);

  const consumePendingExercise = useCallback(() => {
    const id = pendingExerciseId;
    setPendingExerciseId(null);
    return id;
  }, [pendingExerciseId]);

  return (
    <WorkoutContext.Provider
      value={{
        pendingExerciseId,
        setPendingExerciseId,
        consumePendingExercise,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkoutContext() {
  const context = useContext(WorkoutContext);
  if (context === undefined) {
    throw new Error('useWorkoutContext must be used within a WorkoutProvider');
  }
  return context;
}
