import { Stack } from 'expo-router';
import { theme } from '@/constants/colors';

export default function TemplateEditorLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.accent,
        headerTitleStyle: { fontFamily: 'SpaceMono' },
        contentStyle: { backgroundColor: theme.bg },
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Template',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
