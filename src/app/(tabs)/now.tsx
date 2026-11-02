import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeDeck, deckColors, type SwipeDeckHandle } from '@/components/swipe-deck';
import { Avatar, MenuButton } from '@/components/ui';
import { ACTIVITIES, distanceKm, type ActivityId } from '@/data/options';
import { PEOPLE, findPerson } from '@/data/people';
import type { Activity } from '@/data/types';
import { fitsMeet } from '@/lib/meet';
import { startsAt } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

const SERIF = fonts.serif;
const HOUR = 3600000;

const WHEN = [
  { id: 'week', label: 'This week' },
  { id: 'now', label: 'Right now' },
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This weekend' },
] as const;
type When = (typeof WHEN)[number]['id'];

const WITH = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
] as const;
type With = (typeof WITH)[number]['id'];

function inWhen(a: Activity, when: When, now: number) {
  const d = startsAt(a);
  const t = d.getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const day = Math.floor((t - today.getTime()) / (24 * HOUR));
  if (when === 'now') return t - now < 3 * HOUR;
  if (when === 'today') return day === 0;
  if (when === 'tomorrow') return day === 1;
  if (when === 'weekend') return day < 7 && (d.getDay() === 0 || d.getDay() === 6);
  return day < 7;
}

const DIST = [
  { id: 'any', label: 'Any distance' },
  { id: '2', label: 'Within 2 km' },
  { id: '5', label: 'Within 5 km' },
  { id: '10', label: 'Within 10 km' },
] as const;
type Dist = (typeof DIST)[number]['id'];

type Picker = 'what' | 'with' | 'when' | 'dist' | 'all' | null;

export default function Now() {
  useTheme();
  const { profile, activities, skipped, runRequests, join, skip, clearSkipped } = useStore();
  const deck = useRef<SwipeDeckHandle | null>(null);
  const [joinedMsg, setJoinedMsg] = useState<Activity | null>(null);
  const [now] = useState(() => Date.now());
  const [what, setWhat] = useState<ActivityId | 'any'>('any');
  const [withWho, setWithWho] = useState<With>(() => profile?.meet ?? 'everyone');
  const [when, setWhen] = useState<When>('week');
  const [dist, setDist] = useState<Dist>('any');
  const [picker, setPicker] = useState<Picker>(null);
  if (!profile) return <Redirect href="/welcome" />;

  // Everything open to join this week.
  const open = activities
    .filter((a) => {
      const t = startsAt(a).getTime();
      return (
        t > now &&
        inWhen(a, 'week', now) &&
        a.hostId !== 'me' &&
        !a.participants.includes('me') &&
        a.participants.length < a.groupSize &&
        !skipped.includes(a.id) &&
        !runRequests[a.id]
      );
    })
    .sort((a, b) => startsAt(a).getTime() - startsAt(b).getTime());

  const matches = open.filter((a) => {
    const host = findPerson(a.hostId);
    return (
      (what === 'any' || a.type === what) &&
      inWhen(a, when, now) &&
      (dist === 'any' || distanceKm(profile.neighborhood, a.neighborhood) <= Number(dist)) &&
      (withWho === 'everyone' || (host && fitsMeet({ ...profile, meet: withWho }, host)))
    );
  });
  // Never a blank screen: if nothing matches, keep showing what's available.
  const noMatch = matches.length === 0;
  const soon = noMatch ? open : matches;
  const filtered = what !== 'any' || withWho !== 'everyone' || when !== 'week' || dist !== 'any';
  const nFilters = [what !== 'any', withWho !== 'everyone', when !== 'week', dist !== 'any'].filter(Boolean).length;
  const freePeople = PEOPLE.filter((p) => fitsMeet({ ...profile, meet: withWho }, p) && (what === 'any' || p.activities.includes(what)));
  const people = freePeople.length ? freePeople : PEOPLE.filter((p) => fitsMeet(profile, p));

  const whatInfo = ACTIVITIES.find((x) => x.id === what);
  const pills: { id: Exclude<Picker, null>; label: string }[] = [
    { id: 'what', label: whatInfo ? `${whatInfo.emoji} ${whatInfo.label}` : '✨ Any activity' },
    { id: 'with', label: `👥 ${WITH.find((x) => x.id === withWho)!.label}` },
    { id: 'when', label: `🕒 ${WHEN.find((x) => x.id === when)!.label}` },
    { id: 'dist', label: `📍 ${DIST.find((x) => x.id === dist)!.label}` },
  ];
  const clearAll = () => {
    setWhat('any');
    setWithWho('everyone');
    setWhen('week');
    setDist('any');
  };
  const options =
    picker === 'what'
      ? [{ id: 'any', label: '✨ Any activity' }, ...ACTIVITIES.map((x) => ({ id: x.id, label: `${x.emoji} ${x.label}` }))]
      : picker === 'with'
        ? WITH
        : picker === 'when'
          ? WHEN
          : picker === 'dist'
            ? DIST
            : [];
  const current = picker === 'what' ? what : picker === 'with' ? withWho : picker === 'dist' ? dist : when;
  function choose(id: string) {
    if (picker === 'what') setWhat(id as ActivityId | 'any');
    if (picker === 'with') setWithWho(id as With);
    if (picker === 'when') setWhen(id as When);
    if (picker === 'dist') setDist(id as Dist);
    setPicker(null);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <MenuButton onPress={() => router.push('/menu')} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={styles.pills}>
            <Pressable style={[styles.pill, styles.slidersPill, nFilters > 0 && styles.pillOn]} onPress={() => setPicker('all')} accessibilityLabel="All filters">
              <Sliders color={nFilters > 0 ? colors.onBrand : colors.ink} />
              {nFilters > 0 ? <Text style={[styles.pillText, { color: colors.onBrand }]}>{nFilters}</Text> : null}
            </Pressable>
            {pills.map((p) => (
              <Pressable key={p.id} style={styles.pill} onPress={() => setPicker(p.id)} accessibilityLabel={`Choose ${p.id}`}>
                <Text style={styles.pillText}>{p.label} ▾</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.bell} onPress={() => router.push('/messages')} accessibilityLabel="Messages">
            <View style={styles.bubble} />
            <View style={styles.badge} />
          </Pressable>
        </View>
        <Text style={styles.title}>Your week at{'\n'}Mile Club</Text>
        {filtered && noMatch ? (
          <View style={styles.note}>
            <Text style={styles.noteText}>Nothing matches yet, so here’s everyone who’s available.</Text>
            <Pressable onPress={clearAll}>
              <Text style={styles.noteLink}>Clear</Text>
            </Pressable>
          </View>
        ) : null}

        {joinedMsg && (
          <Pressable style={styles.toast} onPress={() => router.push('/activities')}>
            <Text style={styles.toastText}>
              Request sent for {joinedMsg.title}. You’re in once the host accepts. See it in My runs.
            </Text>
          </Pressable>
        )}

        {soon.length > 0 ? (
          <>
            <SwipeDeck
              items={soon}
              home={profile.neighborhood}
              deckRef={deck}
              onJoin={(a) => {
                join(a.id);
                setJoinedMsg(a);
              }}
              onSkip={(a) => {
                skip(a.id);
                setJoinedMsg(null);
              }}
            />
            <View style={styles.choices}>
              <Pressable
                onPress={() => deck.current?.swipe('left')}
                style={({ pressed }) => [styles.choice, styles.skipBtn, pressed && { opacity: 0.7 }]}
                accessibilityLabel="Skip this run">
                <Text style={styles.skipBtnText}>← ✕ Skip</Text>
              </Pressable>
              <Pressable
                onPress={() => deck.current?.swipe('right')}
                style={({ pressed }) => [styles.choice, styles.joinBtn, pressed && { opacity: 0.8 }]}
                accessibilityLabel="Join this run">
                <Text style={styles.joinBtnText}>Join ✓ →</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Swipe left to skip, right to join</Text>
          </>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>
            <Text style={styles.emptyTitle}>Who’s free to move</Text>
            <Text style={styles.emptySub}>No runs are open right now, but these people are around. Say hi or start something together.</Text>
            {people.map((p) => (
              <Pressable key={p.id} style={styles.personRow} onPress={() => router.push(`/person/${p.id}`)}>
                <Avatar name={p.firstName} color={p.color} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{p.firstName}</Text>
                  <Text style={styles.personMeta} numberOfLines={1}>
                    {p.activities.map((x) => ACTIVITIES.find((y) => y.id === x)?.emoji).join(' ')} · free {p.availability[0]?.toLowerCase()}
                  </Text>
                </View>
                <Text style={styles.personGo}>›</Text>
              </Pressable>
            ))}
            <Pressable style={styles.primary} onPress={() => router.push('/create-activity')}>
              <Text style={styles.primaryText}>Start something now</Text>
            </Pressable>
            {skipped.length > 0 && (
              <Pressable style={styles.secondary} onPress={clearSkipped}>
                <Text style={styles.secondaryText}>See skipped runs again</Text>
              </Pressable>
            )}
          </ScrollView>
        )}
      </View>

      <Modal visible={picker === 'all'} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicker(null)}>
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Pressable onPress={clearAll} hitSlop={10}>
              <Text style={styles.panelLink}>Reset</Text>
            </Pressable>
            <Text style={styles.panelTitle}>Filters</Text>
            <Pressable onPress={() => setPicker(null)} hitSlop={10}>
              <Text style={[styles.panelLink, { color: colors.link }]}>Done</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 22, gap: 6 }}>
            {(
              [
                ['What do you want to do?', [{ id: 'any', label: '✨ Any activity' }, ...ACTIVITIES.map((x) => ({ id: x.id, label: `${x.emoji} ${x.label}` }))], what, (v: string) => setWhat(v as ActivityId | 'any')],
                ['Who with?', WITH, withWho, (v: string) => setWithWho(v as With)],
                ['When?', WHEN, when, (v: string) => setWhen(v as When)],
                ['How far?', DIST, dist, (v: string) => setDist(v as Dist)],
              ] as [string, readonly { id: string; label: string }[], string, (v: string) => void][]
            ).map(([title, opts, cur, set]) => (
              <View key={title} style={styles.section}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.options}>
                  {opts.map((o) => (
                    <Pressable key={o.id} onPress={() => set(o.id)} style={[styles.option, cur === o.id && styles.optionOn]}>
                      <Text style={[styles.optionText, cur === o.id && { color: colors.onBrand }]}>{o.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <Text style={styles.panelNote}>If nothing matches, you’ll still see everyone who’s available.</Text>
          </ScrollView>
          <Pressable style={[styles.primary, { margin: 22, marginBottom: 40 }]} onPress={() => setPicker(null)}>
            <Text style={styles.primaryText}>Show {matches.length || 'available'} {matches.length === 1 ? 'session' : 'sessions'}</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={!!picker && picker !== 'all'} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicker(null)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {picker === 'what' ? 'What do you want to do?' : picker === 'with' ? 'Who with?' : picker === 'dist' ? 'How far?' : 'When?'}
            </Text>
            <View style={styles.options}>
              {options.map((o) => (
                <Pressable key={o.id} onPress={() => choose(o.id)} style={[styles.option, current === o.id && styles.optionOn]}>
                  <Text style={[styles.optionText, current === o.id && { color: colors.onBrand }]}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// Little "sliders" filter icon.
function Sliders({ color }: { color: string }) {
  return (
    <View style={{ width: 16, gap: 3 }}>
      {[4, 10, 6].map((x, i) => (
        <View key={i} style={{ height: 2, backgroundColor: color, borderRadius: 1 }}>
          <View style={{ position: 'absolute', left: x - 2, top: -2, width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
        </View>
      ))}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: deckColors.cream },
  wrap: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pills: { gap: 8, paddingRight: 4, alignItems: 'center' },
  pill: { borderRadius: 999, borderWidth: 1, borderColor: colors.edge, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: colors.card },
  slidersPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 11 },
  pillOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  panel: { flex: 1, backgroundColor: colors.bg },
  panelHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  panelTitle: { fontFamily: SERIF, fontSize: 20, color: colors.ink },
  panelLink: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.muted },
  section: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 12 },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  panelNote: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 12 },
  pillText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.oliveSoft, borderRadius: 14, padding: 10, marginTop: 10 },
  noteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink },
  noteLink: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.link },
  personRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 12 },
  personName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  personMeta: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  personGo: { fontSize: 24, color: colors.muted },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
  sheetTitle: { fontFamily: SERIF, fontSize: 22, color: colors.ink, marginBottom: 14 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { borderRadius: 999, borderWidth: 1, borderColor: colors.edge, paddingVertical: 10, paddingHorizontal: 14 },
  optionOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  optionText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  bell: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  bubble: { width: 18, height: 14, borderRadius: 6, borderBottomLeftRadius: 2, backgroundColor: colors.onBrand },
  badge: { position: 'absolute', top: 9, right: 9, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.peachDeep, borderWidth: 1.5, borderColor: colors.olive },
  title: { fontFamily: SERIF, fontSize: 38, lineHeight: 40, color: colors.ink, marginTop: 18 },
  toast: { backgroundColor: deckColors.peach, borderRadius: 16, padding: 12, marginTop: 12 },
  toastText: { color: colors.onPeach, fontFamily: fonts.sansSemi, fontSize: 13 },
  hint: { textAlign: 'center', color: colors.muted, fontFamily: fonts.sans, fontSize: 12, marginTop: 8 },
  choices: { flexDirection: 'row', gap: 12, marginTop: 14 },
  choice: { flex: 1, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { borderWidth: 1, borderColor: colors.edge },
  skipBtnText: { color: colors.ink, fontFamily: fonts.sansSemi, fontSize: 15 },
  joinBtn: { backgroundColor: colors.olive },
  joinBtnText: { color: colors.onBrand, fontFamily: fonts.sansSemi, fontSize: 15 },
  emptyTitle: { fontFamily: SERIF, fontSize: 22, color: colors.ink },
  emptySub: { fontSize: 14, color: colors.muted, fontFamily: fonts.sans, lineHeight: 20 },
  primary: { backgroundColor: deckColors.olive, borderRadius: 999, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', marginTop: 10 },
  primaryText: { color: colors.onBrand, fontFamily: fonts.sansSemi, fontSize: 15 },
  secondary: { borderRadius: 999, paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center', borderWidth: 1.5, borderColor: deckColors.olive },
  secondaryText: { color: deckColors.olive, fontFamily: fonts.sansSemi, fontSize: 15 },
}));
