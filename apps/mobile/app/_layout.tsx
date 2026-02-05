import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { theme } from '@/constants/colors';
import { WorkoutProvider } from '@/context/WorkoutContext';
import { api } from '@/services/api';
import {
  registerForPushNotifications,
  getNotificationsEnabled,
  getPlatform,
  clearBadgeCount,
  addNotificationResponseListener,
} from '@/services/notifications';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const IronLogDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.accent,
    background: theme.bg,
    card: theme.card,
    text: theme.text,
    border: theme.border,
  },
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  useEffect(() => {
    async function setupNotifications() {
      try {
        // Check if notifications are enabled in settings
        const enabled = await getNotificationsEnabled();
        if (!enabled) {
          console.log('[Notifications] Disabled in settings - skipping registration');
          return;
        }

        // Get push token
        const token = await registerForPushNotifications();
        if (token) {
          // Register with backend
          await api.registerDeviceToken(token, getPlatform());
          console.log('[Notifications] Token registered with backend');
        }

        // Clear badge when app opens
        await clearBadgeCount();
      } catch (error) {
        console.error('[Notifications] Setup failed:', error);
      }
    }

    setupNotifications();

    // Handle notification taps
    const subscription = addNotificationResponseListener((response) => {
      console.log('[Notifications] User tapped notification:', response.notification.request.content);
      // Could navigate to specific screen here based on notification data
    });

    return () => subscription.remove();
  }, []);

  return (
    <WorkoutProvider>
      <ThemeProvider value={IronLogDarkTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen
            name="exercise-picker"
            options={{
              presentation: 'modal',
              title: 'Add Exercise',
              headerStyle: { backgroundColor: theme.card },
              headerTintColor: theme.text,
            }}
          />
        </Stack>
      </ThemeProvider>
    </WorkoutProvider>
  );
}
