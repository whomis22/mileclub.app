import { Tabs } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fonts } from '@/theme';

type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string; href?: string | null } }>;
  navigation: { navigate: (name: string) => void };
};

const TAB_ORDER = ['now', 'feed', 'activities', 'messages', 'profile'];

// Floating olive pill at the bottom. The open tab is a cream pill with its name.
function PillTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TAB_ORDER.includes(r.name));
  const current = state.routes[state.index]?.name;
  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {routes.map((r) => {
          const focused = r.name === current;
          const title = descriptors[r.key]?.options.title ?? r.name;
          return (
            <Pressable
              key={r.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              onPress={() => navigation.navigate(r.name)}
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
  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...(props as unknown as TabBarProps)} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="now" options={{ title: 'Home' }} />
      <Tabs.Screen name="feed" options={{ title: 'Explore' }} />
      <Tabs.Screen name="activities" options={{ title: 'Runs' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'You' }} />
      <Tabs.Screen name="train" options={{ title: 'Coaches', href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.bg, paddingHorizontal: 16, paddingTop: 6 },
  bar: {
    height: 60, borderRadius: 30, backgroundColor: colors.olive, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 6, gap: 2,
  },
  item: { flex: 1, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  itemOn: { backgroundColor: colors.bg, flex: 1.35 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12, color: '#D9DDC4' },
  labelOn: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
});
