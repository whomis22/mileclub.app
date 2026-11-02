import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appleMapsUrl, googleMapsUrl } from '@/components/location-card';
import { RouteMap } from '@/components/route-map';
import { NEIGHBORHOODS } from '@/data/options';
import { formatMeters, walkingRoute, type LatLng, type Route } from '@/lib/route';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// In-app directions to a shared location: map, walking route, and step-by-step list.
export default function Directions() {
  useTheme();
  const params = useLocalSearchParams<{ lat: string; lng: string; name?: string }>();
  const dest: LatLng = { latitude: Number(params.lat), longitude: Number(params.lng) };
  const name = params.name ?? 'Shared location';
  const { profile } = useStore();
  const [from, setFrom] = useState<LatLng | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [usingHome, setUsingHome] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      let start: LatLng | null = null;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const here = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          start = { latitude: here.coords.latitude, longitude: here.coords.longitude };
        }
      } catch {}
      if (!start) {
        const home = NEIGHBORHOODS[profile?.neighborhood ?? 'Centrum'];
        start = { latitude: home.lat, longitude: home.lng };
        if (alive) setUsingHome(true);
      }
      if (!alive) return;
      setFrom(start);
      const r = await walkingRoute(start, dest);
      if (alive) setRoute(r);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.lat, params.lng]);

  const open = (url: string) => Linking.openURL(url).catch(() => {});
  const apple = Platform.OS === 'ios' ? appleMapsUrl(dest.latitude, dest.longitude, name).replace('https://maps.apple.com/', 'maps://') : appleMapsUrl(dest.latitude, dest.longitude, name);
  const mins = route ? Math.max(1, Math.round(route.seconds / 60)) : null;

  return (
    <View style={styles.screen}>
      <View style={styles.map}>
        <RouteMap from={from} dest={dest} path={route?.path ?? []} />
      </View>
      <SafeAreaView edges={['bottom']} style={styles.panel}>
        <Text style={styles.title}>{name}</Text>
        <Text style={styles.sub}>
          {route ? `🚶 ${mins} min walk · ${formatMeters(route.meters)}` : 'Finding the best way…'}
          {usingHome ? ' · from your neighbourhood' : ''}
        </Text>
        {route ? (
          <ScrollView style={styles.steps} contentContainerStyle={{ gap: 10 }}>
            {route.steps.map((s, i) => (
              <View key={i} style={styles.step}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <Text style={styles.stepText}>{s.text}</Text>
                {s.meters > 0 ? <Text style={styles.stepM}>{formatMeters(s.meters)}</Text> : null}
              </View>
            ))}
          </ScrollView>
        ) : null}
        <View style={styles.row}>
          <Pressable style={styles.btn} onPress={() => open(googleMapsUrl(dest.latitude, dest.longitude))}>
            <Text style={styles.btnText}>Google Maps</Text>
          </Pressable>
          <Pressable style={styles.btn} onPress={() => open(apple)}>
            <Text style={styles.btnText}>Apple Maps</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1, minHeight: 260 },
  panel: { maxHeight: '55%', backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, marginTop: -20, padding: space.lg, gap: 6 },
  title: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.link },
  steps: { marginTop: space.sm, flexGrow: 0 },
  step: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepNum: { width: 24, height: 24, borderRadius: 12, overflow: 'hidden', textAlign: 'center', lineHeight: 24, backgroundColor: colors.oliveSoft, color: colors.ink, fontFamily: fonts.sansBold, fontSize: 12 },
  stepText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  stepM: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  btn: { flex: 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingVertical: 12, alignItems: 'center' },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
}));
