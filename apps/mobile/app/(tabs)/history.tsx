import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { theme, MUSCLE_COLORS, MUSCLE_GROUPS } from '@/constants/colors';
import { api, PREntry, ExerciseWithHistory } from '@/services/api';

export default function HistoryScreen() {
  const router = useRouter();
  const [prs, setPRs] = useState<PREntry[]>([]);
  const [exercises, setExercises] = useState<ExerciseWithHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(MUSCLE_GROUPS));

  const loadData = async () => {
    try {
      const [prsData, exercisesData] = await Promise.all([
        api.getAllPRs(),
        api.getExercisesWithHistory(),
      ]);
      setPRs(prsData);
      setExercises(exercisesData);
    } catch (error) {
      console.error('Failed to load history data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const navigateToExercise = (exerciseId: string) => {
    router.push(`/exercise-detail/${exerciseId}` as any);
  };

  // Group exercises by muscle
  const groupedExercises = MUSCLE_GROUPS.reduce(
    (acc, group) => {
      const grouped = exercises.filter((e) => e.muscleGroup === group);
      if (grouped.length > 0) {
        acc[group] = grouped;
      }
      return acc;
    },
    {} as Record<string, ExerciseWithHistory[]>,
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
      }
    >
      {/* PR Board Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Records</Text>

        {prs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No PRs yet</Text>
            <Text style={styles.emptySubtext}>PRs will appear after your first workout</Text>
          </View>
        ) : (
          <View style={styles.prGrid}>
            {prs.map((pr) => {
              const muscleColor = MUSCLE_COLORS[pr.muscleGroup] || theme.textMuted;
              return (
                <TouchableOpacity
                  key={pr.exerciseId}
                  style={styles.prCard}
                  onPress={() => navigateToExercise(pr.exerciseId)}
                >
                  <Text style={styles.prExerciseName} numberOfLines={2}>
                    {pr.exerciseName}
                  </Text>
                  <Text style={styles.prWeight}>
                    {pr.weight} × {pr.reps}
                  </Text>
                  <Text style={styles.prE1rm}>Est. 1RM: {pr.e1rm} lbs</Text>
                  <View style={styles.prBottom}>
                    <View style={[styles.prMusclePill, { backgroundColor: muscleColor + '33' }]}>
                      <Text style={[styles.prMuscleText, { color: muscleColor }]}>
                        {pr.muscleGroup}
                      </Text>
                    </View>
                    <Text style={styles.prDate}>{pr.date}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Exercise Browser Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercise History</Text>

        {Object.keys(groupedExercises).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Start your first one! 💪</Text>
          </View>
        ) : (
          Object.entries(groupedExercises).map(([group, groupExercises]) => {
            const muscleColor = MUSCLE_COLORS[group] || theme.textMuted;
            const isExpanded = expandedGroups.has(group);

            return (
              <View key={group} style={styles.muscleGroup}>
                <TouchableOpacity
                  style={[styles.muscleGroupHeader, { borderLeftColor: muscleColor }]}
                  onPress={() => toggleGroup(group)}
                >
                  <Text style={[styles.muscleGroupTitle, { color: muscleColor }]}>{group}</Text>
                  <View style={styles.muscleGroupRight}>
                    <Text style={styles.muscleGroupCount}>{groupExercises.length}</Text>
                    <Text style={styles.chevron}>{isExpanded ? '▼' : '▶'}</Text>
                  </View>
                </TouchableOpacity>

                {isExpanded &&
                  groupExercises.map((exercise) => (
                    <TouchableOpacity
                      key={exercise.id}
                      style={styles.exerciseRow}
                      onPress={() => navigateToExercise(exercise.id)}
                    >
                      <View style={styles.exerciseInfo}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.exerciseMeta}>
                          <Text style={styles.exerciseMetaText}>
                            {exercise.sessionCount} session{exercise.sessionCount !== 1 ? 's' : ''}
                          </Text>
                          {exercise.maxWeight > 0 && (
                            <>
                              <Text style={styles.exerciseMetaDot}>•</Text>
                              <Text style={styles.exerciseMetaText}>{exercise.maxWeight} lbs</Text>
                            </>
                          )}
                        </View>
                      </View>
                      <Text style={styles.exerciseChevron}>›</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    fontSize: 16,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: theme.textDim,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },

  // PR Grid
  prGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  prCard: {
    width: '47%',
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.pr + '44',
  },
  prExerciseName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
    minHeight: 36,
  },
  prWeight: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.pr,
    fontFamily: 'SpaceMono',
  },
  prE1rm: {
    fontSize: 12,
    color: theme.accentBlue,
    fontFamily: 'SpaceMono',
    marginTop: 4,
    marginBottom: 10,
  },
  prBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prMusclePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  prMuscleText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  prDate: {
    fontSize: 10,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },

  // Exercise Browser
  muscleGroup: {
    marginBottom: 12,
  },
  muscleGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.border,
  },
  muscleGroupTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },
  muscleGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  muscleGroupCount: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  chevron: {
    fontSize: 10,
    color: theme.textMuted,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 14,
    marginTop: 6,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 14,
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseMetaText: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  exerciseMetaDot: {
    fontSize: 12,
    color: theme.textDim,
    marginHorizontal: 6,
  },
  exerciseChevron: {
    fontSize: 20,
    color: theme.textMuted,
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100,
  },
});
