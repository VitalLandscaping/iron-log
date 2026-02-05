import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { theme, MUSCLE_COLORS, MUSCLE_GROUPS } from '@/constants/colors';
import { api, Exercise, WorkoutTemplate, TemplateExerciseInput } from '@/services/api';

interface TemplateExerciseRow {
  id: string;
  exerciseId: string;
  exercise: Exercise;
  sortOrder: number;
  defaultSets: number;
  defaultReps: number;
}

export default function TemplateEditor() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<TemplateExerciseRow[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // Exercise picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  useEffect(() => {
    if (!isNew && id) {
      loadTemplate();
    }
  }, [id, isNew]);

  const loadTemplate = async () => {
    try {
      const template = await api.getTemplate(id!);
      setName(template.name);
      setExercises(
        template.exercises.map((te) => ({
          id: te.id,
          exerciseId: te.exerciseId,
          exercise: te.exercise,
          sortOrder: te.sortOrder,
          defaultSets: te.defaultSets,
          defaultReps: te.defaultReps,
        }))
      );
    } catch (error) {
      console.error('Failed to load template:', error);
      Alert.alert('Error', 'Failed to load template');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const loadExercisesForPicker = async () => {
    if (allExercises.length > 0) return;
    setPickerLoading(true);
    try {
      const data = await api.getExercises();
      setAllExercises(data);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setPickerLoading(false);
    }
  };

  const openPicker = () => {
    setPickerVisible(true);
    loadExercisesForPicker();
  };

  const filteredExercises = useMemo(() => {
    let filtered = allExercises;

    if (selectedMuscle) {
      filtered = filtered.filter((e) => e.muscleGroup === selectedMuscle);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => e.name.toLowerCase().includes(query));
    }

    return filtered;
  }, [allExercises, selectedMuscle, searchQuery]);

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

  const handleSelectExercise = (exercise: Exercise) => {
    const newExercise: TemplateExerciseRow = {
      id: `temp-${Date.now()}`,
      exerciseId: exercise.id,
      exercise,
      sortOrder: exercises.length,
      defaultSets: 3,
      defaultReps: 10,
    };
    setExercises([...exercises, newExercise]);
    setPickerVisible(false);
    setSearchQuery('');
    setSelectedMuscle(null);
  };

  const handleRemoveExercise = (exerciseId: string) => {
    Alert.alert('Remove Exercise', 'Are you sure you want to remove this exercise?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setExercises((prev) =>
            prev
              .filter((e) => e.id !== exerciseId)
              .map((e, idx) => ({ ...e, sortOrder: idx }))
          );
        },
      },
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setExercises((prev) => {
      const newList = [...prev];
      [newList[index - 1], newList[index]] = [newList[index], newList[index - 1]];
      return newList.map((e, idx) => ({ ...e, sortOrder: idx }));
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === exercises.length - 1) return;
    setExercises((prev) => {
      const newList = [...prev];
      [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
      return newList.map((e, idx) => ({ ...e, sortOrder: idx }));
    });
  };

  const handleUpdateSets = (exerciseId: string, sets: number) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, defaultSets: sets } : e))
    );
  };

  const handleUpdateReps = (exerciseId: string, reps: number) => {
    setExercises((prev) =>
      prev.map((e) => (e.id === exerciseId ? { ...e, defaultReps: reps } : e))
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Error', 'Please add at least one exercise');
      return;
    }

    setSaving(true);
    try {
      const templateData = {
        name: name.trim(),
        exercises: exercises.map((e, idx): TemplateExerciseInput => ({
          exerciseId: e.exerciseId,
          sortOrder: idx,
          defaultSets: e.defaultSets,
          defaultReps: e.defaultReps,
        })),
      };

      if (isNew) {
        await api.createTemplate(templateData);
      } else {
        await api.updateTemplate(id!, templateData);
      }

      router.back();
    } catch (error) {
      console.error('Failed to save template:', error);
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Name Input */}
        <View style={styles.nameSection}>
          <Text style={styles.label}>Template Name</Text>
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Template Name"
            placeholderTextColor={theme.textMuted}
            autoCapitalize="words"
          />
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.label}>Exercises</Text>

          {exercises.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises yet</Text>
              <Text style={styles.emptySubtext}>Add exercises to your template</Text>
            </View>
          ) : (
            exercises.map((exercise, index) => {
              const muscleColor = MUSCLE_COLORS[exercise.exercise.muscleGroup] || theme.textMuted;

              return (
                <View key={exercise.id} style={styles.exerciseRow}>
                  <View style={styles.exerciseHeader}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.exercise.name}</Text>
                      <View style={[styles.muscleTag, { backgroundColor: muscleColor + '22' }]}>
                        <Text style={[styles.muscleTagText, { color: muscleColor }]}>
                          {exercise.exercise.muscleGroup}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleRemoveExercise(exercise.id)}
                    >
                      <Text style={styles.deleteBtnText}>×</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.exerciseControls}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Sets</Text>
                      <View style={styles.numberControls}>
                        <TouchableOpacity
                          style={styles.numberBtn}
                          onPress={() =>
                            handleUpdateSets(exercise.id, Math.max(1, exercise.defaultSets - 1))
                          }
                        >
                          <Text style={styles.numberBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.numberValue}>{exercise.defaultSets}</Text>
                        <TouchableOpacity
                          style={styles.numberBtn}
                          onPress={() => handleUpdateSets(exercise.id, exercise.defaultSets + 1)}
                        >
                          <Text style={styles.numberBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Reps</Text>
                      <View style={styles.numberControls}>
                        <TouchableOpacity
                          style={styles.numberBtn}
                          onPress={() =>
                            handleUpdateReps(exercise.id, Math.max(1, exercise.defaultReps - 1))
                          }
                        >
                          <Text style={styles.numberBtnText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.numberValue}>{exercise.defaultReps}</Text>
                        <TouchableOpacity
                          style={styles.numberBtn}
                          onPress={() => handleUpdateReps(exercise.id, exercise.defaultReps + 1)}
                        >
                          <Text style={styles.numberBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.moveButtons}>
                      <TouchableOpacity
                        style={[styles.moveBtn, index === 0 && styles.moveBtnDisabled]}
                        onPress={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <Text style={[styles.moveBtnText, index === 0 && styles.moveBtnTextDisabled]}>
                          ↑
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.moveBtn,
                          index === exercises.length - 1 && styles.moveBtnDisabled,
                        ]}
                        onPress={() => handleMoveDown(index)}
                        disabled={index === exercises.length - 1}
                      >
                        <Text
                          style={[
                            styles.moveBtnText,
                            index === exercises.length - 1 && styles.moveBtnTextDisabled,
                          ]}
                        >
                          ↓
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <TouchableOpacity style={styles.addExerciseBtn} onPress={openPicker}>
            <Text style={styles.addExerciseBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Save Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Template'}</Text>
        </TouchableOpacity>
      </View>

      {/* Exercise Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Exercise</Text>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => {
                setPickerVisible(false);
                setSearchQuery('');
                setSelectedMuscle(null);
              }}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterList}
            >
              {['All', ...MUSCLE_GROUPS].map((item) => {
                const isSelected = item === 'All' ? !selectedMuscle : selectedMuscle === item;
                const muscleColor =
                  item === 'All' ? theme.accent : MUSCLE_COLORS[item] || theme.textMuted;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.filterPill,
                      isSelected && { backgroundColor: muscleColor + '33', borderColor: muscleColor },
                    ]}
                    onPress={() => setSelectedMuscle(item === 'All' ? null : item)}
                  >
                    <Text style={[styles.filterPillText, isSelected && { color: muscleColor }]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {pickerLoading ? (
            <View style={styles.pickerLoading}>
              <ActivityIndicator size="large" color={theme.accent} />
            </View>
          ) : (
            <FlatList
              data={groupedExercises}
              keyExtractor={(item) => item.muscle}
              renderItem={({ item }) => {
                const muscleColor = MUSCLE_COLORS[item.muscle] || theme.textMuted;

                return (
                  <View style={styles.pickerGroup}>
                    <View style={[styles.pickerGroupHeader, { borderLeftColor: muscleColor }]}>
                      <Text style={[styles.pickerGroupTitle, { color: muscleColor }]}>
                        {item.muscle}
                      </Text>
                      <Text style={styles.pickerGroupCount}>{item.exercises.length}</Text>
                    </View>
                    {item.exercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        style={styles.pickerExerciseRow}
                        onPress={() => handleSelectExercise(exercise)}
                      >
                        <Text style={styles.pickerExerciseName}>{exercise.name}</Text>
                        <View style={[styles.pickerCategoryTag]}>
                          <Text style={styles.pickerCategoryText}>{exercise.category}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              }}
              contentContainerStyle={styles.pickerListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  nameSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  nameInput: {
    backgroundColor: theme.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: theme.text,
    fontFamily: 'SpaceMono',
    borderWidth: 1,
    borderColor: theme.border,
  },
  exercisesSection: {
    marginBottom: 24,
  },
  emptyState: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 12,
  },
  emptyText: {
    color: theme.textMuted,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  emptySubtext: {
    color: theme.textDim,
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
  exerciseRow: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.text,
    fontFamily: 'SpaceMono',
    marginBottom: 6,
  },
  muscleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  muscleTagText: {
    fontSize: 11,
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  deleteBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 24,
    color: theme.danger,
    fontWeight: 'bold',
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  inputGroup: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 6,
  },
  numberControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numberBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberBtnText: {
    fontSize: 18,
    color: theme.text,
    fontWeight: 'bold',
  },
  numberValue: {
    fontSize: 16,
    color: theme.text,
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center',
  },
  moveButtons: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 'auto',
  },
  moveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveBtnDisabled: {
    opacity: 0.3,
  },
  moveBtnText: {
    fontSize: 16,
    color: theme.text,
    fontWeight: 'bold',
  },
  moveBtnTextDisabled: {
    color: theme.textMuted,
  },
  addExerciseBtn: {
    backgroundColor: theme.accent + '22',
    borderWidth: 1,
    borderColor: theme.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  addExerciseBtnText: {
    color: theme.accent,
    fontSize: 15,
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  bottomSpacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  saveBtn: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: theme.bg,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeBtnText: {
    color: theme.accent,
    fontSize: 15,
    fontFamily: 'SpaceMono',
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
  pickerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerListContent: {
    padding: 16,
    paddingTop: 8,
  },
  pickerGroup: {
    marginBottom: 20,
  },
  pickerGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 3,
  },
  pickerGroupTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textTransform: 'uppercase',
  },
  pickerGroupCount: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  pickerExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    borderRadius: 8,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  pickerExerciseName: {
    flex: 1,
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  pickerCategoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: theme.border,
  },
  pickerCategoryText: {
    fontSize: 11,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
});
