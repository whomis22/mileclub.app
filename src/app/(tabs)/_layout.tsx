import { router, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; href?: string | null } }>;
  navigation?: unknown;
};

// Members and coaches get different tab bars. Coaches open on their Studio and
// still have a Join tab to swipe into other people's runs.
const MEMBER_TABS = ['now', 'feed', 'activities', 'messages', 'profile'];
const COACH_TABS = ['now', 'feed', 'studio', 'messages', 'profile'];
const COACH_TITLES: Record<string, string> = {};

// Floating olive pill at the bottom. The open tab is a cream pill with its name.
function PillTabBar({ state, descriptors, isCoach }: TabBarProps & { isCoach: boolean }) {
  const insets = useSafeAreaInsets();
  const order = isCoach ? COACH_TABS : MEMBER_TABS;
  const routes = order.map((name) => state.routes.find((r) => r.name === name)).filter((r): r is { key: string; name: string } => !!r);
  const current = state.routes[state.index]?.name;
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {routes.map((r) => {
          const focused = r.name === current;
          const title = (isCoach && COACH_TITLES[r.name]) || descriptors[r.key]?.options.title || r.name;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => {
                // Go through the router: the tab bar's own navigation prop is not always passed in.
                if (!focused) router.navigate(`/${r.name}` as Href);
              }}
              style={[styles.item, focused && styles.itemOn]}>
              <Text style={[styles.label, focused && styles.labelOn]} numberOfLines={1}>
                {title}
              </Text>
            </Pressable>
          );
        })}
      </View>
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
      <Tabs.Screen name="feed" options={{ title: 'For You' }} />
      <Tabs.Screen name="now" options={{ title: 'Home' }} />
      <Tabs.Screen name="studio" options={{ title: 'Studio' }} />
      <Tabs.Screen name="activities" options={{ title: 'Runs' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
      <Tabs.Screen name="train" options={{ title: 'Coaches', href: null }} />
    </Tabs>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 6 },
  bar: {
    height: 60, borderRadius: 30, backgroundColor: colors.olive, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, gap: 2,
  },
  item: { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  itemOn: { backgroundColor: colors.onBrand, flex: 1.35 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#D9DDC4' },
  labelOn: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.onPeach },
}));
