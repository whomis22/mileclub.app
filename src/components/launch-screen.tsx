import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { colors, fonts, themed } from '@/theme';

// Opening screen shown while the app starts: logo in the middle,
// "Mile Club" at the bottom, then it fades away.
const SHOW_MS = 1600;
const FADE_MS = 350;

export function LaunchScreen() {
  const insets = useSafeAreaInsets();
  const [opacity] = useState(() => new Animated.Value(1));
  const [visible, setVisible] = useState(true);

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
      <View style={styles.center}>
        <Logo size={96} />
      </View>
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
