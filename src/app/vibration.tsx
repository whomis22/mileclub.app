import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTop } from '@/components/page-top';
import { getOpenPattern, PATTERNS, playPattern, setOpenPattern } from '@/lib/open-haptics';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Try the opening vibrations and pick one (Yana, 2026-11-21). Tapping a row plays it and picks it.
export default function Vibration() {
  useTheme();
  const insets = useSafeAreaInsets();
  const [picked, setPicked] = useState(() => getOpenPattern().id);
  const stop = useRef<() => void>(() => {});
  useEffect(() => () => stop.current(), []);

  function tryIt(id: string) {
    const p = PATTERNS.find((x) => x.id === id)!;
    stop.current();
    // Preview starts right away instead of waiting for the loading screen's timing.
    const first = p.steps[0]?.[0] ?? 0;
    stop.current = playPattern(p.steps, first);
    setPicked(id);
    setOpenPattern(id);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
      <PageTop title="Opening vibration" />
      <Text style={styles.intro}>Tap one to feel it on your phone. The one with the tick plays every time Mile Club opens.</Text>
      {PATTERNS.map((p, i) => (
        <Pressable key={p.id} style={({ pressed }) => [styles.row, picked === p.id && styles.rowOn, pressed && { transform: [{ scale: 0.98 }] }]} onPress={() => tryIt(p.id)}>
          <Text style={styles.num}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.feel}>{p.feel}</Text>
          </View>
          <View style={[styles.check, picked === p.id && styles.checkOn]}>
            {picked === p.id ? <Feather name="check" size={15} color={colors.onMine} /> : <Feather name="play" size={13} color={colors.muted} />}
          </View>
        </Pressable>
      ))}
      <Text style={styles.tip}>Tip: close Mile Club fully and open it again to feel it with the logo.</Text>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  intro: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  rowOn: { borderColor: colors.mine },
  num: { width: 22, fontFamily: fonts.sansBold, fontSize: 16, color: colors.muted, textAlign: 'center' },
  name: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  feel: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: 2 },
  check: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.mine, borderColor: colors.mine },
  tip: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, textAlign: 'center', marginTop: 10 },
}));
