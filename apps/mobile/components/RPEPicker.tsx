import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { theme } from '@/constants/colors';

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

interface RPEPickerProps {
  visible: boolean;
  currentValue: number | null;
  onSelect: (value: number | null) => void;
  onClose: () => void;
}

export function RPEPicker({ visible, currentValue, onSelect, onClose }: RPEPickerProps) {
  const handleSelect = (value: number | null) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Select RPE</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.valuesContainer}
          >
            {RPE_VALUES.map((value) => {
              const isSelected = currentValue === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.valuePill, isSelected && styles.valuePillSelected]}
                  onPress={() => handleSelect(value)}
                >
                  <Text style={[styles.valueText, isSelected && styles.valueTextSelected]}>
                    {value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {currentValue !== null && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSelect(null)}
            >
              <Text style={styles.clearButtonText}>Clear RPE</Text>
            </TouchableOpacity>
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
    padding: 20,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: theme.border,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
    textAlign: 'center',
    marginBottom: 16,
  },
  valuesContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  valuePill: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: theme.border,
    minWidth: 50,
    alignItems: 'center',
  },
  valuePillSelected: {
    backgroundColor: theme.accent,
  },
  valueText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  valueTextSelected: {
    color: theme.bg,
  },
  clearButton: {
    marginTop: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
});
