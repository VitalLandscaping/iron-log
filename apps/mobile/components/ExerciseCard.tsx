import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, MUSCLE_COLORS } from '@/constants/colors';
import { WorkoutExercise, ExerciseSet, api } from '@/services/api';
import { SetRow } from './SetRow';
import { RestTimer } from './RestTimer';

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  showRpe: boolean;
  restTimer: { remaining: number; total: number } | null;
  onAddSet: (data: { setNumber: number; weight: number; reps: number }) => void;
  onUpdateSet: (setId: string, data: Partial<{ weight: number; reps: number; setType: string; rpe: number }>) => void;
  onDeleteSet: (setId: string) => void;
  onCompleteSet: (set: ExerciseSet) => void;
  onRemoveExercise: () => void;
  onSkipRest: () => void;
  onAdjustRest: (seconds: number) => void;
}

export function ExerciseCard({
  workoutExercise,
  showRpe,
  restTimer,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onCompleteSet,
  onRemoveExercise,
  onSkipRest,
  onAdjustRest,
}: ExerciseCardProps) {
  const [lastSession, setLastSession] = useState<string>('');
  const muscleColor = MUSCLE_COLORS[workoutExercise.exercise.muscleGroup] || theme.textMuted;

  useEffect(() => {
    // Fetch last session data for this exercise
    api.getExerciseHistory(workoutExercise.exerciseId)
      .then((history) => {
        // Find the most recent session that isn't from today
        const today = new Date().toISOString().split('T')[0];
        const pastSession = history.sessions.find((s) => s.date !== today);
        if (pastSession && pastSession.sets.length > 0) {
          const setsStr = pastSession.sets
            .map((s) => `${s.weight}×${s.reps}`)
            .join(', ');
          setLastSession(setsStr);
        }
      })
      .catch(() => {});
  }, [workoutExercise.exerciseId]);

  const handleAddSet = () => {
    const nextSetNumber = workoutExercise.sets.length + 1;
    const lastSet = workoutExercise.sets[workoutExercise.sets.length - 1];
    onAddSet({
      setNumber: nextSetNumber,
      weight: lastSet?.weight ?? 0,
      reps: lastSet?.reps ?? 0,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{workoutExercise.exercise.name}</Text>
          <View style={[styles.musclePill, { backgroundColor: muscleColor + '33' }]}>
            <Text style={[styles.muscleText, { color: muscleColor }]}>
              {workoutExercise.exercise.muscleGroup}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onRemoveExercise} style={styles.removeButton}>
          <Text style={styles.removeButtonText}>×</Text>
        </TouchableOpacity>
      </View>

      {lastSession && (
        <Text style={styles.lastSession}>Last: {lastSession}</Text>
      )}

      <View style={styles.setsContainer}>
        {workoutExercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            showRpe={showRpe}
            onUpdate={(data) => onUpdateSet(set.id, data)}
            onComplete={() => onCompleteSet(set)}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.addSetButton} onPress={handleAddSet}>
        <Text style={styles.addSetButtonText}>+ Add Set</Text>
      </TouchableOpacity>

      {restTimer && (
        <RestTimer
          remaining={restTimer.remaining}
          total={restTimer.total}
          onSkip={onSkipRest}
          onAdjust={onAdjustRest}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  musclePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  muscleText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  removeButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    fontSize: 24,
    color: theme.textMuted,
    lineHeight: 24,
  },
  lastSession: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
  },
  setsContainer: {
    marginBottom: 8,
  },
  addSetButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  addSetButtonText: {
    color: theme.textMuted,
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
});
