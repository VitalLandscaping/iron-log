import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/colors';

interface RestTimerProps {
  remaining: number;
  total: number;
  onSkip: () => void;
  onAdjust: (seconds: number) => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RestTimer({ remaining, total, onSkip, onAdjust }: RestTimerProps) {
  const progress = remaining / total;

  return (
    <View style={styles.container}>
      <View style={styles.timerRow}>
        <Text style={styles.timerIcon}>⏱</Text>
        <Text style={styles.label}>REST</Text>
        <Text style={styles.timerValue}>{formatTime(remaining)}</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.adjustButton} onPress={() => onAdjust(-30)}>
          <Text style={styles.adjustButtonText}>-30s</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.adjustButton} onPress={() => onAdjust(30)}>
          <Text style={styles.adjustButtonText}>+30s</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  timerIcon: {
    fontSize: 20,
  },
  label: {
    fontSize: 14,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  timerValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.textDim,
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.accent,
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  adjustButton: {
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.border,
  },
  adjustButtonText: {
    color: theme.text,
    fontSize: 14,
    fontFamily: 'SpaceMono',
  },
  skipButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 6,
  },
  skipButtonText: {
    color: theme.bg,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
  },
});
