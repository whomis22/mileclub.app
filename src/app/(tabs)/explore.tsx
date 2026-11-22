import Feather from '@expo/vector-icons/Feather';
import * as Location from 'expo-location';
import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ExploreMap } from '@/components/explore-map';
import { BgGlow } from '@/components/ui';
import { NEIGHBORHOODS, cityOf } from '@/data/options';
import { KINDS, kmBetween, placesAround, type LatLng, type Place, type PlaceKind } from '@/data/places';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

// Explore (Yana, 2026-11-21): a map of places to move near you, filtered by kind,
// with the closest ones listed underneath.
export default function Explore() {
  useTheme();
  const { profile, activities } = useStore();
  const hood = profile ? NEIGHBORHOODS[profile.neighborhood] : NEIGHBORHOODS.Centrum;
  const [centre, setCentre] = useState<LatLng>({ latitude: hood.lat, longitude: hood.lng });
  const [here, setHere] = useState(false);
  const [kind, setKind] = useState<PlaceKind | 'all'>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | undefined>();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCentre({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setHere(true);
      } catch {}
    })();
  }, []);

  const all = useMemo(() => placesAround(centre, activities), [centre, activities]);
  const shown = all
    .filter((p) => (kind === 'all' || p.kind === kind) && (!q.trim() || `${p.name} ${p.detail}`.toLowerCase().includes(q.trim().toLowerCase())))
    .map((p) => ({ p, km: kmBetween(centre, p.at) }))
    .sort((a, b) => a.km - b.km);
  const sel = shown.find((x) => x.p.id === selected);
  const where = here ? 'you' : profile ? `${profile.neighborhood}${cityOf(profile.neighborhood) ? `, ${cityOf(profile.neighborhood)}` : ''}` : 'you';

  function open(p: Place) {
    router.push(p.href as Href);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <BgGlow />
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.head}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Explore</Text>
            <Text style={styles.sub}>Places to move near {where}</Text>
          </View>
          <Pressable style={styles.round} onPress={() => router.push('/create-activity')} accessibilityLabel="Start a plan">
            <Feather name="plus" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.search}>
          <Feather name="search" size={17} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Gyms, padel, yoga, pools…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            returnKeyType="search"
            inputMode="search"
            clearButtonMode="while-editing"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ id: 'all' as const, label: 'All', icon: 'grid' as const }, ...KINDS].map((k) => {
            const on = kind === k.id;
            return (
              <Pressable key={k.id} onPress={() => { setKind(k.id); setSelected(undefined); }} style={[styles.chip, on && styles.chipOn]}>
                <Feather name={k.icon} size={14} color={on ? colors.onCta : colors.ink} />
                <Text style={[styles.chipText, on && { color: colors.onCta }]}>{k.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.mapBox}>
          <ExploreMap centre={centre} places={shown.map((x) => x.p)} selected={selected} onSelect={(p) => setSelected(p.id)} />
          {sel ? (
            <Pressable style={styles.selCard} onPress={() => open(sel.p)}>
              <View style={styles.tile}>
                <Feather name={KINDS.find((k) => k.id === sel.p.kind)!.icon} size={18} color={colors.cta} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{sel.p.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{sel.km.toFixed(1)} km · {sel.p.open}</Text>
              </View>
              <View style={styles.cta}>
                <Text style={styles.ctaText}>{sel.p.action}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.listHead}>
          <Text style={styles.h2}>{shown.length} {shown.length === 1 ? 'place' : 'places'} near you</Text>
          <Text style={styles.meta}>Closest first</Text>
        </View>
        <View style={styles.list}>
          {shown.map(({ p, km }) => {
            const on = p.id === selected;
            return (
              <Pressable key={p.id} style={[styles.row, on && styles.rowOn]} onPress={() => setSelected(p.id)}>
                <View style={styles.tile}>
                  <Feather name={KINDS.find((k) => k.id === p.kind)!.icon} size={18} color={colors.cta} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.kind}>{KINDS.find((k) => k.id === p.kind)!.label.toUpperCase()}</Text>
                  <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.detail} numberOfLines={1}>{p.detail}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {km.toFixed(1)} km · ★ {p.rating.toFixed(1)}{p.open ? ` · ${p.open}` : ''}
                  </Text>
                </View>
                <Pressable style={styles.ctaSmall} onPress={() => open(p)} hitSlop={6}>
                  <Text style={styles.ctaText}>{p.action}</Text>
                </Pressable>
              </Pressable>
            );
          })}
          {shown.length === 0 ? <Text style={styles.detail}>Nothing matches that yet. Try another search.</Text> : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    head: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
    title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink },
    sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 2 },
    round: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    search: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20, marginTop: 16, backgroundColor: colors.card, borderRadius: 999, borderWidth: 1, borderColor: colors.edge, paddingHorizontal: 16 },
    searchInput: { flex: 1, paddingVertical: 12, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
    chips: { gap: 8, paddingHorizontal: 20, paddingVertical: 14 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.edge, backgroundColor: colors.card, paddingVertical: 9, paddingHorizontal: 13 },
    chipOn: { backgroundColor: colors.cta, borderColor: colors.cta },
    chipText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
    mapBox: { height: 320, marginHorizontal: 20, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.card },
    selCard: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 20, padding: 10, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
    listHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
    h2: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
    list: { paddingHorizontal: 20, gap: 10 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 22, padding: 12, borderWidth: 1, borderColor: colors.line },
    rowOn: { borderColor: colors.cta, borderWidth: 1.5 },
    tile: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#102A27', alignItems: 'center', justifyContent: 'center' },
    kind: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8, color: colors.muted },
    name: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: 1 },
    detail: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 1 },
    meta: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted, marginTop: 3 },
    cta: { backgroundColor: colors.cta, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14 },
    ctaSmall: { backgroundColor: colors.cta, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    ctaText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.onCta },
  }),
);
