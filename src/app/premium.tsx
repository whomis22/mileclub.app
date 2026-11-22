import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { packagesFor, PACKAGES } from '@/components/out-of-swipes';
import { pricesFor, yearlySaving } from '@/lib/pricing';
import { useStore } from '@/state/store';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui';
import { useSwipes } from '@/lib/swipes';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Premium page (design board, 2026-11-21). Pretend checkout only: no payment provider yet.
// Paid activities (Yana, 2026-11-21): members of that place join free, everyone else needs Premium.
const PERKS = ['Padel, sauna & pilates plans, free', 'Gyms you’re not a member of, free', 'Join unlimited plans, every day', 'See who wants to join your plans', 'Advanced filters'];
// Always free, no Premium needed.
const FREE = ['The gym with people from your own gym', 'Runs and marathons', 'Cycling (bring your own bike)', 'Weekly park yoga, hosted by Mile Club', 'Park activities like football and basketball', 'Coach sessions (you pay the coach per session)'];

export default function Premium() {
  useTheme();
  const insets = useSafeAreaInsets();
  const swipes = useSwipes();
  const { profile } = useStore();
  const prices = pricesFor(profile);
  const saving = yearlySaving(prices);
  const [picked, setPicked] = useState<(typeof PACKAGES)[number]['id']>('month');

  function upgrade() {
    swipes.buyPlus();
    Alert.alert('Welcome to Premium ✨', 'This is a demo, so nothing was charged.', [{ text: 'Nice', onPress: () => router.back() }]);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.xl, paddingHorizontal: 20 }}>
        <Pressable style={styles.close} onPress={() => router.back()} accessibilityLabel="Close">
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.head}>
          <MaterialCommunityIcons name="crown" size={64} color={colors.cta} />
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.sub}>More features. More ways to move.</Text>
        </View>

        <View style={{ gap: 12, paddingHorizontal: 8 }}>
          {PERKS.map((p) => (
            <View key={p} style={styles.perk}>
              <View style={styles.check}>
                <Feather name="check" size={13} color={colors.onMine} />
              </View>
              <Text style={styles.perkTitle}>{p}</Text>
            </View>
          ))}
        </View>

        <View style={styles.freeBox}>
          <Text style={styles.freeTitle}>Free for everyone</Text>
          {FREE.map((f) => (
            <View key={f} style={styles.freeRow}>
              <Feather name="check" size={14} color={colors.muted} />
              <Text style={styles.freeText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Monthly = full price. Yearly = pay once for the year and get a discount (Yana, 2026-11-22). */}
        <View style={styles.box}>
          {packagesFor(profile).map((p) => {
            const on = picked === p.id;
            const yearly = p.id === 'year';
            return (
              <Pressable key={p.id} style={[styles.pack, on && styles.packOn]} onPress={() => setPicked(p.id)} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                <View style={[styles.radio, on && styles.radioOn]}>{on ? <View style={styles.radioDot} /> : null}</View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.packName}>{yearly ? 'Pay yearly' : 'Pay monthly'}</Text>
                  <Text style={styles.packSub}>{yearly ? `${p.price} once a year` : `${p.price} every month`}</Text>
                </View>
                {yearly ? <Text style={styles.saveTag}>Save {saving}</Text> : null}
              </Pressable>
            );
          })}
          <Text style={styles.saveNote}>Pay for the full year up front and you save {saving} (2 months free).</Text>
        </View>

        {swipes.plus ? (
          <View style={styles.already}>
            <Feather name="check-circle" size={18} color={colors.link} />
            <Text style={styles.alreadyText}>You’re on Premium</Text>
          </View>
        ) : (
          <Button title={picked === 'year' ? `Get Premium for ${prices.year} / year` : `Get Premium for ${prices.month} / month`} onPress={upgrade} />
        )}
        <Text style={styles.fine}>Cancel anytime.</Text>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center', marginBottom: space.xl, marginTop: space.sm },
  title: { fontFamily: fonts.sansBold, fontSize: 26, color: colors.ink, marginTop: space.sm },
  sub: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 6 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center' },
  perkTitle: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  freeBox: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginTop: space.xl, gap: 8 },
  freeTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink, marginBottom: 2 },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, color: colors.muted },
  box: { backgroundColor: colors.card, borderRadius: 20, padding: 6, marginVertical: space.xl, gap: 4 },
  pack: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 2, borderColor: 'transparent' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.cta },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.cta },
  packName: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  packSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  saveTag: { fontFamily: fonts.sansBold, fontSize: 12, color: '#000', backgroundColor: '#B9E769', borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  saveNote: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 4 },
  packOn: { borderColor: colors.cta },
  packPrice: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  packDim: { fontSize: 15, fontFamily: fonts.sansSemi, color: colors.muted },
  save: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.link, marginTop: 2 },
  already: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: space.md },
  alreadyText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  fine: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: space.md },
}));
