import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { theme } from '@/constants/colors';
import { useActiveWorkout } from '@/hooks/useActiveWorkout';
import { useWorkoutContext } from '@/context/WorkoutContext';
import { TimerBar } from '@/components/TimerBar';
import { ExerciseCard } from '@/components/ExerciseCard';
import { PRCelebration } from '@/components/PRCelebration';

export default function WorkoutScreen() {
  const router = useRouter();
  const { consumePendingExercise } = useWorkoutContext();
  const {
    activeWorkout,
    isLoading,
    elapsedTime,
    restTimer,
    settings,
    startWorkout,
    copyLastWorkout,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    deleteSet,
    finishWorkout,
    startRestTimer,
    adjustRestTimer,
    skipRestTimer,
    refreshWorkout,
  } = useActiveWorkout();

  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [newPRs, setNewPRs] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);

  // Keep screen awake during active workout
  useEffect(() => {
    if (activeWorkout && settings?.keepScreenAwake) {
      activateKeepAwakeAsync('workout');
      return () => {
        deactivateKeepAwake('workout');
      };
    }
  }, [activeWorkout?.id, settings?.keepScreenAwake]);

  // Rest timer haptic when complete
  useEffect(() => {
    if (restTimer && restTimer.remaining === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      skipRestTimer();
    }
  }, [restTimer?.remaining, skipRestTimer]);

  // Listen for selected exercise from picker
  useFocusEffect(
    useCallback(() => {
      const exerciseId = consumePendingExercise();
      if (exerciseId && activeWorkout) {
        addExercise(exerciseId);
      }
    }, [consumePendingExercise, activeWorkout, addExercise]),
  );

  const handleStartEmpty = async () => {
    setIsStarting(true);
    try {
      await startWorkout();
    } catch (error) {
      Alert.alert('Error', 'Failed to start workout');
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyLast = async () => {
    setIsStarting(true);
    try {
      await copyLastWorkout();
    } catch (error) {
      Alert.alert('Error', 'Failed to copy last workout');
    } finally {
      setIsStarting(false);
    }
  };

  const handleAddExercise = () => {
    router.push('/exercise-picker');
  };


  const handleFinish = async () => {
    Alert.alert(
      'Finish Workout',
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            try {
              const prs = await finishWorkout();
              if (prs.length > 0) {
                setNewPRs(prs);
                setShowPRCelebration(true);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to finish workout');
            }
          },
        },
      ],
    );
  };

  const handleCompleteSet = (workoutExerciseId: string) => {
    startRestTimer(workoutExerciseId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Idle state - no active workout
  if (!activeWorkout) {
    return (
      <View style={styles.idleContainer}>
        <Text style={styles.idleTitle}>Ready to Train?</Text>
        <Text style={styles.idleSubtitle}>Start a new workout session</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleStartEmpty}
            disabled={isStarting}
          >
            {isStarting ? (
              <ActivityIndicator color={theme.bg} />
            ) : (
              <>
                <Text style={styles.buttonIcon}>▶</Text>
                <Text style={styles.primaryButtonText}>Start Empty Workout</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleCopyLast}
            disabled={isStarting}
          >
            <Text style={styles.buttonIcon}>↻</Text>
            <Text style={styles.secondaryButtonText}>Copy Last Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, styles.disabledButton]} disabled>
            <Text style={styles.buttonIcon}>📋</Text>
            <Text style={[styles.secondaryButtonText, styles.disabledText]}>
              From Template (Coming Soon)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Active workout state
  const currentRestTimer = restTimer
    ? activeWorkout.exercises.find((e) => e.id === restTimer.workoutExerciseId)
      ? restTimer
      : null
    : null;

  return (
    <View style={styles.container}>
      <TimerBar elapsedSeconds={elapsedTime} onFinish={handleFinish} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeWorkout.exercises.map((workoutExercise) => (
          <ExerciseCard
            key={workoutExercise.id}
            workoutExercise={workoutExercise}
            showRpe={settings?.rpeTrackingEnabled ?? false}
            restTimer={
              restTimer?.workoutExerciseId === workoutExercise.id
                ? { remaining: restTimer.remaining, total: restTimer.total }
                : null
            }
            onAddSet={(data) => addSet(workoutExercise.id, data)}
            onUpdateSet={(setId, data) => updateSet(setId, data)}
            onDeleteSet={(setId) => deleteSet(setId)}
            onCompleteSet={() => handleCompleteSet(workoutExercise.id)}
            onRemoveExercise={() => removeExercise(workoutExercise.id)}
            onSkipRest={skipRestTimer}
            onAdjustRest={adjustRestTimer}
          />
        ))}

        <TouchableOpacity style={styles.addExerciseButton} onPress={handleAddExercise}>
          <Text style={styles.addExerciseText}>+ Add Exercise</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <PRCelebration
        visible={showPRCelebration}
        newPRs={newPRs}
        onClose={() => {
          setShowPRCelebration(false);
          setNewPRs([]);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  idleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
    padding: 24,
  },
  idleTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  idleSubtitle: {
    fontSize: 16,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: theme.bg,
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  secondaryButton: {
    backgroundColor: theme.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  secondaryButtonText: {
    color: theme.text,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  buttonIcon: {
    fontSize: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: theme.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  addExerciseButton: {
    backgroundColor: theme.card,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderStyle: 'dashed',
  },
  addExerciseText: {
    color: theme.accent,
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
  bottomSpacer: {
    height: 100,
  },
});
