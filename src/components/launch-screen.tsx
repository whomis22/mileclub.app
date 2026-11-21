import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { BrandMark } from '@/components/ui';
import { colors, themed, useTheme } from '@/theme';

// Opening screen (Yana, 2026-11-21): ONLY the black MILE CLUB logo on plain white while the app loads.
// Older notes: (2026-11-20, Kulmo style): cream in light mode (everyone
// starts there), black once they switch to dark mode (2026-11-21), a big white mc
// logo in the centre and nothing else (2026-11-21: logo only, no wordmark). Then it fades away.
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
      <StatusBar style="dark" />
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <BrandMark height={56} tone="black" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
}));
