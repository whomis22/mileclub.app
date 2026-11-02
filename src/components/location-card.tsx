import { router, type Href } from 'expo-router';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, themed } from '@/theme';

export function googleMapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
}
export function appleMapsUrl(lat: number, lng: number, name = 'Pin') {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=w&q=${encodeURIComponent(name)}`;
}

// A shared location in a chat: a little map with a pin, plus ways to get there.
export function LocationCard({ mine, name, lat, lng }: { mine: boolean; name: string; lat: number; lng: number }) {
  const open = (url: string) => Linking.openURL(url).catch(() => {});
  return (
    <View style={[styles.card, mine ? styles.mine : styles.theirs]}>
      <Pressable
        style={styles.map}
        onPress={() => router.push(`/directions?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}` as Href)}
        accessibilityLabel="Show on map">
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
      </Pressable>
      <View style={styles.info}>
        <Text style={styles.title}>📍 {name}</Text>
        <Text style={styles.sub}>Live for 1 hour</Text>
      </View>
      <Pressable
        style={styles.primary}
        onPress={() => router.push(`/directions?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}` as Href)}>
        <Text style={styles.primaryText}>🧭 Directions</Text>
      </Pressable>
      <View style={styles.links}>
        <Pressable style={styles.link} onPress={() => open(googleMapsUrl(lat, lng))}>
          <Text style={styles.linkText}>Google Maps</Text>
        </Pressable>
        <View style={styles.sep} />
        <Pressable
          style={styles.link}
          onPress={() => open(Platform.OS === 'ios' ? appleMapsUrl(lat, lng, name).replace('https://maps.apple.com/', 'maps://') : appleMapsUrl(lat, lng, name))}>
          <Text style={styles.linkText}>Apple Maps</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  card: { width: 250, borderRadius: 20, overflow: 'hidden', borderWidth: 1, backgroundColor: colors.card },
  mine: { borderColor: colors.olive },
  theirs: { borderColor: colors.line },
  map: { height: 110, backgroundColor: colors.oliveSoft, overflow: 'hidden' },
  road: { position: 'absolute', backgroundColor: colors.card, opacity: 0.9 },
  water: { position: 'absolute', right: -30, bottom: -20, width: 120, height: 70, borderRadius: 40, backgroundColor: '#9CC3C9', opacity: 0.7, transform: [{ rotate: '-18deg' }] },
  pinWrap: { position: 'absolute', left: 108, top: 40, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 34, height: 34, borderRadius: 17, backgroundColor: colors.peachDeep, opacity: 0.25 },
  pin: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.peachDeep, borderWidth: 3, borderColor: '#fff' },
  info: { paddingTop: 10, paddingHorizontal: 14 },
  title: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  sub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  primary: { margin: 12, marginBottom: 8, borderRadius: 12, backgroundColor: colors.olive, paddingVertical: 10, alignItems: 'center' },
  primaryText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.onBrand },
  links: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.line },
  link: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  linkText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.link },
  sep: { width: 1, backgroundColor: colors.line },
}));
