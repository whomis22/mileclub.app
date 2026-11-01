import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchScreen } from '@/components/launch-screen';
import { StoreProvider } from '@/state/store';
import { colors, useTheme } from '@/theme';

export default function RootLayout() {
  const { isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Outfit_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <StoreProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'InstrumentSerif_400Regular', fontSize: 22 },
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
        <Stack.Screen name="menu" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="group-settings" options={{ headerShown: true, title: 'Group settings' }} />
      </Stack>
      <LaunchScreen />
    </StoreProvider>
  );
}
