import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

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
        <Image
          source={require('../../assets/images/logo-mark.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Mile Club"
        />
      </View>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        <Text style={styles.name}>Mile Club</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.ink, zIndex: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 120, height: 57 },
  bottom: { alignItems: 'center' },
  name: { color: colors.accent, fontSize: 20, fontWeight: '700', letterSpacing: 0.3 },
});
