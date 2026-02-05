import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { theme, MUSCLE_COLORS } from '@/constants/colors';
import { WorkoutExercise, ExerciseSet, api } from '@/services/api';
import { SetRow } from './SetRow';
import { RestTimer } from './RestTimer';
import { RestTimerOverride } from './RestTimerOverride';
import { RPEInfo } from './RPEInfo';
import { generateWarmupSets } from '@/services/warmupGenerator';
import { lightHaptic, warningHaptic } from '@/services/haptics';

const SUPERSET_TAGS = ['A', 'B', 'C', 'D', 'E'];

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  showRpe: boolean;
  barWeight: number;
  availablePlates: number[];
  defaultRestTimer: number;
  restTimer: { remaining: number; total: number } | null;
  supersetColor?: string;
  onAddSet: (data: { setNumber: number; weight: number; reps: number; setType?: string }) => void;
  onUpdateSet: (setId: string, data: Partial<{ weight: number; reps: number; setType: string; rpe: number }>) => void;
  onDeleteSet: (setId: string) => void;
  onCompleteSet: (set: ExerciseSet) => void;
  onRemoveExercise: () => void;
  onSkipRest: () => void;
  onAdjustRest: (seconds: number) => void;
  onSetSuperset?: (tag: string | null) => void;
  onUpdateRestTimer?: (restTimerSec: number | null) => void;
}

function calculateE1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps === 0 || weight === 0) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export function ExerciseCard({
  workoutExercise,
  showRpe,
  barWeight,
  availablePlates,
  defaultRestTimer,
  restTimer,
  supersetColor,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onCompleteSet,
  onRemoveExercise,
  onSkipRest,
  onAdjustRest,
  onSetSuperset,
  onUpdateRestTimer,
}: ExerciseCardProps) {
  const [lastSession, setLastSession] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [restTimerModalVisible, setRestTimerModalVisible] = useState(false);
  const [rpeInfoVisible, setRpeInfoVisible] = useState(false);
  const [generatingWarmups, setGeneratingWarmups] = useState(false);
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

  const sets = workoutExercise.sets || [];

  // Calculate estimated 1RM from best non-warmup set
  const estimated1RM = useMemo(() => {
    const normalSets = sets.filter(
      (s) => s.setType !== 'warmup' && s.weight > 0 && s.reps > 0
    );
    if (normalSets.length === 0) return 0;

    let best1RM = 0;
    for (const set of normalSets) {
      const e1rm = calculateE1RM(set.weight, set.reps);
      if (e1rm > best1RM) best1RM = e1rm;
    }
    return best1RM;
  }, [sets]);

  // Check if warmup sets already exist
  const hasWarmupSets = sets.some((s) => s.setType === 'warmup');

  // Get first working set weight for warmup generation
  const workingWeight = useMemo(() => {
    const normalSet = sets.find(
      (s) => s.setType === 'normal' && s.weight > 0
    );
    return normalSet?.weight ?? 0;
  }, [sets]);

  const handleAddSet = () => {
    lightHaptic();
    const nextSetNumber = sets.length + 1;
    const lastSet = sets[sets.length - 1];
    onAddSet({
      setNumber: nextSetNumber,
      weight: lastSet?.weight ?? 0,
      reps: lastSet?.reps ?? 0,
    });
  };

  const handleSetSupersetTag = (tag: string | null) => {
    setMenuVisible(false);
    onSetSuperset?.(tag);
  };

  const handleGenerateWarmups = async () => {
    if (workingWeight <= 0) {
      Alert.alert(
        'Enter Working Weight',
        'Please enter the weight for your first working set before generating warm-up sets.'
      );
      return;
    }

    setGeneratingWarmups(true);
    try {
      const warmups = generateWarmupSets(workingWeight, barWeight);

      // Add warmup sets - they should be added with lower set numbers to appear first
      // Since the API expects sequential set numbers, we need to add them and let the backend handle ordering
      for (let i = 0; i < warmups.length; i++) {
        const warmup = warmups[i];
        onAddSet({
          setNumber: i + 1,
          weight: warmup.weight,
          reps: warmup.reps,
          setType: 'warmup',
        });
      }
    } catch (error) {
      console.error('Failed to generate warmups:', error);
      Alert.alert('Error', 'Failed to generate warm-up sets');
    } finally {
      setGeneratingWarmups(false);
    }
  };

  const handleRestTimerSave = (value: number | null) => {
    onUpdateRestTimer?.(value);
  };

  return (
    <View style={[styles.container, supersetColor && styles.containerSuperset, supersetColor && { borderLeftColor: supersetColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <Text style={styles.exerciseName}>{workoutExercise.exercise.name}</Text>
            {onUpdateRestTimer && (
              <TouchableOpacity
                style={styles.timerButton}
                onPress={() => setRestTimerModalVisible(true)}
              >
                <Text style={[
                  styles.timerIcon,
                  workoutExercise.restTimerSec != null && styles.timerIconActive
                ]}>
                  ⏱
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.pills}>
            <View style={[styles.musclePill, { backgroundColor: muscleColor + '33' }]}>
              <Text style={[styles.muscleText, { color: muscleColor }]}>
                {workoutExercise.exercise.muscleGroup}
              </Text>
            </View>
            {workoutExercise.supersetTag && (
              <View style={[styles.supersetPill, { backgroundColor: supersetColor || theme.accentBlue }]}>
                <Text style={styles.supersetText}>{workoutExercise.supersetTag}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.headerRight}>
          {onSetSuperset && (
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
              <Text style={styles.menuButtonText}>⋮</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onRemoveExercise} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 1RM and Last Session */}
      <View style={styles.metaRow}>
        {estimated1RM > 0 && (
          <Text style={styles.e1rmText}>Est. 1RM: {estimated1RM} lbs</Text>
        )}
        {lastSession && (
          <Text style={styles.lastSession}>Last: {lastSession}</Text>
        )}
      </View>

      {/* RPE Info Button (when RPE is enabled) */}
      {showRpe && (
        <View style={styles.rpeInfoRow}>
          <TouchableOpacity
            style={styles.rpeInfoButton}
            onPress={() => setRpeInfoVisible(true)}
          >
            <Text style={styles.rpeInfoText}>RPE</Text>
            <Text style={styles.rpeInfoIcon}>?</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Warmup Sets Button */}
      {!hasWarmupSets && (
        <TouchableOpacity
          style={styles.warmupButton}
          onPress={handleGenerateWarmups}
          disabled={generatingWarmups}
        >
          <Text style={styles.warmupButtonText}>
            {generatingWarmups ? 'Generating...' : '+ Warm-up Sets'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Sets */}
      <View style={styles.setsContainer}>
        {sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            showRpe={showRpe}
            barWeight={barWeight}
            availablePlates={availablePlates}
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

      {/* Superset Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Superset</Text>

            {workoutExercise.supersetTag && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleSetSupersetTag(null)}
              >
                <Text style={styles.menuItemText}>Remove from superset</Text>
              </TouchableOpacity>
            )}

            <View style={styles.menuDivider} />

            <Text style={styles.menuSubtitle}>Link as superset:</Text>
            <View style={styles.tagGrid}>
              {SUPERSET_TAGS.map((tag) => {
                const isActive = workoutExercise.supersetTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagButton, isActive && styles.tagButtonActive]}
                    onPress={() => handleSetSupersetTag(tag)}
                  >
                    <Text style={[styles.tagButtonText, isActive && styles.tagButtonTextActive]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Rest Timer Override Modal */}
      <RestTimerOverride
        visible={restTimerModalVisible}
        currentValue={workoutExercise.restTimerSec}
        defaultValue={defaultRestTimer}
        onSave={handleRestTimerSave}
        onClose={() => setRestTimerModalVisible(false)}
      />

      {/* RPE Info Modal */}
      <RPEInfo
        visible={rpeInfoVisible}
        onClose={() => setRpeInfoVisible(false)}
      />
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
  containerSuperset: {
    borderLeftWidth: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    gap: 6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  timerButton: {
    padding: 4,
  },
  timerIcon: {
    fontSize: 16,
    opacity: 0.5,
  },
  timerIconActive: {
    opacity: 1,
  },
  pills: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  musclePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  muscleText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  supersetPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  supersetText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    color: theme.bg,
  },
  menuButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: theme.textMuted,
    fontWeight: 'bold',
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  e1rmText: {
    fontSize: 12,
    color: theme.accentBlue,
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  lastSession: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  rpeInfoRow: {
    marginBottom: 8,
  },
  rpeInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: 2,
  },
  rpeInfoText: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  rpeInfoIcon: {
    fontSize: 12,
    color: theme.accentBlue,
    fontWeight: 'bold',
  },
  warmupButton: {
    backgroundColor: theme.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  warmupButtonText: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
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

  // Menu Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  menuContainer: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: theme.border,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.border,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemText: {
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 12,
  },
  menuSubtitle: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
  },
  tagGrid: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  tagButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagButtonActive: {
    backgroundColor: theme.accentBlue,
  },
  tagButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  tagButtonTextActive: {
    color: theme.bg,
  },
});
