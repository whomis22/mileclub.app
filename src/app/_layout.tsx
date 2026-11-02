import { Karla_400Regular, Karla_500Medium, Karla_600SemiBold, Karla_700Bold } from '@expo-google-fonts/karla';
import { Lora_600SemiBold, Lora_600SemiBold_Italic } from '@expo-google-fonts/lora';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { LaunchScreen } from '@/components/launch-screen';
import { NoticeBanner } from '@/components/notice-banner';
import { StoreProvider } from '@/state/store';
import { colors, useTheme } from '@/theme';

export default function RootLayout() {
  const { isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Lora_600SemiBold,
    Lora_600SemiBold_Italic,
    Karla_400Regular,
    Karla_500Medium,
    Karla_600SemiBold,
    Karla_700Bold,
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
          headerTitleStyle: { fontFamily: 'Lora_600SemiBold', fontSize: 19 },
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
        <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Comments' }} />
        <Stack.Screen name="call/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="suggest" options={{ headerShown: true, title: 'Find others' }} />
        <Stack.Screen name="meet-settings" options={{ headerShown: true, title: 'Who I meet up with' }} />
        <Stack.Screen name="directions" options={{ headerShown: true, title: 'Directions' }} />
        <Stack.Screen name="new-post" options={{ headerShown: true, title: 'New post', presentation: 'modal' }} />
        <Stack.Screen name="group-settings" options={{ headerShown: true, title: 'Group settings' }} />
      </Stack>
      <NoticeBanner />
      <LaunchScreen />
    </StoreProvider>
  );
}
