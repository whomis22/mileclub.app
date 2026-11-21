import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OutOfSwipes } from '@/components/out-of-swipes';
import { PeopleSwipe, type PeopleSwipeHandle, type SwipePerson } from '@/components/people-swipe';
import { Avatar } from '@/components/ui';
import { faceFor, nextWant } from '@/data/faces';
import { ACTIVITIES, distanceKm, type ActivityId } from '@/data/options';
import { PEOPLE } from '@/data/people';
import { fitsMeet } from '@/lib/meet';
import { useSwipes } from '@/lib/swipes';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

// Explore (design board, 2026-11-21): filter chips, a deck of people to swipe,
// pass / super like / like buttons, and "It's a match!" when you both fit.
const DIST = [
  { id: 'any', label: 'Any distance' },
  { id: '2', label: '2 km' },
  { id: '5', label: '5 km' },
  { id: '10', label: '10 km' },
] as const;
const WHEN = [
  { id: 'any', label: 'Any time' },
  { id: 'now', label: 'Right now' },
  { id: 'tonight', label: 'Tonight' },
  { id: 'today', label: 'Today' },
] as const;
type Picker = 'what' | 'dist' | 'when' | null;

// Sample people live in one city; anyone far away is shown as a short walk away until real members join.
function kmTo(home: Parameters<typeof distanceKm>[0], p: (typeof PEOPLE)[number]) {
  const d = distanceKm(home, p.neighborhood);
  if (d < 50) return d;
  return 0.4 + ([...p.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 42) / 10;
}

function freeLabel(id: string, now: number) {
  const w = nextWant(id, now);
  if (!w) return 'Free this week';
  const mins = Math.round((w.when.getTime() - now) / 60000);
  if (mins < 45) return 'Free now';
  if (mins < 6 * 60) return `Free in ${Math.round(mins / 60)}h`;
  return `Free ${w.label.toLowerCase()}`;
}

export default function Explore() {
  useTheme();
  const { profile, following, toggleFollow } = useStore();
  const swipes = useSwipes();
  const deck = useRef<PeopleSwipeHandle | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [what, setWhat] = useState<ActivityId | 'any'>('any');
  const [dist, setDist] = useState<(typeof DIST)[number]['id']>('any');
  const [when, setWhen] = useState<(typeof WHEN)[number]['id']>('any');
  const [picker, setPicker] = useState<Picker>(null);
  const [match, setMatch] = useState<SwipePerson | null>(null);
  const [now] = useState(() => Date.now());
  if (!profile) return <Redirect href="/welcome" />;

  const items: SwipePerson[] = PEOPLE.filter((p) => fitsMeet(profile, p) && !seen.includes(p.id))
    .map((p) => ({ p, km: kmTo(profile.neighborhood, p), free: freeLabel(p.id, now), at: nextWant(p.id, now)?.when.getTime() ?? Infinity }))
    .filter((x) => (what === 'any' || x.p.activities.includes(what)) && (dist === 'any' || x.km <= Number(dist)))
    .filter((x) => {
      if (when === 'any') return true;
      const h = (x.at - now) / 3600000;
      if (when === 'now') return h < 1;
      const end = new Date(now);
      end.setHours(23, 59, 0, 0);
      if (when === 'tonight') return x.at <= end.getTime() && new Date(x.at).getHours() >= 17;
      return x.at <= end.getTime();
    })
    .sort((a, b) => a.at - b.at);

  function done(x: SwipePerson) {
    swipes.use();
    setSeen((s) => [...s, x.p.id]);
  }
  function like(x: SwipePerson, superLike = false) {
    done(x);
    const fits = superLike || x.p.activities.some((a) => profile!.activities.includes(a));
    if (fits) {
      if (!following.includes(x.p.id)) toggleFollow(x.p.id);
      setMatch(x);
    }
  }

  const whatLabel = what === 'any' ? 'Activity' : ACTIVITIES.find((a) => a.id === what)!.label;
  const chips: { id: Exclude<Picker, null>; label: string; on: boolean }[] = [
    { id: 'what', label: whatLabel, on: what !== 'any' },
    { id: 'dist', label: dist === 'any' ? 'Distance' : DIST.find((d) => d.id === dist)!.label, on: dist !== 'any' },
    { id: 'when', label: when === 'any' ? 'When' : WHEN.find((w) => w.id === when)!.label, on: when !== 'any' },
  ];
  const options =
    picker === 'what'
      ? [{ id: 'any', label: 'Any activity' }, ...ACTIVITIES.map((a) => ({ id: a.id, label: `${a.emoji} ${a.label}` }))]
      : picker === 'dist'
        ? DIST
        : picker === 'when'
          ? WHEN
          : [];
  const current = picker === 'what' ? what : picker === 'dist' ? dist : when;
  const myFace = profile.photoUri;
  const theirFace = match ? faceFor(match.p.id)?.photo : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.head}>
          {chips.map((c) => (
            <Pressable key={c.id} style={[styles.chip, c.on && styles.chipOn]} onPress={() => setPicker(c.id)}>
              <Text style={[styles.chipText, c.on && { color: colors.onCta }]} numberOfLines={1}>
                {c.label}
              </Text>
              <Feather name="chevron-down" size={14} color={c.on ? colors.onCta : colors.ink} />
            </Pressable>
          ))}
          <Pressable style={styles.round} onPress={() => router.push('/explore' as Href)} accessibilityLabel="Places map">
            <Feather name="map" size={18} color={colors.ink} />
          </Pressable>
        </View>

        {swipes.outOfSwipes ? (
          <OutOfSwipes onPlus={swipes.buyPlus} onBonus={swipes.addBonus} />
        ) : items.length ? (
          <>
            <PeopleSwipe items={items} swipeRef={deck} onLike={(x) => like(x)} onPass={done} />
            <View style={styles.buttons}>
              <Pressable style={[styles.btn, styles.pass]} onPress={() => deck.current?.swipe('left')} accessibilityLabel="Pass">
                <Feather name="x" size={26} color={colors.ink} />
              </Pressable>
              <Pressable style={[styles.btn, styles.star]} onPress={() => items[0] && like(items[0], true)} accessibilityLabel="Super like">
                <Ionicons name="star" size={24} color="#000" />
              </Pressable>
              <Pressable style={[styles.btn, styles.pass]} onPress={() => deck.current?.swipe('right')} accessibilityLabel="Like">
                <Ionicons name="heart" size={26} color="#FF4F7B" />
              </Pressable>
            </View>
            <Text style={styles.hint}>{swipes.plus ? 'Premium: unlimited swipes' : `${swipes.left} free ${swipes.left === 1 ? 'swipe' : 'swipes'} left today`}</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Feather name="users" size={34} color={colors.muted} />
            <Text style={styles.emptyTitle}>You’ve seen everyone for now</Text>
            <Text style={styles.emptySub}>Try other filters, or start a plan and let people come to you.</Text>
            <Pressable style={styles.lime} onPress={() => router.push('/create-activity')}>
              <Text style={styles.limeText}>Start a plan</Text>
            </Pressable>
            <Pressable onPress={() => { setSeen([]); setWhat('any'); setDist('any'); setWhen('any'); }}>
              <Text style={styles.link}>See everyone again</Text>
            </Pressable>
          </View>
        )}
      </View>

      <Modal visible={!!picker} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicker(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{picker === 'what' ? 'What do you want to do?' : picker === 'dist' ? 'How far?' : 'When?'}</Text>
            <View style={styles.options}>
              {options.map((o) => (
                <Pressable
                  key={o.id}
                  style={[styles.option, current === o.id && styles.chipOn]}
                  onPress={() => {
                    if (picker === 'what') setWhat(o.id as ActivityId | 'any');
                    if (picker === 'dist') setDist(o.id as (typeof DIST)[number]['id']);
                    if (picker === 'when') setWhen(o.id as (typeof WHEN)[number]['id']);
                    setPicker(null);
                  }}>
                  <Text style={[styles.chipText, current === o.id && { color: colors.onCta }]}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!match} animationType="fade" onRequestClose={() => setMatch(null)}>
        <SafeAreaView style={styles.match}>
          <View style={styles.matchMid}>
            <Ionicons name="heart" size={56} color={colors.cta} />
            <View style={styles.pair}>
              <View style={[styles.face, { transform: [{ rotate: '-6deg' }] }]}>
                {myFace ? <Image source={{ uri: myFace }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Avatar name={profile.firstName} size={124} />}
              </View>
              <View style={[styles.face, { marginLeft: -26, transform: [{ rotate: '6deg' }] }]}>
                {theirFace ? <Image source={{ uri: theirFace }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              </View>
            </View>
            <Text style={styles.matchTitle}>It’s a match!</Text>
            <Text style={styles.matchSub}>
              You and {match?.p.firstName} are both into {match ? ACTIVITIES.find((a) => match.p.activities.includes(a.id) && profile.activities.includes(a.id))?.label.toLowerCase() ?? 'moving' : ''}.{'\n'}Start a chat and plan your next workout together.
            </Text>
          </View>
          <View style={styles.matchBottom}>
            <Pressable
              style={styles.lime}
              onPress={() => {
                const id = match?.p.id;
                setMatch(null);
                if (id) router.push(`/chat/${id}` as Href);
              }}>
              <Text style={styles.limeText}>Send a message</Text>
            </Pressable>
            <Pressable onPress={() => setMatch(null)} hitSlop={10}>
              <Text style={styles.keep}>Keep swiping</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    wrap: { flex: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    chip: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.card, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.edge },
    chipOn: { backgroundColor: colors.cta, borderColor: colors.cta },
    chipText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
    round: { marginLeft: 'auto', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    buttons: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 22, marginTop: 18 },
    btn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
    pass: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.edge },
    star: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.cta },
    hint: { textAlign: 'center', fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 10 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },
    emptyTitle: { fontFamily: fonts.serif, fontSize: 21, color: colors.ink, textAlign: 'center' },
    emptySub: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
    lime: { alignSelf: 'stretch', height: 54, borderRadius: 27, backgroundColor: colors.cta, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    limeText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.onCta },
    link: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.link, marginTop: 6 },
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
    sheetTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, marginBottom: 14 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { borderRadius: 999, borderWidth: 1, borderColor: colors.edge, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.card },
    match: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
    matchMid: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 14 },
    pair: { flexDirection: 'row', marginTop: 6 },
    face: { width: 128, height: 128, borderRadius: 64, overflow: 'hidden', borderWidth: 4, borderColor: colors.cta, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    matchTitle: { fontFamily: fonts.serif, fontSize: 32, color: colors.ink, marginTop: 8 },
    matchSub: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
    matchBottom: { paddingHorizontal: 24, paddingBottom: 20, gap: 16, alignItems: 'center' },
    keep: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  }),
);

