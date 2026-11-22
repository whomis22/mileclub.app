import { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { BrandMark } from '@/components/ui';
import { getOpenPattern, playPattern } from '@/lib/open-haptics';
import { colors, themed, useTheme } from '@/theme';

// Opening screen (Yana, 2026-11-21): ONLY the MILE CLUB logo while the app loads.
// Light mode: black on white. Dark mode (the app's own setting): white on black.
// Older notes: (2026-11-20, Kulmo style): cream in light mode (everyone
// starts there), black once they switch to dark mode (2026-11-21), a big white mc
// logo in the centre and nothing else (2026-11-21: logo only, no wordmark). Then it fades away.
const SHOW_MS = 1600;
const FADE_MS = 350;
const OPENED_AT = Date.now();
// When the opening screen is gone: Welcome starts floating the logo up then (Yana, 2026-11-22).
export function launchEndsIn() {
  return Math.max(0, OPENED_AT + SHOW_MS + FADE_MS + 30 - Date.now());
}

export function LaunchScreen() {
  const { isDark } = useTheme();
  const [opacity] = useState(() => new Animated.Value(1));
  const [visible, setVisible] = useState(true);
  const [scale] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (Platform.OS === 'web') return;
    // The opening vibration Yana picks in Settings (2026-11-21).
    const stop = playPattern(getOpenPattern().steps);
    const beat = Animated.sequence([
      Animated.timing(scale, { toValue: 1.08, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.06, duration: 110, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 230, useNativeDriver: true }),
    ]);
    const pulse = Animated.sequence([Animated.delay(60), beat, Animated.delay(160), beat]);
    pulse.start();
    return () => {
      stop();
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
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.center}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <BrandMark height={56} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { backgroundColor: colors.bg, zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 20 },
}));
