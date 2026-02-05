import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { theme, MUSCLE_COLORS } from '@/constants/colors';
import { api, ExerciseHistory, PR, E1RM } from '@/services/api';
import WeightChart from '@/components/WeightChart';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [history, setHistory] = useState<ExerciseHistory | null>(null);
  const [pr, setPR] = useState<PR | null>(null);
  const [e1rm, setE1RM] = useState<E1RM | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const loadData = async () => {
    if (!id) return;
    try {
      const [historyData, prData, e1rmData] = await Promise.all([
        api.getExerciseHistory(id),
        api.getExercisePR(id),
        api.getExercise1RM(id),
      ]);
      setHistory(historyData);
      setPR(prData);
      setE1RM(e1rmData);
    } catch (error) {
      console.error('Failed to load exercise data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [id]),
  );

  const toggleSession = (workoutId: string) => {
    setExpandedSessions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  };

  // Prepare chart data - max weight per session
  const chartData =
    history?.sessions
      .map((session) => {
        const maxWeight = Math.max(...session.sets.map((s) => s.weight), 0);
        return {
          date: session.date,
          weight: maxWeight,
        };
      })
      .filter((d) => d.weight > 0)
      .reverse() || [];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (!history) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Exercise not found</Text>
      </View>
    );
  }

  const muscleColor = MUSCLE_COLORS[history.exercise.muscleGroup] || theme.textMuted;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'‹'} Back</Text>
        </TouchableOpacity>
        <Text style={styles.exerciseName}>{history.exercise.name}</Text>
        <View style={[styles.musclePill, { backgroundColor: muscleColor + '33' }]}>
          <Text style={[styles.muscleText, { color: muscleColor }]}>
            {history.exercise.muscleGroup}
          </Text>
        </View>
      </View>

      {/* PR Card */}
      {pr && (
        <View style={styles.prCard}>
          <View style={styles.prHeader}>
            <Text style={styles.prEmoji}>🏆</Text>
            <Text style={styles.prLabel}>Personal Record</Text>
          </View>
          <Text style={styles.prWeight}>
            {pr.weight} lbs × {pr.reps} reps
          </Text>
          <Text style={styles.prDate}>Achieved {formatDate(pr.date)}</Text>
        </View>
      )}

      {/* E1RM Card */}
      {e1rm && (
        <View style={styles.e1rmCard}>
          <Text style={styles.e1rmLabel}>Estimated 1RM</Text>
          <Text style={styles.e1rmValue}>{e1rm.estimated1RM} lbs</Text>
          <Text style={styles.e1rmBasis}>
            From: {e1rm.basedOn.weight} lbs × {e1rm.basedOn.reps} reps
          </Text>
        </View>
      )}

      {/* Weight Progression Chart */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weight Progression</Text>
        <WeightChart data={chartData} />
      </View>

      {/* Session History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Session History</Text>
        {history.sessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No sessions yet</Text>
          </View>
        ) : (
          history.sessions.map((session) => {
            const isExpanded = expandedSessions.has(session.workoutId);
            const totalSets = session.sets.length;
            const maxWeight = Math.max(...session.sets.map((s) => s.weight), 0);
            const totalReps = session.sets.reduce((sum, s) => sum + s.reps, 0);

            return (
              <View key={session.workoutId} style={styles.sessionCard}>
                <TouchableOpacity
                  style={styles.sessionHeader}
                  onPress={() => toggleSession(session.workoutId)}
                >
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
                    <Text style={styles.sessionSummary}>
                      {totalSets} sets • {maxWeight} lbs max • {totalReps} total reps
                    </Text>
                  </View>
                  <Text style={styles.chevron}>{isExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.setsContainer}>
                    {session.sets.map((set, index) => (
                      <View key={set.id} style={styles.setRow}>
                        <Text style={styles.setNumber}>{index + 1}</Text>
                        <Text style={styles.setWeight}>{set.weight} lbs</Text>
                        <Text style={styles.setReps}>{set.reps} reps</Text>
                        {set.rpe != null && <Text style={styles.setRpe}>RPE {set.rpe}</Text>}
                        {set.isPersonalRecord && <Text style={styles.prBadge}>PR</Text>}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
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
  errorText: {
    fontSize: 16,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },

  // Header
  header: {
    marginBottom: 20,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 16,
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
  },
  musclePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  muscleText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },

  // PR Card
  prCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.pr,
  },
  prHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  prEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  prLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.pr,
    fontFamily: 'SpaceMono',
  },
  prWeight: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  prDate: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },

  // E1RM Card
  e1rmCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.accentBlue + '44',
  },
  e1rmLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  e1rmValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.accentBlue,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  e1rmBasis: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 12,
  },

  // Empty state
  emptyState: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  emptyText: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },

  // Session Card
  sessionCard: {
    backgroundColor: theme.card,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  sessionSummary: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  chevron: {
    fontSize: 10,
    color: theme.textMuted,
  },

  // Sets Container
  setsContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.border,
    padding: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  setNumber: {
    width: 24,
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
  setWeight: {
    width: 70,
    fontSize: 14,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  setReps: {
    width: 60,
    fontSize: 14,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  setRpe: {
    fontSize: 12,
    color: theme.accentBlue,
    fontFamily: 'SpaceMono',
  },
  prBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.pr,
    backgroundColor: theme.pr + '33',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontFamily: 'SpaceMono',
    overflow: 'hidden',
  },

  bottomSpacer: {
    height: 40,
  },
});
