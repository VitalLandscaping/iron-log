import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '@/constants/colors';
import { calculatePlates, formatPlatesPerSide, PLATE_COLORS, PlateResult } from '@/services/plateCalculator';

interface PlateCalculatorProps {
  visible: boolean;
  initialWeight: number;
  barWeight: number;
  availablePlates: number[];
  onClose: () => void;
  onUseWeight: (weight: number) => void;
}

// Plate visual dimensions (proportional)
const PLATE_HEIGHTS: Record<number, number> = {
  45: 100,
  35: 90,
  25: 80,
  10: 60,
  5: 50,
  2.5: 40,
};

const PLATE_WIDTHS: Record<number, number> = {
  45: 16,
  35: 14,
  25: 12,
  10: 10,
  5: 8,
  2.5: 6,
};

function PlateVisual({ weight }: { weight: number }) {
  const height = PLATE_HEIGHTS[weight] || 60;
  const width = PLATE_WIDTHS[weight] || 10;
  const color = PLATE_COLORS[weight] || theme.textMuted;

  return (
    <View
      style={[
        styles.plate,
        {
          height,
          width,
          backgroundColor: color,
        },
      ]}
    >
      <Text style={[styles.plateLabel, weight === 10 && styles.plateLabelDark]}>
        {weight}
      </Text>
    </View>
  );
}

export function PlateCalculator({
  visible,
  initialWeight,
  barWeight,
  availablePlates,
  onClose,
  onUseWeight,
}: PlateCalculatorProps) {
  const [targetWeight, setTargetWeight] = useState(initialWeight.toString());

  useEffect(() => {
    if (visible) {
      setTargetWeight(initialWeight.toString());
    }
  }, [visible, initialWeight]);

  const result: PlateResult = useMemo(() => {
    const weight = parseFloat(targetWeight) || 0;
    return calculatePlates(weight, barWeight, availablePlates);
  }, [targetWeight, barWeight, availablePlates]);

  const handleUseWeight = () => {
    onUseWeight(result.totalWeight);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Plate Calculator</Text>

          {/* Target Weight Input */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Target Weight</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={targetWeight}
                onChangeText={setTargetWeight}
                keyboardType="numeric"
                selectTextOnFocus
              />
              <Text style={styles.inputUnit}>lbs</Text>
            </View>
          </View>

          {/* Bar Weight Info */}
          <Text style={styles.barInfo}>Bar: {barWeight} lbs</Text>

          {/* Plate Diagram */}
          <View style={styles.diagramContainer}>
            {/* Left plates (mirrored) */}
            <View style={styles.platesLeft}>
              {[...result.platesPerSide].reverse().map((plate, idx) => (
                <PlateVisual key={`left-${idx}`} weight={plate} />
              ))}
            </View>

            {/* Bar */}
            <View style={styles.bar}>
              <View style={styles.barCollar} />
              <View style={styles.barMain} />
              <View style={styles.barCollar} />
            </View>

            {/* Right plates */}
            <View style={styles.platesRight}>
              {result.platesPerSide.map((plate, idx) => (
                <PlateVisual key={`right-${idx}`} weight={plate} />
              ))}
            </View>
          </View>

          {/* Per Side Summary */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>Per side:</Text>
            <Text style={styles.summaryValue}>{formatPlatesPerSide(result.platesPerSide)}</Text>
          </View>

          {/* Remainder Warning */}
          {result.remainder > 0 && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Closest achievable: {result.totalWeight} lbs
              </Text>
              <Text style={styles.warningSubtext}>
                (Can't load {result.remainder} lbs with available plates)
              </Text>
            </View>
          )}

          {/* Total Weight */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Weight</Text>
            <Text style={styles.totalValue}>{result.totalWeight} lbs</Text>
          </View>

          {/* Use Weight Button */}
          <TouchableOpacity style={styles.useButton} onPress={handleUseWeight}>
            <Text style={styles.useButtonText}>Use {result.totalWeight} lbs</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    backgroundColor: theme.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: theme.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    width: 100,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  barInfo: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 20,
  },
  diagramContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    minHeight: 120,
  },
  platesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  platesRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  barCollar: {
    width: 8,
    height: 24,
    backgroundColor: theme.textDim,
    borderRadius: 2,
  },
  barMain: {
    width: 60,
    height: 8,
    backgroundColor: theme.textMuted,
    borderRadius: 2,
  },
  plate: {
    borderRadius: 4,
    marginHorizontal: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: theme.bg,
    fontFamily: 'SpaceMono',
    transform: [{ rotate: '-90deg' }],
  },
  plateLabelDark: {
    color: theme.textDim,
  },
  summaryBox: {
    backgroundColor: theme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: theme.text,
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  warningBox: {
    backgroundColor: '#ff990022',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff9900',
  },
  warningText: {
    fontSize: 14,
    color: '#ff9900',
    fontFamily: 'SpaceMono',
    fontWeight: 'bold',
  },
  warningSubtext: {
    fontSize: 12,
    color: '#ff9900',
    fontFamily: 'SpaceMono',
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 15,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  useButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  useButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.bg,
    fontFamily: 'SpaceMono',
  },
});
