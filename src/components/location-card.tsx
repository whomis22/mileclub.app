import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, themed } from '@/theme';

// Pretend map with a pin: what a shared location looks like in a chat.
// (Mock: no real GPS yet. A real map needs location permission and a maps provider.)
export function LocationCard({ mine, place }: { mine: boolean; place: string }) {
  return (
    <View style={[styles.card, mine ? styles.mine : styles.theirs]}>
      <View style={styles.map}>
        {[0, 1, 2, 3].map((i) => (
          <View key={`h${i}`} style={[styles.road, { top: 18 + i * 26, left: 0, right: 0, height: i % 2 ? 3 : 6 }]} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={`v${i}`} style={[styles.road, { left: 20 + i * 48, top: 0, bottom: 0, width: i % 2 ? 6 : 3 }]} />
        ))}
        <View style={styles.water} />
        <View style={styles.pinWrap}>
          <View style={styles.pulse} />
          <View style={styles.pin} />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>📍 {mine ? 'My location' : 'Their location'}</Text>
        <Text style={styles.sub}>{place} · live for 1 hour</Text>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { width: 240, borderRadius: 20, overflow: 'hidden', borderWidth: 1 },
  mine: { borderColor: colors.olive, backgroundColor: colors.olive },
  theirs: { borderColor: colors.line, backgroundColor: colors.sand },
  map: { height: 120, backgroundColor: colors.oliveSoft, overflow: 'hidden' },
  road: { position: 'absolute', backgroundColor: colors.card, opacity: 0.9 },
  water: { position: 'absolute', right: -30, bottom: -20, width: 120, height: 70, borderRadius: 40, backgroundColor: '#9CC3C9', opacity: 0.7, transform: [{ rotate: '-18deg' }] },
  pinWrap: { position: 'absolute', left: 104, top: 44, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: colors.peachDeep, opacity: 0.25 },
  pin: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.peachDeep, borderWidth: 3, borderColor: '#fff' },
  info: { paddingVertical: 10, paddingHorizontal: 14 },
  title: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
}));
