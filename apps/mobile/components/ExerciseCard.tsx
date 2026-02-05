import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { theme, MUSCLE_COLORS } from '@/constants/colors';
import { WorkoutExercise, ExerciseSet, api } from '@/services/api';
import { SetRow } from './SetRow';
import { RestTimer } from './RestTimer';

const SUPERSET_TAGS = ['A', 'B', 'C', 'D', 'E'];

interface ExerciseCardProps {
  workoutExercise: WorkoutExercise;
  showRpe: boolean;
  restTimer: { remaining: number; total: number } | null;
  supersetColor?: string;
  onAddSet: (data: { setNumber: number; weight: number; reps: number }) => void;
  onUpdateSet: (setId: string, data: Partial<{ weight: number; reps: number; setType: string; rpe: number }>) => void;
  onDeleteSet: (setId: string) => void;
  onCompleteSet: (set: ExerciseSet) => void;
  onRemoveExercise: () => void;
  onSkipRest: () => void;
  onAdjustRest: (seconds: number) => void;
  onSetSuperset?: (tag: string | null) => void;
}

export function ExerciseCard({
  workoutExercise,
  showRpe,
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
}: ExerciseCardProps) {
  const [lastSession, setLastSession] = useState<string>('');
  const [menuVisible, setMenuVisible] = useState(false);
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

  const handleSetSupersetTag = (tag: string | null) => {
    setMenuVisible(false);
    onSetSuperset?.(tag);
  };

  return (
    <View style={[styles.container, supersetColor && styles.containerSuperset, supersetColor && { borderLeftColor: supersetColor }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.exerciseName}>{workoutExercise.exercise.name}</Text>
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
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
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
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  supersetPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  supersetText: {
    fontSize: 12,
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
