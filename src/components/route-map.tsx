import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

// Simple hand-drawn route shapes (points in a 0–100 box), so the feed looks like a map
// without needing a real map provider yet.
const ROUTES: [number, number][][] = [
  [[10, 70], [20, 40], [38, 22], [60, 20], [80, 32], [88, 55], [76, 78], [52, 84], [30, 80], [10, 70]],
  [[6, 80], [18, 70], [30, 64], [42, 52], [52, 46], [64, 36], [76, 28], [90, 18]],
  [[8, 50], [20, 30], [36, 20], [54, 26], [66, 44], [80, 52], [92, 40], [86, 72], [62, 82], [40, 74], [22, 70], [8, 50]],
  [[20, 76], [16, 50], [26, 26], [50, 16], [74, 24], [84, 50], [74, 74], [50, 82], [20, 76]],
];

export function RouteMap({ route, height = 150 }: { route: number; height?: number }) {
  const [width, setWidth] = useState(0);
  const pts = ROUTES[route % ROUTES.length].map(([x, y]) => [(x / 100) * width, (y / 100) * height] as const);
  const segments = pts.slice(1).map((p, i) => {
    const q = pts[i];
    const dx = p[0] - q[0];
    const dy = p[1] - q[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    return { cx: (q[0] + p[0]) / 2, cy: (q[1] + p[1]) / 2, len, angle: Math.atan2(dy, dx) };
  });
  const start = pts[0];
  const end = pts[pts.length - 1];
  return (
    <View style={[styles.map, { height }]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {[22, 48, 74].map((t) => (
        <View key={`h${t}`} style={[styles.street, { top: `${t}%`, left: 0, right: 0, height: 2 }]} />
      ))}
      {[18, 42, 66, 88].map((l) => (
        <View key={`v${l}`} style={[styles.street, { left: `${l}%`, top: 0, bottom: 0, width: 2 }]} />
      ))}
      <View style={[styles.water, { height: height * 0.22 }]} />
      {width > 0 &&
        segments.map((s, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: s.cx - s.len / 2 - 2,
              top: s.cy - 2.5,
              width: s.len + 4,
              height: 5,
              borderRadius: 3,
              backgroundColor: colors.accent,
              transform: [{ rotate: `${s.angle}rad` }],
            }}
          />
        ))}
      {width > 0 && (
        <>
          <View style={[styles.dot, { left: start[0], top: start[1], backgroundColor: colors.green }]} />
          <View style={[styles.dot, { left: end[0], top: end[1], backgroundColor: colors.ink }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { backgroundColor: '#EFE9F5', borderRadius: 16, overflow: 'hidden', position: 'relative' },
  street: { position: 'absolute', backgroundColor: '#FFFFFF', opacity: 0.8 },
  water: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#DCD3F2' },
  dot: {
    position: 'absolute', width: 12, height: 12, borderRadius: 6, marginLeft: -6, marginTop: -6,
    borderWidth: 2, borderColor: '#fff',
  },
});
