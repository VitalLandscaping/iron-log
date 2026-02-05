import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/constants/colors';

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>History</Text>
      <Text style={styles.subtitle}>PR Overview & Exercise Browser</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.text,
    fontFamily: 'SpaceMono',
  },
  subtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 8,
    fontFamily: 'SpaceMono',
  },
});
