import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { PEOPLE } from '@/data/people';
import { FREE_PER_DAY, untilReset } from '@/lib/swipes';
import { colors, fonts, themed } from '@/theme';

// Shown when someone has used today's free swipes (Yana, 2026-11-15): never an
// empty page. Premium packages first, then free ways to keep going.
// Prices are placeholders and nothing is charged (no payment provider yet).
const PACKAGES = [
  { id: 'month', name: 'Mile Club Plus', price: '€9.99', per: 'a month', note: 'Unlimited swipes', best: false },
  { id: 'quarter', name: 'Plus · 3 months', price: '€24.99', per: 'every 3 months', note: 'Save 17%', best: true },
  { id: 'pack', name: '10 extra swipes', price: '€2.99', per: 'one time', note: 'Just for today', best: false },
] as const;

const PERKS = ['Unlimited swipes, every day', 'See who wants to join your plans', 'Get seen first by hosts', 'Plans in other cities when you travel'];

export function OutOfSwipes({ onPlus, onBonus }: { onPlus: () => void; onBonus: (n: number) => void }) {
  const [picked, setPicked] = useState<(typeof PACKAGES)[number]['id']>('quarter');
  const [done, setDone] = useState<string | null>(null);
  const free = PEOPLE.slice(0, 5);

  function buy() {
    if (picked === 'pack') {
      onBonus(10);
      setDone('10 extra swipes added. Demo only, nothing was charged.');
    } else {
      onPlus();
    }
  }

  async function invite() {
    try {
      const r = await Share.share({ message: 'Join me on Mile Club, plans worth leaving the house for: https://mileclub.co' });
      if (r.action === Share.sharedAction) onBonus(5);
    } catch {}
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.heroKicker}>THAT’S YOUR {FREE_PER_DAY} FREE SWIPES FOR TODAY</Text>
        <Text style={s.heroTitle}>Don’t stop now.</Text>
        <Text style={s.heroSub}>New free swipes in {untilReset()}. Or keep going right away.</Text>
      </View>

      <View style={s.card}>
        <View style={s.plusHead}>
          <Feather name="star" size={18} color={colors.link} />
          <Text style={s.plusTitle}>Mile Club Plus</Text>
        </View>
        {PERKS.map((p) => (
          <View key={p} style={s.perk}>
            <Feather name="check" size={16} color={colors.link} />
            <Text style={s.perkText}>{p}</Text>
          </View>
        ))}
        <View style={s.packs}>
          {PACKAGES.map((p) => (
            <Pressable key={p.id} style={[s.pack, picked === p.id && s.packOn]} onPress={() => setPicked(p.id)}>
              {p.best ? (
                <View style={s.best}>
                  <Text style={s.bestText}>MOST POPULAR</Text>
                </View>
              ) : null}
              <Text style={s.packName}>{p.name}</Text>
              <Text style={s.packPrice}>{p.price}</Text>
              <Text style={s.packPer}>{p.per}</Text>
              <Text style={s.packNote}>{p.note}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={s.buy} onPress={buy}>
          <Text style={s.buyText}>{picked === 'pack' ? 'Get 10 more swipes' : 'Get Plus'}</Text>
        </Pressable>
        <Text style={s.fine}>Demo: no payment is taken yet.</Text>
        {done ? <Text style={s.done}>{done}</Text> : null}
      </View>

      <Text style={s.h2}>Or keep going for free</Text>
      <Pressable style={s.row} onPress={invite}>
        <View style={s.icon}><Feather name="gift" size={20} color={colors.onPeach} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Invite a friend, get 5 swipes</Text>
          <Text style={s.rowSub}>Send them the app. More friends, more plans.</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.muted} />
      </Pressable>
      <Pressable style={s.row} onPress={() => router.push('/create-activity')}>
        <View style={s.icon}><Feather name="plus" size={20} color={colors.onPeach} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>Ask someone to join you</Text>
          <Text style={s.rowSub}>Post your own plan and let people come to you.</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.muted} />
      </Pressable>
      <Pressable style={s.row} onPress={() => router.navigate('/feed' as Href)}>
        <View style={s.icon}><Feather name="layers" size={20} color={colors.onPeach} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.rowTitle}>See what people did today</Text>
          <Text style={s.rowSub}>Like, comment and follow from the feed.</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.muted} />
      </Pressable>

      <Text style={s.h2}>Free near you right now</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 14 }}>
        {free.map((p) => (
          <Pressable key={p.id} style={s.person} onPress={() => router.push(`/person/${p.id}`)}>
            <Avatar name={p.firstName} color={p.color} size={58} />
            <Text style={s.personName}>{p.firstName}</Text>
          </Pressable>
        ))}
        <Pressable style={s.person} onPress={() => router.push('/people')}>
          <View style={s.more}><Feather name="arrow-right" size={20} color={colors.ink} /></View>
          <Text style={s.personName}>See all</Text>
        </Pressable>
      </ScrollView>
    </ScrollView>
  );
}

const s = themed(() => StyleSheet.create({
  scroll: { paddingTop: 14, paddingBottom: 120, gap: 14 },
  hero: { backgroundColor: colors.olive, borderRadius: 24, padding: 20, gap: 6 },
  heroKicker: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.1, color: colors.peach },
  heroTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.onBrand, letterSpacing: -0.8 },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.onBrand, opacity: 0.9 },
  card: { backgroundColor: colors.card, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: 18, gap: 8 },
  plusHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  plusTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, letterSpacing: -0.5 },
  perk: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  packs: { flexDirection: 'row', gap: 8, marginTop: 10 },
  pack: { flex: 1, borderRadius: 18, borderWidth: 1.5, borderColor: colors.edge, padding: 10, paddingTop: 18, alignItems: 'center', gap: 2 },
  packOn: { borderColor: colors.olive, backgroundColor: colors.oliveSoft },
  best: { position: 'absolute', top: -9, backgroundColor: colors.peach, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  bestText: { fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 0.5, color: colors.onPeach },
  packName: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink, textAlign: 'center' },
  packPrice: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink, marginTop: 4 },
  packPer: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  packNote: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.link, marginTop: 4, textAlign: 'center' },
  buy: { backgroundColor: colors.olive, borderRadius: 999, height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buyText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.onBrand },
  fine: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, textAlign: 'center' },
  done: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.link, textAlign: 'center' },
  h2: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: 14 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  person: { alignItems: 'center', gap: 6, width: 62 },
  personName: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  more: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
}));
