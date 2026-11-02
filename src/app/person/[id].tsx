import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActivityCard } from '@/components/activity-card';
import { Avatar } from '@/components/ui';
import { FEED, TEXT_POSTS } from '@/data/feed';
import { distanceKm } from '@/data/options';
import { findPerson } from '@/data/people';
import { formatKm, matchScore } from '@/lib/matching';
import { useStore } from '@/state/store';
import { fonts, useTheme } from '@/theme';

const PHOTOS = [
  require('../../../assets/images/photos/river.png'),
  require('../../../assets/images/photos/park.png'),
  require('../../../assets/images/photos/dusk.png'),
  require('../../../assets/images/photos/lake.png'),
];

type Tile = { key: string; postId?: string; photo?: number; km?: number; text?: string };

// Their posts for the grid: real sample posts first, then a few sample run photos
// so every profile has something to show before launch.
function tilesFor(personId: string): Tile[] {
  const tiles: Tile[] = [];
  FEED.forEach((f, i) => {
    if (f.personId === personId) tiles.push({ key: f.id, postId: f.id, photo: PHOTOS[i % PHOTOS.length], km: f.distanceKm });
  });
  TEXT_POSTS.forEach((t) => {
    if (t.personId === personId) tiles.push({ key: t.id, postId: t.id, text: t.text });
  });
  const seed = [...personId].reduce((n, c) => n + c.charCodeAt(0), 0);
  for (let i = 0; tiles.length < 6 + (seed % 4); i++) {
    tiles.push({ key: `g${i}`, photo: PHOTOS[(seed + i + tiles.length) % PHOTOS.length], km: i % 3 === 2 ? undefined : Math.round(((seed + i * 7) % 90) / 10 + 3) + ((i * 3) % 10) / 10 });
  }
  return tiles;
}

const TABS = [
  { id: 'posts', icon: '▦', label: 'Posts' },
  { id: 'runs', icon: '🏃', label: 'Runs' },
  { id: 'tagged', icon: '◎', label: 'Tagged' },
] as const;

export default function PersonDetail() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tileW = Math.floor((Math.min(width, 500) - 4) / 3);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, activities, block, following, toggleFollow } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('posts');
  const [menu, setMenu] = useState(false);
  const p = findPerson(id);
  if (!p || !profile) return null;

  const c = isDark
    ? { bg: '#000000', ink: '#F5F5F5', muted: '#A8A8A8', line: '#262626', pill: '#262626', tile: '#121212' }
    : { bg: '#FFFFFF', ink: '#000000', muted: '#737373', line: '#DBDBDB', pill: '#EFEFEF', tile: '#F2F2F2' };
  const olive = isDark ? '#8FA567' : '#556B2F';

  const score = matchScore(profile, p);
  const theirs = activities.filter((a) => a.participants.includes(p.id) || a.hostId === p.id);
  const follows = following.includes(p.id);
  // Message unlocks only once you've been accepted into a run together (either way round).
  const together = theirs.filter((a) => a.participants.includes('me') || a.hostId === 'me');
  const canMessage = together.length > 0;
  const tiles = tilesFor(p.id);
  const handle = `${p.firstName.toLowerCase()}.runs`;
  const km = formatKm(distanceKm(profile.neighborhood, p.neighborhood));

  function onBlock() {
    Alert.alert(`Block ${p!.firstName}?`, "You won't see each other or each other's activities.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Block', style: 'destructive', onPress: () => { block(p!.id); router.back(); } },
    ]);
  }
  const onReport = () => Alert.alert('Report sent', `Thanks. Our team will review ${p!.firstName}'s profile.`);

  const menuItems: [string, () => void, boolean?][] = [
    [follows ? `Unfollow ${p.firstName}` : `Follow ${p.firstName}`, () => toggleFollow(p.id)],
    ['Report', onReport, true],
    [`Block ${p.firstName}`, onBlock, true],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.top, { borderBottomColor: c.bg }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <Text style={[s.chev, { color: c.ink }]}>‹</Text>
        </Pressable>
        <View style={s.handleRow}>
          <Text style={[s.handle, { color: c.ink }]}>{handle}</Text>
          {p.isCaptain ? (
            <View style={[s.tick, { backgroundColor: olive }]}>
              <Text style={s.tickText}>✓</Text>
            </View>
          ) : null}
        </View>
        <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityLabel="More options">
          <Text style={[s.dots, { color: c.ink }]}>•••</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={s.headRow}>
          <View style={s.ring}>
            <View style={[s.ringInner, { backgroundColor: c.bg }]}>
              <Avatar name={p.firstName} color={p.color} size={76} />
            </View>
          </View>
          <View style={s.counts}>
            <Count n={String(tiles.length)} label="posts" c={c} />
            <Count n={String(p.sessionsHosted ?? theirs.filter((a) => a.hostId === p.id).length)} label="hosted" c={c} />
            <Count n={p.rating ? `★ ${p.rating}` : '–'} label="rating" c={c} />
          </View>
        </View>

        <View style={s.bio}>
          <Text style={[s.name, { color: c.ink }]}>{p.firstName}</Text>
          <Text style={[s.meta, { color: c.muted }]}>
            {p.isCaptain ? 'Run host' : 'Member'} · {km}
          </Text>
          <Text style={[s.bioText, { color: c.ink }]}>{p.experience}</Text>
          <Text style={[s.match, { color: olive }]}>{score}% match with you</Text>
        </View>

        <View style={s.btnRow}>
          <Pressable
            onPress={() => toggleFollow(p.id)}
            style={[s.btn, { backgroundColor: follows ? c.pill : '#556B2F' }]}
            accessibilityLabel={follows ? `Unfollow ${p.firstName}` : `Follow ${p.firstName}`}>
            <Text style={[s.btnText, { color: follows ? c.ink : '#FFFFFF' }]}>{follows ? 'Following' : 'Follow'}</Text>
          </Pressable>
          {canMessage ? (
            <Pressable onPress={() => router.push(`/chat/${p.id}` as Href)} style={[s.btn, { backgroundColor: c.pill }]}>
              <Text style={[s.btnText, { color: c.ink }]}>Message</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => Alert.alert('Message after a session', `Once you’re accepted into a run with ${p.firstName}, you can message each other.`)}
              style={[s.btn, { backgroundColor: c.pill, flex: 1.4 }]}>
              <Text style={[s.btnText, { color: c.muted, fontSize: 13 }]} numberOfLines={1} adjustsFontSizeToFit>
                Message after a session
              </Text>
            </Pressable>
          )}
          <Pressable onPress={() => router.push('/people')} style={[s.square, { backgroundColor: c.pill }]} accessibilityLabel="Similar people">
            <Text style={[s.squareText, { color: c.ink }]}>👤+</Text>
          </Pressable>
        </View>

        <View style={[s.tabs, { borderTopColor: c.line }]}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} style={[s.tab, tab === t.id && { borderBottomColor: c.ink }]} accessibilityLabel={t.label}>
              <Text style={[s.tabIcon, { color: tab === t.id ? c.ink : c.muted, opacity: tab === t.id ? 1 : 0.6 }]}>{t.icon}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'posts' ? (
          <View style={s.grid}>
            {tiles.map((t) => (
              <Pressable
                key={t.key}
                style={[s.tile, { backgroundColor: c.tile, width: tileW, height: Math.round(tileW * 1.25) }]}
                onPress={t.postId ? () => router.push(`/post/${t.postId}` as Href) : undefined}>
                {t.photo ? (
                  <Image source={t.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Text style={[s.tileText, { color: c.ink }]} numberOfLines={6}>{t.text}</Text>
                )}
                {t.km ? (
                  <View style={s.badge}>
                    <Text style={s.badgeText}>{t.km.toFixed(1)} km</Text>
                  </View>
                ) : null}
              </Pressable>
            ))}
          </View>
        ) : null}

        {tab === 'runs' ? (
          <View style={{ padding: 16 }}>
            {theirs.length ? (
              theirs.map((a) => <ActivityCard key={a.id} activity={a} />)
            ) : (
              <Text style={[s.empty, { color: c.muted }]}>No upcoming runs with {p.firstName} yet.</Text>
            )}
          </View>
        ) : null}

        {tab === 'tagged' ? <Text style={[s.empty, { color: c.muted, marginTop: 40 }]}>No tagged posts yet.</Text> : null}
      </ScrollView>

      <Modal visible={menu} transparent animationType="fade" onRequestClose={() => setMenu(false)}>
        <Pressable style={s.backdrop} onPress={() => setMenu(false)}>
          <View style={[s.menu, { top: insets.top + 48, backgroundColor: isDark ? '#1C1C1C' : '#FFFFFF', borderColor: c.line }]}>
            {menuItems.map(([label, fn, red], i) => (
              <Pressable
                key={label}
                style={[s.menuRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}
                onPress={() => {
                  setMenu(false);
                  setTimeout(fn, 250);
                }}>
                <Text style={[s.menuText, { color: red ? '#D9483B' : c.ink }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function Count({ n, label, c }: { n: string; label: string; c: { ink: string; muted: string } }) {
  return (
    <View style={s.count}>
      <Text style={[s.countN, { color: c.ink }]}>{n}</Text>
      <Text style={[s.countL, { color: c.ink }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 48 },
  chev: { fontSize: 34, lineHeight: 36, width: 30 },
  handleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  handle: { fontFamily: fonts.sansBold, fontSize: 17 },
  tick: { width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tickText: { color: '#fff', fontSize: 9, fontWeight: '900' },
  dots: { fontFamily: fonts.sansBold, fontSize: 14, letterSpacing: 1, width: 30, textAlign: 'right' },
  headRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, gap: 20 },
  ring: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#F4B595', alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  counts: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  count: { alignItems: 'center' },
  countN: { fontFamily: fonts.sansBold, fontSize: 17 },
  countL: { fontFamily: fonts.sans, fontSize: 13, marginTop: 1 },
  bio: { paddingHorizontal: 16, marginTop: 12, gap: 2 },
  name: { fontFamily: fonts.serif, fontSize: 16 },
  meta: { fontFamily: fonts.sans, fontSize: 13 },
  bioText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 19, marginTop: 4 },
  match: { fontFamily: fonts.sansSemi, fontSize: 13, marginTop: 4 },
  btnRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, marginTop: 14 },
  btn: { flex: 1, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  btnText: { fontFamily: fonts.sansSemi, fontSize: 14 },
  square: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  squareText: { fontSize: 12 },
  tabs: { flexDirection: 'row', marginTop: 18, borderTopWidth: StyleSheet.hairlineWidth },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: 'transparent' },
  tabIcon: { fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  tile: { overflow: 'hidden', justifyContent: 'center' },
  tileText: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, padding: 10 },
  badge: { position: 'absolute', left: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 6 },
  badgeText: { color: '#fff', fontFamily: fonts.sansSemi, fontSize: 11 },
  empty: { fontFamily: fonts.sans, fontSize: 14, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menu: { position: 'absolute', right: 16, width: 220, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  menuRow: { paddingVertical: 14, paddingHorizontal: 16 },
  menuText: { fontFamily: fonts.sansMedium, fontSize: 15 },
});
