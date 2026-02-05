import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '@/constants/colors';

interface TimerBarProps {
  elapsedSeconds: number;
  onFinish: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function TimerBar({ elapsedSeconds, onFinish }: TimerBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.timerSection}>
        <Text style={styles.timerLabel}>WORKOUT TIME</Text>
        <Text style={styles.timerValue}>{formatTime(elapsedSeconds)}</Text>
      </View>
      <TouchableOpacity style={styles.finishButton} onPress={onFinish}>
        <Text style={styles.finishButtonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  timerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timerLabel: {
    fontSize: 12,
    color: theme.textMuted,
    fontFamily: 'SpaceMono',
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.accent,
    fontFamily: 'SpaceMono',
  },
  finishButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  finishButtonText: {
    color: theme.bg,
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'SpaceMono',
  },
});
