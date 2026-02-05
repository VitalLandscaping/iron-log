import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Light haptic - set type toggle, adding set, tab switches
export function lightHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

// Medium haptic - completing a set
export function mediumHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

// Heavy haptic - for emphasis
export function heavyHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

// Success haptic - PR celebration, workout finished, rest timer done
export function successHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

// Warning haptic - deleting something
export function warningHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
}

// Error haptic - for errors
export function errorHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
