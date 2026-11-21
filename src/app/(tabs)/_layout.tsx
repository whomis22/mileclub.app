import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { colors, fonts, getThemeMode, themed, useTheme } from '@/theme';

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; href?: string | null } }>;
  navigation?: unknown;
};

// Bottom bar from the design board (Yana, 2026-11-21): Home - Explore - Chat - Profile.
// Home is the feed, Explore is the swipe. Coaches get their Studio instead of Explore.
// The places map, Plans and Coaches stay reachable from Explore and the menu.
const MEMBER_TABS = ['feed', 'now', 'messages', 'profile'];
const COACH_TABS = ['feed', 'studio', 'messages', 'profile'];
const COACH_TITLES: Record<string, string> = {};
const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  feed: 'home',
  now: 'search',
  studio: 'star',
  messages: 'message-circle',
  profile: 'user',
};

// Plain bar on the page colour: icon + label, the open tab in lime.
function PillTabBar({ state, descriptors, isCoach }: TabBarProps & { isCoach: boolean }) {
  useTheme();
  const insets = useSafeAreaInsets();
  const order = isCoach ? COACH_TABS : MEMBER_TABS;
  const routes = order.map((name) => state.routes.find((r) => r.name === name)).filter((r): r is { key: string; name: string } => !!r);
  const current = state.routes[state.index]?.name;
  const on = getThemeMode() === 'dark' ? colors.cta : colors.ink;
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 4, 10) }]}>
      {routes.map((r) => {
        const focused = r.name === current;
        const title = (isCoach && COACH_TITLES[r.name]) || descriptors[r.key]?.options.title || r.name;
        return (
          <Pressable
            key={r.key}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
              // Go through the router: the tab bar's own navigation prop is not always passed in.
              if (!focused) router.navigate(`/${r.name}` as Href);
            }}
            accessibilityRole="tab"
            accessibilityLabel={title}
            accessibilityState={{ selected: focused }}
            style={styles.item}>
            <Feather name={ICONS[r.name] ?? 'circle'} size={22} color={focused ? on : colors.muted} />
            <Text style={[styles.label, focused && { color: on }]}>{title}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  useTheme();
  const { profile } = useStore();
  const isCoach = profile?.role === 'coach';
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...(props as unknown as TabBarProps)} isCoach={isCoach} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="feed" options={{ title: 'Home' }} />
      <Tabs.Screen name="now" options={{ title: 'Explore' }} />
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="messages" options={{ title: 'Chat' }} />
      <Tabs.Screen name="explore" options={{ title: 'Map', href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="activities" options={{ title: 'Plans', href: null }} />
      <Tabs.Screen name="train" options={{ title: 'Coaches', href: null }} />
    </Tabs>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 8 },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 2 },
  label: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.muted },
}));
