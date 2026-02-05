import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { theme, MUSCLE_COLORS, MUSCLE_GROUPS } from '@/constants/colors';
import { api, Exercise } from '@/services/api';
import { useWorkoutContext } from '@/context/WorkoutContext';

export default function ExercisePicker() {
  const router = useRouter();
  const { setPendingExerciseId } = useWorkoutContext();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await api.getExercises();
      setExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    let filtered = exercises;

    if (selectedMuscle) {
      filtered = filtered.filter((e) => e.muscleGroup === selectedMuscle);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [exercises, selectedMuscle, searchQuery]);

  const groupedExercises = useMemo(() => {
    if (selectedMuscle) {
      return [{ muscle: selectedMuscle, exercises: filteredExercises }];
    }

    const groups: Record<string, Exercise[]> = {};
    for (const exercise of filteredExercises) {
      if (!groups[exercise.muscleGroup]) {
        groups[exercise.muscleGroup] = [];
      }
      groups[exercise.muscleGroup].push(exercise);
    }

    return Object.entries(groups).map(([muscle, exs]) => ({
      muscle,
      exercises: exs,
    }));
  }, [filteredExercises, selectedMuscle]);

  const handleSelect = async (exercise: Exercise) => {
    setPendingExerciseId(exercise.id);
    router.back();
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    const muscleColor = MUSCLE_COLORS[item.muscleGroup] || theme.textMuted;

    return (
      <TouchableOpacity style={styles.exerciseRow} onPress={() => handleSelect(item)}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <View style={styles.tags}>
            <View style={[styles.categoryTag, { backgroundColor: theme.border }]}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGroup = ({ item }: { item: { muscle: string; exercises: Exercise[] } }) => {
    const muscleColor = MUSCLE_COLORS[item.muscle] || theme.textMuted;

    return (
      <View style={styles.group}>
        <View style={[styles.groupHeader, { borderLeftColor: muscleColor }]}>
          <Text style={[styles.groupTitle, { color: muscleColor }]}>{item.muscle}</Text>
          <Text style={styles.groupCount}>{item.exercises.length}</Text>
        </View>
        {item.exercises.map((exercise) => (
          <TouchableOpacity
            key={exercise.id}
            style={styles.exerciseRow}
            onPress={() => handleSelect(exercise)}
          >
            <View style={styles.exerciseInfo}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <View style={[styles.categoryTag, { backgroundColor: theme.border }]}>
                <Text style={styles.categoryText}>{exercise.category}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor={theme.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', ...MUSCLE_GROUPS]}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isSelected = item === 'All' ? !selectedMuscle : selectedMuscle === item;
            const muscleColor = item === 'All' ? theme.accent : MUSCLE_COLORS[item] || theme.textMuted;

            return (
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  isSelected && { backgroundColor: muscleColor + '33', borderColor: muscleColor },
                ]}
                onPress={() => setSelectedMuscle(item === 'All' ? null : item)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    isSelected && { color: muscleColor },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.filterList}
        />
      </View>

      <FlatList
        data={groupedExercises}
        keyExtractor={(item) => item.muscle}
        renderItem={renderGroup}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
    backgroundColor: theme.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.text,
    fontFamily: 'SpaceMono',
    borderWidth: 1,
    borderColor: theme.border,
  },
  filterContainer: {
    paddingBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  filterPillText: {
    fontSize: 13,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  group: {
    marginBottom: 20,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },
  groupCount: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  exerciseRow: {
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  exerciseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  tags: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
});
