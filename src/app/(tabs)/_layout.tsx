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

// Bottom bar (Yana, 2026-11-21): Home - Explore - Connect - Chats - Profile.
// Coaches swap Home for their Studio. Plans and Coaches stay reachable from the menu.
const MEMBER_TABS = ['now', 'explore', 'feed', 'messages', 'profile'];
const COACH_TABS = ['studio', 'explore', 'feed', 'messages', 'profile'];
const COACH_TITLES: Record<string, string> = {};
const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  now: 'home',
  explore: 'map',
  feed: 'users',
  studio: 'star',
  messages: 'message-circle',
  profile: 'user',
};

// Dark rounded bar like the Dribbble look: icon + label, the open tab in lime with a dot,
// and the middle tab (Connect) as a raised lime button.
function PillTabBar({ state, descriptors, isCoach }: TabBarProps & { isCoach: boolean }) {
  useTheme();
  const insets = useSafeAreaInsets();
  const order = isCoach ? COACH_TABS : MEMBER_TABS;
  const routes = order.map((name) => state.routes.find((r) => r.name === name)).filter((r): r is { key: string; name: string } => !!r);
  const current = state.routes[state.index]?.name;
  const mid = Math.floor(routes.length / 2);
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom - 6, 10) }]}>
      <View style={styles.bar}>
        {routes.map((r, i) => {
          const focused = r.name === current;
          const title = (isCoach && COACH_TITLES[r.name]) || descriptors[r.key]?.options.title || r.name;
          const go = () => {
            if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
            // Go through the router: the tab bar's own navigation prop is not always passed in.
            if (!focused) router.navigate(`/${r.name}` as Href);
          };
          if (i === mid) {
            return (
              <Pressable key={r.key} onPress={go} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{ selected: focused }} style={styles.item}>
                <View style={[styles.centre, focused && styles.centreOn]}>
                  <Feather name={ICONS[r.name] ?? 'circle'} size={22} color={colors.onCta} />
                </View>
                <Text style={[styles.label, focused && styles.labelOn]}>{title}</Text>
              </Pressable>
            );
          }
          return (
            <Pressable key={r.key} onPress={go} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{ selected: focused }} style={styles.item}>
              <Feather name={ICONS[r.name] ?? 'circle'} size={21} color={focused ? colors.cta : BAR_ICON} />
              <Text style={[styles.label, focused && styles.labelOn]}>{title}</Text>
              <View style={[styles.dot, !focused && { opacity: 0 }]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const BAR_ICON = 'rgba(247,247,242,0.55)';

export default function TabsLayout() {
  useTheme();
  const { profile } = useStore();
  const isCoach = profile?.role === 'coach';
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...(props as unknown as TabBarProps)} isCoach={isCoach} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="now" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="feed" options={{ title: 'Connect' }} />
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="messages" options={{ title: 'Chats' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="activities" options={{ title: 'Plans', href: null }} />
      <Tabs.Screen name="train" options={{ title: 'Coaches', href: null }} />
    </Tabs>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 14, paddingTop: 6 },
  bar: {
    height: 66, borderRadius: 30, backgroundColor: getThemeMode() === 'dark' ? '#0F1D1B' : colors.ink, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, borderWidth: getThemeMode() === 'dark' ? 1 : 0, borderColor: colors.edge,
    shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 10,
  },
  item: { flex: 1, height: 66, alignItems: 'center', justifyContent: 'center', gap: 3 },
  label: { fontFamily: fonts.sansSemi, fontSize: 10, color: BAR_ICON },
  labelOn: { color: colors.cta },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.cta },
  centre: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.cta, alignItems: 'center', justifyContent: 'center', marginTop: -26,
    borderWidth: 4, borderColor: colors.bg,
    shadowColor: '#B9E769', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 }, elevation: 8,
  },
  centreOn: { transform: [{ scale: 1.06 }] },
}));
