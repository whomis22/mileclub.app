import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View } from 'react-native';

import { IncomingCallBanner } from '@/components/incoming-call-banner';
import { LaunchScreen } from '@/components/launch-screen';
import { NoticeBanner } from '@/components/notice-banner';
import { ThemeFade } from '@/components/theme-fade';
import { StoreProvider } from '@/state/store';
import { colors, useTheme } from '@/theme';

export default function RootLayout() {
  const { isDark } = useTheme();
  const [fontsLoaded, fontError] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    Outfit_800ExtraBold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <PhoneFrame>
    <StoreProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTitleStyle: { fontFamily: 'Sora_700Bold', fontSize: 17 },
          headerBackTitle: 'Back',
        }}>
        <Stack.Screen name="activity/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="person/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="about" options={{ headerShown: true, title: 'About Mile Club' }} />
        <Stack.Screen name="people" options={{ headerShown: true, title: 'People near you' }} />
        <Stack.Screen name="coach/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ headerShown: true, title: '' }} />
        <Stack.Screen name="requests" options={{ headerShown: true, title: 'Booking requests' }} />
        <Stack.Screen name="earnings" options={{ headerShown: true, title: 'Earnings' }} />
        <Stack.Screen name="host-session" options={{ headerShown: true, title: 'Host a session', presentation: 'modal' }} />
        <Stack.Screen name="create-activity" options={{ headerShown: true, title: 'New activity', presentation: 'modal' }} />
        <Stack.Screen name="menu" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="post/[id]" options={{ headerShown: true, title: 'Comments' }} />
        <Stack.Screen name="call/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="group-call/[id]" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
        <Stack.Screen name="suggest" options={{ headerShown: true, title: 'Find others' }} />
        <Stack.Screen name="meet-settings" options={{ headerShown: true, title: 'Who I meet up with' }} />
        <Stack.Screen name="directions" options={{ headerShown: true, title: 'Directions' }} />
        <Stack.Screen name="new-post" options={{ headerShown: true, title: 'New post', presentation: 'modal' }} />
        <Stack.Screen name="group-settings" options={{ headerShown: true, title: 'Group settings' }} />
      </Stack>
      <NoticeBanner />
      <IncomingCallBanner />
      <ThemeFade />
      <LaunchScreen />
    </StoreProvider>
    </PhoneFrame>
  );
}

// Web preview on a computer (Yana, 2026-11-21): show the app in a phone-sized column in the middle.
function PhoneFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1, backgroundColor: '#E8E8E8', alignItems: 'center' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 430, overflow: 'hidden', backgroundColor: colors.bg, boxShadow: '0 0 40px rgba(0,0,0,0.12)' }}>{children}</View>
    </View>
  );
}
