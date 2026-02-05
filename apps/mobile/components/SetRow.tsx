import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, SET_TYPE_STYLES, SET_TYPES, RPE_VALUES } from '@/constants/colors';
import { ExerciseSet } from '@/services/api';

interface SetRowProps {
  set: ExerciseSet;
  showRpe: boolean;
  onUpdate: (data: { weight?: number; reps?: number; setType?: string; rpe?: number }) => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function SetRow({ set, showRpe, onUpdate, onComplete, onDelete }: SetRowProps) {
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [showRpeDropdown, setShowRpeDropdown] = useState(false);

  useEffect(() => {
    setWeight(set.weight.toString());
    setReps(set.reps.toString());
  }, [set.weight, set.reps]);

  const typeStyle = SET_TYPE_STYLES[set.setType] || SET_TYPE_STYLES.normal;

  const cycleSetType = () => {
    const currentIndex = SET_TYPES.indexOf(set.setType);
    const nextIndex = (currentIndex + 1) % SET_TYPES.length;
    onUpdate({ setType: SET_TYPES[nextIndex] });
  };

  const handleWeightBlur = () => {
    const numWeight = parseFloat(weight) || 0;
    if (numWeight !== set.weight) {
      onUpdate({ weight: numWeight });
    }
  };

  const handleRepsBlur = () => {
    const numReps = parseInt(reps, 10) || 0;
    if (numReps !== set.reps) {
      onUpdate({ reps: numReps });
    }
  };

  const handleRpeSelect = (value: number) => {
    onUpdate({ rpe: value });
    setShowRpeDropdown(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: typeStyle.bg }]}>
      <TouchableOpacity style={styles.setNumber} onPress={cycleSetType}>
        <Text style={[styles.setNumberText, { color: typeStyle.text }]}>
          {typeStyle.label || set.setNumber}
        </Text>
      </TouchableOpacity>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={setWeight}
          onBlur={handleWeightBlur}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textDim}
        />
        <Text style={styles.inputLabel}>lbs</Text>
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={reps}
          onChangeText={setReps}
          onBlur={handleRepsBlur}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={theme.textDim}
        />
        <Text style={styles.inputLabel}>reps</Text>
      </View>

      {showRpe && (
        <TouchableOpacity
          style={styles.rpeButton}
          onPress={() => setShowRpeDropdown(!showRpeDropdown)}
        >
          <Text style={styles.rpeText}>{set.rpe ?? '-'}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
        <Text style={styles.completeButtonText}>✓</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>🗑</Text>
      </TouchableOpacity>

      {showRpeDropdown && (
        <View style={styles.rpeDropdown}>
          {RPE_VALUES.map((value) => (
            <TouchableOpacity
              key={value}
              style={styles.rpeOption}
              onPress={() => handleRpeSelect(value)}
            >
              <Text style={styles.rpeOptionText}>{value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
    position: 'relative',
  },
  setNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  input: {
    backgroundColor: theme.border,
    color: theme.text,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 16,
    fontFamily: 'SpaceMono',
    width: 60,
    textAlign: 'center',
  },
  inputLabel: {
    color: theme.textMuted,
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'SpaceMono',
  },
  rpeButton: {
    backgroundColor: theme.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  rpeText: {
    color: theme.text,
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  completeButtonText: {
    fontSize: 18,
    color: theme.bg,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  rpeDropdown: {
    position: 'absolute',
    top: 44,
    right: 100,
    backgroundColor: theme.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    zIndex: 100,
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 150,
    padding: 4,
  },
  rpeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    margin: 2,
    backgroundColor: theme.border,
    borderRadius: 4,
  },
  rpeOptionText: {
    color: theme.text,
    fontSize: 12,
    fontFamily: 'SpaceMono',
  },
});
