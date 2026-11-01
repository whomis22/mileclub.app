import { Tabs } from 'expo-router/js-tabs';
import { Text } from 'react-native';

import { colors } from '@/theme';

function icon(emoji: string) {
  function TabIcon({ focused }: { focused: boolean }) {
    return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>;
  }
  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line },
        tabBarLabelStyle: { fontWeight: '700' },
      }}>
      <Tabs.Screen name="feed" options={{ title: 'Feed', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="now" options={{ title: 'Swipe', tabBarIcon: icon('⚡') }} />
      <Tabs.Screen name="discover" options={{ title: 'People', tabBarIcon: icon('👋') }} />
      <Tabs.Screen name="activities" options={{ title: 'Activities', tabBarIcon: icon('📍') }} />
      <Tabs.Screen name="profile" options={{ title: 'You', tabBarIcon: icon('🙂') }} />
    </Tabs>
  );
}
