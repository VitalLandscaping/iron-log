import { StyleSheet, View, Text } from 'react-native';
import { theme } from '@/constants/colors';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Dashboard</Text>
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
