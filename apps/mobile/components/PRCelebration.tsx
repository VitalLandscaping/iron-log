import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '@/constants/colors';

interface PRCelebrationProps {
  visible: boolean;
  newPRs: string[];
  onClose: () => void;
}

export function PRCelebration({ visible, newPRs, onClose }: PRCelebrationProps) {
  useEffect(() => {
    if (visible && newPRs.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible, newPRs.length]);

  if (newPRs.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.confetti}>🎉</Text>
          <Text style={styles.title}>NEW PERSONAL RECORDS!</Text>

          <View style={styles.prList}>
            {newPRs.map((pr, index) => (
              <View key={index} style={styles.prItem}>
                <Text style={styles.prIcon}>🏆</Text>
                <Text style={styles.prText}>{pr}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    borderWidth: 2,
    borderColor: theme.pr,
  },
  confetti: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.pr,
    fontFamily: 'SpaceMono',
    marginBottom: 20,
    textAlign: 'center',
  },
  prList: {
    width: '100%',
    marginBottom: 20,
  },
  prItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.bg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  prIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  prText: {
    flex: 1,
    fontSize: 14,
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  closeButton: {
    backgroundColor: theme.pr,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    width: '100%',
  },
  closeButtonText: {
    color: theme.bg,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SpaceMono',
    textAlign: 'center',
  },
});
