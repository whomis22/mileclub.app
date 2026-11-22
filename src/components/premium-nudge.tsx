import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Profile } from '@/data/types';
import { Storage } from '@/lib/kv';
import { pricesFor, yearlySaving } from '@/lib/pricing';
import { useSwipes } from '@/lib/swipes';
import { fonts } from '@/theme';

// Weekly Premium reminder on Home for people who don't pay (Yana, 2026-11-22).
// "No thanks" hides it for a week, then it comes back.
const KEY = 'mileclub-premium-nudge-v1';
const WEEK = 7 * 24 * 60 * 60 * 1000;
const LIME = '#B9E769';

function hiddenNow() {
  try {
    return Date.now() < Number(Storage.getItemSync(KEY) ?? 0);
  } catch {
    return false;
  }
}

export function PremiumNudge({ profile }: { profile: Profile }) {
  const swipes = useSwipes();
  const [hidden, setHidden] = useState(hiddenNow);
  if (swipes.plus || hidden) return null;
  const prices = pricesFor(profile);

  function noThanks() {
    try {
      Storage.setItemSync(KEY, String(Date.now() + WEEK));
    } catch {}
    setHidden(true);
  }

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.icon}><Feather name="zap" size={18} color="#000" /></View>
        <Text style={styles.kicker}>MILE CLUB PREMIUM</Text>
      </View>
      <Text style={styles.title}>Padel, sauna & pilates, free.</Text>
      <Text style={styles.sub}>Join any plan, any gym. {prices.month} a month, or save {yearlySaving(prices)} when you pay yearly.</Text>
      <View style={styles.row}>
        <Pressable style={styles.yes} onPress={() => router.push('/premium' as Href)} accessibilityLabel="See Premium">
          <Text style={styles.yesText}>See Premium</Text>
        </Pressable>
        <Pressable style={styles.no} onPress={noThanks} accessibilityLabel="No thanks">
          <Text style={styles.noText}>No thanks</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#141414', borderRadius: 22, padding: 16, marginTop: 14, borderWidth: 1, borderColor: 'rgba(185,231,105,0.35)' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 28, height: 28, borderRadius: 14, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.5, color: LIME },
  title: { fontFamily: fonts.sansBold, fontSize: 19, color: '#FFFFFF', marginTop: 10 },
  sub: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  row: { flexDirection: 'row', gap: 10, marginTop: 14 },
  yes: { flex: 1, height: 44, borderRadius: 22, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  yesText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: '#000' },
  no: { flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  noText: { fontFamily: fonts.sansSemi, fontSize: 14.5, color: '#FFFFFF' },
});
