import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { colors, fonts, themed, useTheme } from '@/theme';

// Opening screen shown while the app starts: logo in the middle,
// "Mile Club" at the bottom, then it fades away.
const SHOW_MS = 1600;
const FADE_MS = 350;

// A soft heartbeat while it loads (Yana, 2026-11-19): two gentle taps, twice,
// with the logo pulsing in time, then a light tap as the app opens.
const BEATS: [number, Haptics.ImpactFeedbackStyle][] = [
  [80, Haptics.ImpactFeedbackStyle.Soft],
  [240, Haptics.ImpactFeedbackStyle.Light],
  [800, Haptics.ImpactFeedbackStyle.Soft],
  [960, Haptics.ImpactFeedbackStyle.Light],
  [SHOW_MS, Haptics.ImpactFeedbackStyle.Light],
];

export function LaunchScreen() {
  useTheme();
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(1));
  const [visible, setVisible] = useState(true);
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const timers = BEATS.map(([at, style]) => setTimeout(() => Haptics.impactAsync(style).catch(() => {}), at));
    const beat = Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.06, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 230, useNativeDriver: true }),
    ]);
    const pulse = Animated.sequence([Animated.delay(60), beat, Animated.delay(160), beat]);
    pulse.start();
    return () => {
      timers.forEach(clearTimeout);
      pulse.stop();
    };
  }, [scale]);

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: FADE_MS, useNativeDriver: true }).start(() =>
        setVisible(false),
      );
    }, SHOW_MS);
    return () => clearTimeout(timer);
  }, [opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.screen, { opacity }]}>
      <Animated.View style={[styles.center, { transform: [{ scale }] }]}>
        <Logo size={96} />
      </Animated.View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.name}>Mile Club</Text>
      </View>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { backgroundColor: colors.bg, zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { alignItems: 'center' },
  name: { color: colors.link, fontSize: 20, fontFamily: fonts.sansSemi },
}));
