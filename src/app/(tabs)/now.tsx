import Feather from '@expo/vector-icons/Feather';
import { Redirect, router, type Href } from 'expo-router';
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

// Home in the blend look (Yana, 2026-11-13/14): a friendly hub first, swiping one tap away.
const VIBES: ActivityId[] = ['running', 'tennis', 'strength', 'spa', 'coffee', 'new'];
const VIBE_NAMES: Partial<Record<ActivityId, string>> = { tennis: 'Padel & tennis', strength: 'Strength', spa: 'Spa', coffee: 'Coffee', new: 'New thing' };

function greeting(h: number) {
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function whenLabel(a: Activity, now: number) {
  const t = startsAt(a).getTime();
  const hrs = Math.round((t - now) / HOUR);
  if (hrs < 1) return 'starting soon';
  if (hrs < 24) return `in ${hrs} hour${hrs === 1 ? '' : 's'}`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

function HomeHub({ now, openCount, onSwipe }: { now: number; openCount: number; onSwipe: (what?: ActivityId) => void }) {
  const { profile, activities, notices } = useStore();
  const unread = (notices ?? []).filter((n) => !n.read).length;
  if (!profile) return null;
  const mine = activities
    .filter((a) => (a.hostId === 'me' || a.participants.includes('me')) && startsAt(a).getTime() > now)
    .sort((a, b) => startsAt(a).getTime() - startsAt(b).getTime());
  const next = mine[0];
  const crew = next ? next.participants.map((id) => findPerson(id)).filter((p): p is NonNullable<typeof p> => !!p).slice(0, 4) : [];
  const people = PEOPLE.filter((p) => fitsMeet(profile, p)).slice(0, 8);
  const d = new Date(now);
  const date = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <ScrollView contentContainerStyle={hub.scroll} showsVerticalScrollIndicator={false}>
      <View style={hub.top}>
        <MenuButton onPress={() => router.push('/menu')} />
        <View style={{ flex: 1 }} />
        <Pressable style={hub.round} onPress={() => router.push('/notifications' as Href)} accessibilityLabel="Notifications">
          <Feather name="bell" size={19} color={colors.ink} />
          {unread ? <View style={hub.dot} /> : null}
        </Pressable>
        <Pressable onPress={() => router.navigate('/profile' as Href)} accessibilityLabel="Your profile">
          <View style={hub.ring}>
            <Avatar name={profile.firstName} uri={profile.photoUri} size={40} />
          </View>
        </Pressable>
      </View>

      <Text style={hub.date}>{date}</Text>
      <Text style={hub.hello}>
        {greeting(d.getHours())}, {profile.firstName}.{'\n'}
        <Text style={{ color: colors.link }}>What are we trying today?</Text>
      </Text>

      {next ? (
        <Pressable style={hub.next} onPress={() => router.push(`/activity/${next.id}`)}>
          <View style={hub.nextRow}>
            <Text style={hub.nextLabel}>YOUR NEXT PLAN</Text>
            <Text style={hub.nextWhen}>{whenLabel(next, now)}</Text>
          </View>
          <Text style={hub.nextTitle} numberOfLines={2}>{next.title}</Text>
          <View style={hub.nextRow}>
            <View style={{ flexDirection: 'row' }}>
              {crew.map((p, i) => (
                <View key={p.id} style={[hub.crew, i > 0 && { marginLeft: -10 }]}>
                  <Avatar name={p.firstName} color={p.color} size={28} />
                </View>
              ))}
            </View>
            <View style={hub.nextBtn}>
              <Text style={hub.nextBtnText}>Open plan</Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <Pressable style={hub.next} onPress={() => onSwipe()}>
          <Text style={hub.nextLabel}>NO PLANS YET</Text>
          <Text style={hub.nextTitle}>Find your first plan this week</Text>
          <View style={[hub.nextBtn, { alignSelf: 'flex-start' }]}>
            <Text style={hub.nextBtnText}>Start swiping</Text>
          </View>
        </Pressable>
      )}

      <Pressable style={hub.swipe} onPress={() => onSwipe()}>
        <View style={hub.swipeIcon}>
          <Feather name="layers" size={22} color={colors.onPeach} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hub.swipeTitle}>Swipe plans near you</Text>
          <Text style={hub.swipeSub}>{openCount} open this week · right to join, left to skip</Text>
        </View>
        <Feather name="arrow-right" size={20} color={colors.ink} />
      </Pressable>

      <Text style={hub.h2}>Pick a vibe</Text>
      <View style={hub.grid}>
        {VIBES.map((id, i) => {
          const a = ACTIVITIES.find((x) => x.id === id);
          if (!a) return null;
          return (
            <Pressable key={id} style={[hub.vibe, { backgroundColor: i % 3 === 1 ? colors.peach : i % 3 === 0 ? colors.oliveSoft : colors.sand }]} onPress={() => onSwipe(id)}>
              <Text style={hub.vibeEmoji}>{a.emoji}</Text>
              <Text style={[hub.vibeText, { color: i % 3 === 1 ? colors.onPeach : colors.ink }]} numberOfLines={1}>{VIBE_NAMES[id] ?? a.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={hub.rowHead}>
        <Text style={hub.h2}>People you might click with</Text>
        <Pressable onPress={() => router.push('/people')} hitSlop={8}>
          <Text style={hub.link}>See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 14 }}>
        {people.map((p) => (
          <Pressable key={p.id} style={hub.person} onPress={() => router.push(`/person/${p.id}`)}>
            <Avatar name={p.firstName} color={p.color} size={60} />
            <Text style={hub.personName} numberOfLines={1}>{p.firstName}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

export default function Now() {
  useTheme();
  const { profile, activities, skipped, runRequests, join, skip, clearSkipped, notices } = useStore();
  const unread = (notices ?? []).filter((n) => !n.read).length;
  const deck = useRef<SwipeDeckHandle | null>(null);
  const [joinedMsg, setJoinedMsg] = useState<Activity | null>(null);
  const [now] = useState(() => Date.now());
  const [what, setWhat] = useState<ActivityId | 'any'>('any');
  const [withWho, setWithWho] = useState<With>(() => profile?.meet ?? 'everyone');
  const [when, setWhen] = useState<When>('week');
  const [dist, setDist] = useState<Dist>('any');
  const [picker, setPicker] = useState<Picker>(null);
  const [swiping, setSwiping] = useState(false);
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

  if (!swiping)
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <HomeHub
          now={now}
          openCount={open.length}
          onSwipe={(w) => {
            if (w) setWhat(w);
            setSwiping(true);
          }}
        />
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Pressable style={styles.notif} onPress={() => setSwiping(false)} accessibilityLabel="Back to Home">
            <Feather name="chevron-left" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
            Swipe plans
          </Text>
          <Pressable style={styles.notif} onPress={() => router.push('/notifications' as Href)} accessibilityLabel="Notifications">
            <Feather name="bell" size={19} color={colors.ink} />
            {unread ? (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{unread}</Text>
              </View>
            ) : null}
          </Pressable>
          <Pressable style={styles.bell} onPress={() => router.push('/messages')} accessibilityLabel="Messages">
            <View style={styles.bubble} />
            <View style={styles.badge} />
          </Pressable>
        </View>
        {/* Filters, like Hinge: a scrollable row of pills under the header */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillScroll} contentContainerStyle={styles.pills}>
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
              Request sent for {joinedMsg.title}. We’ll let you know as soon as the host answers.
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
                accessibilityLabel="Skip this plan">
                <Text style={styles.skipBtnText}>← ✕ Skip</Text>
              </Pressable>
              <Pressable
                onPress={() => deck.current?.swipe('right')}
                style={({ pressed }) => [styles.choice, styles.joinBtn, pressed && { opacity: 0.8 }]}
                accessibilityLabel="Join this plan">
                <Text style={styles.joinBtnText}>Join ✓ →</Text>
              </Pressable>
            </View>
            <Text style={styles.hint}>Swipe left to skip, right to join</Text>
          </>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>
            <Text style={styles.emptyTitle}>Who’s free to move</Text>
            <Text style={styles.emptySub}>Nothing is open right now, but these people are around. Say hi or start something together.</Text>
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
                <Text style={styles.secondaryText}>See skipped plans again</Text>
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
  notif: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  notifIcon: { fontSize: 18 },
  notifBadge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.peachDeep, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notifBadgeText: { fontFamily: fonts.sansBold, fontSize: 11, color: '#fff' },
  pillScroll: { marginHorizontal: -22, marginTop: 14, flexGrow: 0 },
  pills: { gap: 8, paddingHorizontal: 22, alignItems: 'center' },
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
  title: { flex: 1, fontFamily: SERIF, fontSize: 28, color: colors.ink },
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

const hub = themed(() => StyleSheet.create({
  scroll: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 120, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  round: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  dot: { position: 'absolute', top: 10, right: 11, width: 9, height: 9, borderRadius: 5, backgroundColor: colors.peachDeep },
  ring: { padding: 2, borderRadius: 24, borderWidth: 2, borderColor: colors.olive },
  date: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.muted, marginTop: 4 },
  hello: { fontFamily: fonts.serif, fontSize: 28, lineHeight: 34, color: colors.ink, letterSpacing: -0.8, marginTop: -8 },
  next: { backgroundColor: colors.olive, borderRadius: 24, padding: 18, gap: 10 },
  nextRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nextLabel: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1.2, color: colors.peach },
  nextWhen: { fontFamily: fonts.sans, fontSize: 13, color: colors.onBrand, opacity: 0.85 },
  nextTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 27, color: colors.onBrand, letterSpacing: -0.6 },
  crew: { borderWidth: 2, borderColor: colors.olive, borderRadius: 16 },
  nextBtn: { backgroundColor: colors.peach, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  nextBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.onPeach },
  swipe: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, padding: 14 },
  swipeIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' },
  swipeTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  swipeSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  h2: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, letterSpacing: -0.5, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibe: { width: '31.5%', height: 92, borderRadius: 20, padding: 12, justifyContent: 'space-between' },
  vibeEmoji: { fontSize: 24 },
  vibeText: { fontFamily: fonts.sansBold, fontSize: 14 },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  link: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.link },
  person: { alignItems: 'center', gap: 6, width: 64 },
  personName: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
}));
