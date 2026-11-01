import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchScreen } from '@/components/launch-screen';
import { StoreProvider } from '@/state/store';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
        }}>
        <Stack.Screen name="activity/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="person/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="people" options={{ headerShown: true, title: 'People near you' }} />
        <Stack.Screen name="coach/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="session/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="requests" options={{ headerShown: true, title: 'Booking requests' }} />
        <Stack.Screen name="earnings" options={{ headerShown: true, title: 'Earnings' }} />
        <Stack.Screen name="host-session" options={{ headerShown: true, title: 'Host a session', presentation: 'modal' }} />
        <Stack.Screen name="create-activity" options={{ headerShown: true, title: 'New activity', presentation: 'modal' }} />
      </Stack>
      <LaunchScreen />
    </StoreProvider>
  );
}
