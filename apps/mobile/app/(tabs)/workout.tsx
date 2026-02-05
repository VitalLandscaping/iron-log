import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { theme, SUPERSET_COLORS } from '@/constants/colors';
import { useActiveWorkout } from '@/hooks/useActiveWorkout';
import { useWorkoutContext } from '@/context/WorkoutContext';
import { TimerBar } from '@/components/TimerBar';
import { ExerciseCard } from '@/components/ExerciseCard';
import { PRCelebration } from '@/components/PRCelebration';
import { api, WorkoutTemplate } from '@/services/api';

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
  } = useActiveWorkout();

  const [showPRCelebration, setShowPRCelebration] = useState(false);
  const [newPRs, setNewPRs] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);

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

  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true);
    setTemplatesLoading(true);
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleStartFromTemplate = async (templateId: string) => {
    setShowTemplateModal(false);
    setIsStarting(true);
    try {
      await startFromTemplate(templateId);
    } catch (error) {
      Alert.alert('Error', 'Failed to start from template');
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

  const handleSetSuperset = async (workoutExerciseId: string, tag: string | null) => {
    await updateExercise(workoutExerciseId, { supersetTag: tag });
  };

  // Group exercises by superset for visual grouping
  const groupedExercises = useMemo(() => {
    if (!activeWorkout) return [];

    const exercises = activeWorkout.exercises || [];
    const groups: { superset: string | null; exercises: typeof exercises }[] = [];
    let currentGroup: typeof exercises = [];
    let currentSuperset: string | null = null;

    for (const exercise of exercises) {
      const tag = exercise.supersetTag;

      if (tag === currentSuperset) {
        currentGroup.push(exercise);
      } else {
        if (currentGroup.length > 0) {
          groups.push({ superset: currentSuperset, exercises: currentGroup });
        }
        currentGroup = [exercise];
        currentSuperset = tag;
      }
    }

    if (currentGroup.length > 0) {
      groups.push({ superset: currentSuperset, exercises: currentGroup });
    }

    return groups;
  }, [activeWorkout?.exercises]);

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

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleOpenTemplateModal}
            disabled={isStarting}
          >
            <Text style={styles.buttonIcon}>📋</Text>
            <Text style={styles.secondaryButtonText}>From Template</Text>
          </TouchableOpacity>
        </View>

        {/* Template Selection Modal */}
        <Modal visible={showTemplateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Template</Text>
                <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              {templatesLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={theme.accent} />
                </View>
              ) : templates.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Text style={styles.modalEmptyText}>No templates yet</Text>
                  <Text style={styles.modalEmptySubtext}>
                    Create templates in Settings
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={templates}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.templateItem}
                      onPress={() => handleStartFromTemplate(item.id)}
                    >
                      <Text style={styles.templateName}>{item.name}</Text>
                      <Text style={styles.templateMeta}>
                        {item.exerciseCount ?? item.exercises?.length ?? 0} exercises
                      </Text>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.templateList}
                />
              )}
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Active workout state
  return (
    <View style={styles.container}>
      <TimerBar elapsedSeconds={elapsedTime} onFinish={handleFinish} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groupedExercises.map((group, groupIndex) => {
          const supersetColor = group.superset ? SUPERSET_COLORS[group.superset] : undefined;
          const groupExercises = group.exercises || [];
          const isSuperset = group.superset && groupExercises.length > 1;

          return (
            <View key={groupIndex}>
              {isSuperset && (
                <View style={[styles.supersetHeader, { borderLeftColor: supersetColor }]}>
                  <Text style={[styles.supersetLabel, { color: supersetColor }]}>
                    Superset {group.superset}
                  </Text>
                </View>
              )}
              {groupExercises.map((workoutExercise) => (
                <ExerciseCard
                  key={workoutExercise.id}
                  workoutExercise={workoutExercise}
                  showRpe={settings?.rpeTrackingEnabled ?? false}
                  barWeight={settings?.barWeight ?? 45}
                  availablePlates={settings?.availablePlates ?? [45, 35, 25, 10, 5, 2.5]}
                  defaultRestTimer={settings?.defaultRestTimerSec ?? 90}
                  supersetColor={workoutExercise.supersetTag ? SUPERSET_COLORS[workoutExercise.supersetTag] : undefined}
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
                  onSetSuperset={(tag) => handleSetSuperset(workoutExercise.id, tag)}
                  onUpdateRestTimer={(sec) => updateExercise(workoutExercise.id, { restTimerSec: sec })}
                />
              ))}
            </View>
          );
        })}

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  supersetHeader: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    marginBottom: 8,
  },
  supersetLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
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

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  modalClose: {
    fontSize: 28,
    color: theme.textMuted,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    fontSize: 16,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  modalEmptySubtext: {
    fontSize: 13,
    color: theme.textDim,
    fontFamily: 'SpaceMono',
  },
  templateList: {
    padding: 16,
  },
  templateItem: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  templateMeta: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
});
