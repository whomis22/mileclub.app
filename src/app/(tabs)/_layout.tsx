import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { colors, themed, useTheme } from '@/theme';

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
// Blend look (Yana, 2026-11-13): icons instead of words in a floating pill.
const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  now: 'home',
  feed: 'layers',
  activities: 'calendar',
  studio: 'star',
  messages: 'message-square',
  profile: 'user',
};

// Floating dark pill at the bottom (light pill in dark mode). The open tab is an olive pill that slides:
// tap a tab, or drag the pill along the bar and let go on the page you want.
function PillTabBar({ state, descriptors, isCoach }: TabBarProps & { isCoach: boolean }) {
  useTheme();
  const insets = useSafeAreaInsets();
  const order = isCoach ? COACH_TABS : MEMBER_TABS;
  const routes = order.map((name) => state.routes.find((r) => r.name === name)).filter((r): r is { key: string; name: string } => !!r);
  const current = state.routes[state.index]?.name;
  const index = Math.max(0, routes.findIndex((r) => r.name === current));
  const names = routes.map((r) => r.name).join(',');
  const [width, setWidth] = useState(0);
  const itemW = routes.length ? (width - 12) / routes.length : 0;
  const [x] = useState(() => new Animated.Value(0));
  const [hover, setHover] = useState<number | null>(null);

  // Slide the pill to the open tab.
  useEffect(() => {
    if (!itemW) return;
    Animated.spring(x, { toValue: index * itemW, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
  }, [index, itemW, x]);

  const pan = useMemo(() => {
    const list = names.split(',');
    const last = list.length - 1;
    const clamp = (v: number) => Math.min(last * itemW, Math.max(0, v));
    const nearest = (v: number) => Math.round(clamp(v) / (itemW || 1));
    return PanResponder.create({
      // Only take over for sideways drags, so taps still go to the tabs.
      onMoveShouldSetPanResponderCapture: (_e, g) => itemW > 0 && Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => {
        const v = clamp(index * itemW + g.dx);
        x.setValue(v);
        setHover(nearest(v));
        if (Platform.OS !== 'web') Haptics.selectionAsync().catch(() => {});
      },
      onPanResponderRelease: (_e, g) => {
        const to = nearest(index * itemW + g.dx);
        setHover(null);
        Animated.spring(x, { toValue: to * itemW, useNativeDriver: true, speed: 18, bounciness: 6 }).start();
        if (to !== index) router.navigate(`/${list[to]}` as Href);
      },
      onPanResponderTerminate: () => {
        setHover(null);
        Animated.spring(x, { toValue: index * itemW, useNativeDriver: true }).start();
      },
    });
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [names, itemW, index, x]);

  const lit = hover ?? index;
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width)} {...pan.panHandlers}>
        {itemW ? <Animated.View pointerEvents="none" style={[styles.pill, { width: itemW, transform: [{ translateX: x }] }]} /> : null}
        {routes.map((r, i) => {
          const focused = r.name === current;
          const title = (isCoach && COACH_TITLES[r.name]) || descriptors[r.key]?.options.title || r.name;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="tab"
              accessibilityLabel={title}
              accessibilityState={{ selected: focused }}
              onPress={() => {
                // Go through the router: the tab bar's own navigation prop is not always passed in.
                if (!focused) router.navigate(`/${r.name}` as Href);
              }}
              style={styles.item}>
              <Feather name={ICONS[r.name] ?? 'circle'} size={21} color={i === lit ? colors.onBrand : colors.bg} style={{ opacity: i === lit ? 1 : 0.75 }} />
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
      <Tabs.Screen name="activities" options={{ title: 'Plans' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
      <Tabs.Screen name="train" options={{ title: 'Coaches', href: null }} />
    </Tabs>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 40, paddingTop: 6, alignItems: 'center' },
  bar: {
    height: 62, width: '100%', maxWidth: 340, borderRadius: 31, backgroundColor: colors.ink, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8,
  },
  pill: { position: 'absolute', left: 6, top: 7, height: 48, borderRadius: 24, backgroundColor: colors.olive },
  item: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
}));
