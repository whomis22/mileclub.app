import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { photoFor } from '@/components/swipe-deck';
import { faceFor, nextWant } from '@/data/faces';
import { activityInfo, cityOf, distanceKm, type Neighborhood } from '@/data/options';
import { findPerson } from '@/data/people';
import type { Activity, Person } from '@/data/types';
import { formatKm } from '@/lib/matching';
import { startsAt } from '@/lib/time';
import { colors, fonts, themed, useTheme } from '@/theme';

// "For you" first page (Yana, 2026-11-17): a People / Plans toggle, big photo cards
// you swipe through sideways, page dots, then a row of smaller "near you" cards.

const W = Dimensions.get('window').width;
const PAD = 20;
const GAP = 12;
const CARD = W - PAD * 2 - 28; // leaves the next card peeking in
const MATCHA = '#C9DD9A';
const DARK = '#16190F';

export type Mode = 'people' | 'plans';

export function whenLabel(a: Activity) {
  const d = startsAt(a);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = Math.floor((d.getTime() - today.getTime()) / 86400000);
  const time = a.time;
  if (day === 0) return d.getHours() >= 17 ? `Tonight ${time}` : `Today ${time}`;
  if (day === 1) return `Tomorrow ${time}`;
  return `${d.toLocaleDateString('en-GB', { weekday: 'short' })} ${time}`;
}

export function ForYou({
  mode,
  plans,
  people,
  home,
  requested,
  following,
  onJoin,
  onAdd,
  onNewCard,
  swipesLeft,
}: {
  mode: Mode;
  plans: Activity[];
  people: Person[];
  home: Neighborhood;
  requested: (id: string) => boolean;
  following: string[];
  onJoin: (a: Activity) => void;
  onAdd: (p: Person) => void;
  onNewCard: () => void;
  swipesLeft: string;
}) {
  useTheme();
  const [index, setIndex] = useState(0);
  const seen = useRef({ people: 0, plans: 0 });
  // Bottom row is always group activities; the Plans cards up top are single people looking for someone.
  const groups = plans.filter((a) => !a.solo);
  const solos = plans.filter((a) => a.solo);
  const top = solos.length ? solos : plans;
  // People sorted by whose plan starts soonest (5:30 now? the 6pm gym buddy comes first).
  const ppl = [...people].sort((x, y) => (nextWant(x.id)?.when.getTime() ?? Infinity) - (nextWant(y.id)?.when.getTime() ?? Infinity));
  const total = mode === 'plans' ? top.length : ppl.length;
  const city = cityOf(home) ?? 'your city';

  function onEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / (CARD + GAP));
    setIndex(i);
    if (i > seen.current[mode]) {
      seen.current[mode] = i;
      onNewCard(); // each new card you swipe to uses one of today's swipes
    }
  }

  const dots = Math.min(total, 7);
  const activeDot = total <= 7 ? index : Math.round((index / (total - 1)) * (dots - 1));

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.head}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h1}>For you</Text>
          <Text style={styles.sub}>{mode === 'plans' ? 'People looking for someone to join them' : 'Who wants company soonest, first'}</Text>
        </View>
        {total > 0 ? (
          <Text style={styles.count}>
            {Math.min(index + 1, total)} of {total}
          </Text>
        ) : null}
      </View>

      <ScrollView
        key={mode}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: PAD, gap: GAP }}
        onMomentumScrollEnd={onEnd}>
        {mode === 'plans'
          ? top.map((a) => <PlanCard key={a.id} a={a} home={home} requested={requested(a.id)} onJoin={() => onJoin(a)} />)
          : ppl.map((p) => <PersonCard key={p.id} p={p} added={following.includes(p.id)} onAdd={() => onAdd(p)} />)}
      </ScrollView>

      {dots > 1 ? (
        <View style={styles.dots}>
          {Array.from({ length: dots }, (_, i) => (
            <View key={i} style={[styles.dot, i === activeDot && styles.dotOn]} />
          ))}
        </View>
      ) : null}
      <Text style={styles.left}>{swipesLeft}</Text>

      <View style={styles.rowHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.h2}>{`Group activities in ${city}`}</Text>
          <Text style={styles.sub}>{'Join a group this week'}</Text>
        </View>
        <Pressable onPress={() => router.push('/activities' as Href)} hitSlop={8}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: PAD, gap: 10 }}>
        {(groups.length ? groups : plans).map((a) => {
              const on = requested(a.id);
              return (
                <Pressable key={a.id} style={styles.mini} onPress={() => router.push(`/activity/${a.id}` as Href)}>
                  <Image source={{ uri: photoFor(a) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.miniShade} />
                  <Pressable style={[styles.plus, on && styles.plusOn]} onPress={() => !on && onJoin(a)} accessibilityLabel={`Join ${a.title}`}>
                    <Feather name={on ? 'check' : 'plus'} size={16} color={DARK} />
                  </Pressable>
                  <Text style={styles.miniName} numberOfLines={2}>{a.title}</Text>
                  <Text style={styles.miniMeta} numberOfLines={1}>{whenLabel(a)} · {a.participants.length}/{a.groupSize} going</Text>
                </Pressable>
              );
            })}
      </ScrollView>
    </ScrollView>
  );
}

function PlanCard({ a, home, requested, onJoin }: { a: Activity; home: Neighborhood; requested: boolean; onJoin: () => void }) {
  useTheme();
  const info = activityInfo(a.type);
  const host = findPerson(a.hostId);
  const left = Math.max(0, a.groupSize - a.participants.length);
  const km = formatKm(distanceKm(home, a.neighborhood));
  const action = requested ? 'Requested ✓' : a.solo ? `I’m in` : 'Ask to join';
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/activity/${a.id}` as Href)}>
      <Image source={{ uri: photoFor(a) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(10,14,6,0.92)']} locations={[0, 0.35, 0.85]} style={StyleSheet.absoluteFill} />
      <View style={styles.chips}>
        <View style={[styles.chip, a.solo && { backgroundColor: colors.peach }]}>
          <Text style={styles.chipText}>{a.solo ? `Wants ${left === 1 ? '1 person' : `${left} people`}` : `${info.emoji} Group plan`}</Text>
        </View>
        <View style={styles.chipDark}>
          <Text style={styles.chipDarkText}>{whenLabel(a)}</Text>
        </View>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.name} numberOfLines={2}>
          {a.solo ? `“${a.title}”` : a.title}
        </Text>
        <Text style={styles.place} numberOfLines={1}>
          <Feather name="map-pin" size={12} color="#fff" /> {a.location} · {km}
        </Text>
        <Text style={styles.work} numberOfLines={1}>
          {a.solo ? `${host?.firstName ?? 'Someone'} + you · ${info.label}` : `Hosted by ${host?.firstName ?? 'a member'} · ${a.participants.length} of ${a.groupSize} going`}
        </Text>
        <View style={styles.actions}>
          <Pressable style={[styles.cta, requested && styles.ctaDone]} onPress={requested ? undefined : onJoin}>
            <Text style={styles.ctaText}>{action}</Text>
          </Pressable>
          <Pressable style={styles.chat} onPress={() => router.push(`/chat/${a.hostId}` as Href)} accessibilityLabel="Message the host">
            <Feather name="message-circle" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function PersonCard({ p, added, onAdd }: { p: Person; added: boolean; onAdd: () => void }) {
  useTheme();
  const f = faceFor(p.id);
  const w = nextWant(p.id);
  const city = cityOf(p.neighborhood);
  return (
    <Pressable style={styles.card} onPress={() => router.push(`/person/${p.id}` as Href)}>
      {f ? <Image source={{ uri: f.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: p.color }]} />}
      <LinearGradient colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(10,14,6,0.92)']} locations={[0, 0.3, 0.8]} style={StyleSheet.absoluteFill} />
      {w ? (
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{activityInfo(w.type).emoji} {activityInfo(w.type).label}</Text>
          </View>
          <View style={styles.chipDark}>
            <Text style={styles.chipDarkText}>{w.label}</Text>
          </View>
        </View>
      ) : null}
      <View style={styles.bottom}>
        <Text style={styles.name} numberOfLines={1}>
          {p.firstName}, {p.age}
        </Text>
        <Text style={styles.place} numberOfLines={1}>
          <Feather name="map-pin" size={12} color="#fff" /> {p.neighborhood}
          {city ? `, ${city}` : ''}
        </Text>
        <Text style={styles.work} numberOfLines={1}>
          {f?.work ?? p.activities.map((x) => activityInfo(x).label).join(' · ')}
        </Text>
        {w ? (
          <View style={styles.wants}>
            <Text style={styles.wantsLabel}>LOOKING FOR SOMEONE</Text>
            <Text style={styles.wantsText} numberOfLines={1}>
              {w.what} · {w.label}
            </Text>
          </View>
        ) : null}
        <Text style={styles.also} numberOfLines={1}>
          Also into {p.activities.map((x) => `${activityInfo(x).emoji} ${activityInfo(x).label}`).join('  ')}
        </Text>
        <View style={styles.actions}>
          <Pressable style={[styles.cta, added && styles.ctaDone]} onPress={onAdd}>
            <Text style={styles.ctaText}>{added ? 'Asked ✓' : `Join ${p.firstName}`}</Text>
          </Pressable>
          <Pressable style={styles.chat} onPress={() => router.push(`/chat/${p.id}` as Href)} accessibilityLabel={`Message ${p.firstName}`}>
            <Feather name="message-circle" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    head: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: PAD, marginTop: 16, marginBottom: 12 },
    h1: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
    h2: { fontFamily: fonts.serif, fontSize: 19, color: colors.ink },
    sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
    count: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted, marginBottom: 2 },
    card: { width: CARD, height: CARD * 1.32, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.olive },
    chips: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
    chip: { backgroundColor: MATCHA, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11 },
    chipText: { fontFamily: fonts.sansBold, fontSize: 12, color: DARK },
    chipDark: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11 },
    chipDarkText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#fff' },
    bottom: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 4 },
    name: { fontFamily: fonts.serif, fontSize: 26, lineHeight: 31, color: '#fff' },
    place: { fontFamily: fonts.sansSemi, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
    work: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#fff', marginTop: 6 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
    cta: { flex: 1, height: 52, borderRadius: 26, backgroundColor: MATCHA, alignItems: 'center', justifyContent: 'center' },
    ctaDone: { backgroundColor: 'rgba(255,255,255,0.85)' },
    ctaText: { fontFamily: fonts.sansBold, fontSize: 16, color: DARK },
    chat: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
    wants: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12, marginTop: 8 },
    wantsLabel: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, color: MATCHA },
    wantsText: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#fff', marginTop: 2 },
    also: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 6 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 14 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.edge },
    dotOn: { width: 18, backgroundColor: colors.ink },
    left: { textAlign: 'center', fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 8 },
    rowHead: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: PAD, marginTop: 24, marginBottom: 12 },
    seeAll: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.link, marginBottom: 2 },
    mini: { width: 150, height: 190, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.olive, justifyContent: 'flex-end', padding: 12 },
    miniShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 110 },
    miniName: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
    miniMeta: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
    plus: { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: MATCHA, alignItems: 'center', justifyContent: 'center' },
    plusOn: { backgroundColor: '#fff' },
  }),
);
