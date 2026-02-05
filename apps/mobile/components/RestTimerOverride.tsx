import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { theme } from '@/constants/colors';

interface RestTimerOverrideProps {
  visible: boolean;
  currentValue: number | null;
  defaultValue: number;
  onSave: (value: number | null) => void;
  onClose: () => void;
}

export function RestTimerOverride({
  visible,
  currentValue,
  defaultValue,
  onSave,
  onClose,
}: RestTimerOverrideProps) {
  const [value, setValue] = useState(currentValue ?? defaultValue);

  const handleSave = () => {
    onSave(value);
    onClose();
  };

  const handleUseDefault = () => {
    onSave(null);
    onClose();
  };

  const handleAdjust = (delta: number) => {
    setValue((v) => Math.max(15, Math.min(300, v + delta)));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Rest Timer</Text>

          <Text style={styles.subtitle}>
            Set custom rest time for this exercise
          </Text>

          <View style={styles.valueRow}>
            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAdjust(-15)}
            >
              <Text style={styles.adjustButtonText}>-15</Text>
            </TouchableOpacity>

            <View style={styles.valueDisplay}>
              <Text style={styles.valueText}>{value}</Text>
              <Text style={styles.valueUnit}>seconds</Text>
            </View>

            <TouchableOpacity
              style={styles.adjustButton}
              onPress={() => handleAdjust(15)}
            >
              <Text style={styles.adjustButtonText}>+15</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>

          {currentValue !== null && (
            <TouchableOpacity
              style={styles.defaultButton}
              onPress={handleUseDefault}
            >
              <Text style={styles.defaultButtonText}>
                Use Default ({defaultValue}s)
              </Text>
            </TouchableOpacity>
          )}

          {currentValue === null && (
            <Text style={styles.infoText}>
              Currently using default: {defaultValue}s
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: theme.border,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 20,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 24,
  },
  adjustButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  valueDisplay: {
    alignItems: 'center',
  },
  valueText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  valueUnit: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  saveButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.bg,
    fontFamily: 'SpaceMono',
  },
  defaultButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  defaultButtonText: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  infoText: {
    fontSize: 12,
    color: theme.textDim,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginTop: 8,
  },
});
