import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTop } from '@/components/page-top';
import { Button, Chip, Chips } from '@/components/ui';
import { CITIES, cityOf, type City } from '@/data/options';
import { detectCity, isLive, useCities } from '@/lib/cities';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Change your home city (Yana, 2026-11-21). Explore follows the home city's Live/Locked status.
export default function HomeCity() {
  useTheme();
  const st = useCities();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  const current = profile.city ?? cityOf(profile.neighborhood);

  function pick(city: City) {
    if (!profile || city === current) return;
    const hood = CITIES.find((c) => c.id === city)!.hoods[0];
    saveProfile({ ...profile, city, neighborhood: hood });
    setNote(`Home city is now ${city}. Your neighbourhood is set to ${hood}; change it in Account Information.`);
  }

  async function locate() {
    setBusy(true);
    const r = await detectCity();
    setBusy(false);
    if (r.city) pick(r.city);
    else setNote(r.denied ? 'Location is off. Pick your city below.' : r.place ? `Mile Club isn’t in ${r.place} yet.` : 'Couldn’t find you. Pick your city below.');
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
      <PageTop title="Home city" />
      <Button title={busy ? 'Finding you…' : '📍  Use my location'} variant="soft" onPress={locate} disabled={busy} />
      {note ? <Text style={styles.note}>{note}</Text> : null}
      <Text style={styles.label}>Pick your city</Text>
      <Chips>
        {CITIES.map((c) => (
          <Chip key={c.id} label={`${c.label}${isLive(c.id, st) ? '' : ' 🔒'}`} selected={current === c.id} onPress={() => pick(c.id)} />
        ))}
      </Chips>
      <View style={styles.key}>
        <Feather name="lock" size={14} color={colors.muted} />
        <Text style={styles.keyText}>Not live yet. Home works everywhere; Explore opens when the city goes live.</Text>
      </View>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  note: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: colors.ink, marginTop: 12 },
  label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: 24, marginBottom: 10 },
  key: { flexDirection: 'row', gap: 8, marginTop: 18 },
  keyText: { flex: 1, fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.muted },
}));
