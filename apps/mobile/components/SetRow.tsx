import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { theme, SET_TYPE_STYLES, SET_TYPES } from '@/constants/colors';
import { ExerciseSet } from '@/services/api';
import { RPEPicker } from './RPEPicker';
import { PlateCalculator } from './PlateCalculator';

interface SetRowProps {
  set: ExerciseSet;
  showRpe: boolean;
  barWeight: number;
  availablePlates: number[];
  onUpdate: (data: { weight?: number; reps?: number; setType?: string; rpe?: number }) => void;
  onComplete: () => void;
  onDelete: () => void;
}

export function SetRow({
  set,
  showRpe,
  barWeight,
  availablePlates,
  onUpdate,
  onComplete,
  onDelete,
}: SetRowProps) {
  const [weight, setWeight] = useState(set.weight.toString());
  const [reps, setReps] = useState(set.reps.toString());
  const [showRpePicker, setShowRpePicker] = useState(false);
  const [showPlateCalc, setShowPlateCalc] = useState(false);

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

  const handleRpeSelect = (value: number | null) => {
    onUpdate({ rpe: value ?? undefined });
  };

  const handlePlateCalcUse = (newWeight: number) => {
    setWeight(newWeight.toString());
    onUpdate({ weight: newWeight });
  };

  return (
    <View style={[styles.container, { backgroundColor: typeStyle.bg }]}>
      {/* Set Number / Type Badge */}
      <TouchableOpacity style={styles.setNumber} onPress={cycleSetType}>
        <Text style={[styles.setNumberText, { color: typeStyle.text }]}>
          {typeStyle.label || set.setNumber}
        </Text>
      </TouchableOpacity>

      {/* Weight Input with Plate Calculator */}
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
        <TouchableOpacity
          style={styles.plateCalcButton}
          onPress={() => setShowPlateCalc(true)}
        >
          <Text style={styles.plateCalcIcon}>🔩</Text>
        </TouchableOpacity>
      </View>

      {/* Reps Input */}
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

      {/* RPE Badge */}
      {showRpe && (
        <TouchableOpacity
          style={[styles.rpeBadge, set.rpe != null && styles.rpeBadgeActive]}
          onPress={() => setShowRpePicker(true)}
        >
          <Text style={[styles.rpeText, set.rpe != null && styles.rpeTextActive]}>
            {set.rpe != null ? `${set.rpe}` : 'RPE'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Complete Button */}
      <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
        <Text style={styles.completeButtonText}>✓</Text>
      </TouchableOpacity>

      {/* Delete Button */}
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>

      {/* PR Badge */}
      {set.isPersonalRecord && (
        <View style={styles.prBadge}>
          <Text style={styles.prBadgeText}>PR</Text>
        </View>
      )}

      {/* RPE Picker Modal */}
      <RPEPicker
        visible={showRpePicker}
        currentValue={set.rpe}
        onSelect={handleRpeSelect}
        onClose={() => setShowRpePicker(false)}
      />

      {/* Plate Calculator Modal */}
      <PlateCalculator
        visible={showPlateCalc}
        initialWeight={parseFloat(weight) || 0}
        barWeight={barWeight}
        availablePlates={availablePlates}
        onClose={() => setShowPlateCalc(false)}
        onUseWeight={handlePlateCalcUse}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    position: 'relative',
  },
  setNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  setNumberText: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    backgroundColor: theme.border,
    color: theme.text,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'SpaceMono',
    width: 52,
    textAlign: 'center',
  },
  inputLabel: {
    color: theme.textMuted,
    fontSize: 11,
    marginLeft: 4,
    fontFamily: 'SpaceMono',
  },
  plateCalcButton: {
    marginLeft: 4,
    padding: 4,
  },
  plateCalcIcon: {
    fontSize: 14,
  },
  rpeBadge: {
    backgroundColor: theme.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  rpeBadgeActive: {
    backgroundColor: theme.accentBlue + '33',
    borderWidth: 1,
    borderColor: theme.accentBlue,
  },
  rpeText: {
    color: theme.textMuted,
    fontSize: 11,
    fontFamily: 'SpaceMono',
  },
  rpeTextActive: {
    color: theme.accentBlue,
    fontWeight: 'bold',
  },
  completeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  completeButtonText: {
    fontSize: 16,
    color: theme.bg,
  },
  deleteButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 18,
    color: theme.textMuted,
  },
  prBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.pr,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  prBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.bg,
    fontFamily: 'SpaceMono',
  },
});
