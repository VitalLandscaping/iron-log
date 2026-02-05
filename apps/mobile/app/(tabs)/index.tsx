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
import { theme, MUSCLE_COLORS } from '@/constants/colors';
import { api, WorkoutTemplate, Workout } from '@/services/api';
import { useActiveWorkout } from '@/hooks/useActiveWorkout';

export default function HomeScreen() {
  const router = useRouter();
  const { startFromTemplate, activeWorkout } = useActiveWorkout();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingTemplate, setStartingTemplate] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [templatesData, workoutsData] = await Promise.all([
        api.getTemplates(),
        api.getWorkouts(1, 5),
      ]);
      setTemplates(templatesData);
      // Only show completed workouts
      setRecentWorkouts(workoutsData.filter((w) => w.endTime));
    } catch (error) {
      console.error('Failed to load data:', error);
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

  const handleStartFromTemplate = async (templateId: string) => {
    if (activeWorkout) {
      // Navigate to workout tab if there's already an active workout
      router.push('/(tabs)/workout');
      return;
    }

    setStartingTemplate(templateId);
    try {
      await startFromTemplate(templateId);
      router.push('/(tabs)/workout');
    } catch (error) {
      console.error('Failed to start from template:', error);
    } finally {
      setStartingTemplate(null);
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '--';
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

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
      {/* Active Workout Banner */}
      {activeWorkout && (
        <TouchableOpacity
          style={styles.activeWorkoutBanner}
          onPress={() => router.push('/(tabs)/workout')}
        >
          <View style={styles.activePulse} />
          <View style={styles.activeWorkoutInfo}>
            <Text style={styles.activeWorkoutTitle}>Workout in Progress</Text>
            <Text style={styles.activeWorkoutMeta}>
              {activeWorkout.exercises.length} exercises
              {activeWorkout.templateName && ` • ${activeWorkout.templateName}`}
            </Text>
          </View>
          <Text style={styles.activeWorkoutArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* Quick Start Section */}
      {templates.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Start</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
              <Text style={styles.seeAllText}>Manage</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateScroll}
          >
            {templates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={styles.templateCard}
                onPress={() => handleStartFromTemplate(template.id)}
                disabled={startingTemplate === template.id}
              >
                {startingTemplate === template.id ? (
                  <ActivityIndicator color={theme.accent} />
                ) : (
                  <>
                    <Text style={styles.templateCardName}>{template.name}</Text>
                    <Text style={styles.templateCardMeta}>
                      {template.exerciseCount ?? template.exercises?.length ?? 0} exercises
                    </Text>
                    <View style={styles.templateCardStart}>
                      <Text style={styles.templateCardStartText}>Start →</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recent Workouts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No workouts yet</Text>
            <Text style={styles.emptySubtext}>Complete your first workout to see it here</Text>
          </View>
        ) : (
          recentWorkouts.map((workout) => {
            const uniqueMuscles = [
              ...new Set(workout.exercises.map((e) => e.exercise?.muscleGroup).filter(Boolean)),
            ];

            return (
              <View key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <Text style={styles.workoutDate}>{formatDate(workout.date)}</Text>
                  <Text style={styles.workoutDuration}>{formatDuration(workout.durationMs)}</Text>
                </View>
                {workout.templateName && (
                  <Text style={styles.workoutTemplateName}>{workout.templateName}</Text>
                )}
                <View style={styles.workoutMeta}>
                  <Text style={styles.workoutExercises}>
                    {workout.exerciseCount ?? workout.exercises.length} exercises
                  </Text>
                  <View style={styles.muscleTags}>
                    {uniqueMuscles.slice(0, 3).map((muscle) => (
                      <View
                        key={muscle}
                        style={[
                          styles.muscleTag,
                          { backgroundColor: (MUSCLE_COLORS[muscle!] || theme.textMuted) + '22' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.muscleTagText,
                            { color: MUSCLE_COLORS[muscle!] || theme.textMuted },
                          ]}
                        >
                          {muscle}
                        </Text>
                      </View>
                    ))}
                    {uniqueMuscles.length > 3 && (
                      <Text style={styles.moreMuscles}>+{uniqueMuscles.length - 3}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Start Workout CTA (when no templates) */}
      {templates.length === 0 && !activeWorkout && (
        <TouchableOpacity
          style={styles.startWorkoutCta}
          onPress={() => router.push('/(tabs)/workout')}
        >
          <Text style={styles.startWorkoutCtaText}>Start a Workout</Text>
        </TouchableOpacity>
      )}

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
  activeWorkoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent + '22',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  activePulse: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.accent,
    marginRight: 12,
  },
  activeWorkoutInfo: {
    flex: 1,
  },
  activeWorkoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  activeWorkoutMeta: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginTop: 2,
  },
  activeWorkoutArrow: {
    fontSize: 20,
    color: theme.accent,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  seeAllText: {
    fontSize: 14,
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  templateScroll: {
    gap: 12,
    paddingRight: 16,
  },
  templateCard: {
    width: 160,
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  templateCardName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  templateCardMeta: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  templateCardStart: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: theme.accent + '22',
    borderRadius: 6,
  },
  templateCardStartText: {
    fontSize: 12,
    color: theme.accent,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
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
  workoutCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  workoutDuration: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  workoutTemplateName: {
    fontSize: 13,
    color: theme.accent,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  workoutExercises: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  muscleTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muscleTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  muscleTagText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
  },
  moreMuscles: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  startWorkoutCta: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  startWorkoutCtaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.bg,
    fontFamily: 'SpaceMono',
  },
  bottomSpacer: {
    height: 100,
  },
});
