import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PACKAGES } from '@/components/out-of-swipes';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { Button } from '@/components/ui';
import { useSwipes } from '@/lib/swipes';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Premium page (design board, 2026-11-21). Pretend checkout only: no payment provider yet.
const PERKS = ['Join unlimited plans, every day', 'See who wants to join your plans', 'Padel, gym & coaching discounts', 'Team runs & marathons', 'Advanced filters'];

export default function Premium() {
  useTheme();
  const insets = useSafeAreaInsets();
  const swipes = useSwipes();
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

        <View style={styles.box}>
          {PACKAGES.map((p) => (
            <Pressable key={p.id} style={[styles.pack, picked === p.id && styles.packOn]} onPress={() => setPicked(p.id)} accessibilityRole="radio" accessibilityState={{ checked: picked === p.id }}>
              <Text style={[styles.packPrice, picked !== p.id && styles.packDim]}>
                {p.price} / {p.id === 'year' ? 'year' : 'month'}
              </Text>
              {p.best ? <Text style={styles.save}>Save 17%</Text> : null}
            </Pressable>
          ))}
        </View>

        {swipes.plus ? (
          <View style={styles.already}>
            <Feather name="check-circle" size={18} color={colors.link} />
            <Text style={styles.alreadyText}>You’re on Premium</Text>
          </View>
        ) : (
          <Button title="Upgrade Now" onPress={upgrade} />
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
  box: { backgroundColor: colors.card, borderRadius: 20, padding: 6, marginVertical: space.xl, gap: 4 },
  pack: { borderRadius: 16, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  packOn: { borderColor: colors.cta },
  packPrice: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  packDim: { fontSize: 15, fontFamily: fonts.sansSemi, color: colors.muted },
  save: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.link, marginTop: 2 },
  already: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: space.md },
  alreadyText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  fine: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: space.md },
}));
