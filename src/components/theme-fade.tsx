import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { palettes, useTheme } from '@/theme';

// When light/dark is switched, every screen redraws in the same moment. This soft
// cover in the new background colour fades away over it, so you never see a
// half-light, half-dark frame while that happens.
export function ThemeFade() {
  const { mode } = useTheme();
  const first = useRef(true);
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    opacity.setValue(1);
    Animated.timing(opacity, { toValue: 0, duration: 280, delay: 40, useNativeDriver: true }).start();
  }, [mode, opacity]);
  return <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: palettes[mode].bg, opacity }]} />;
}
