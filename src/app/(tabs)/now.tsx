import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router, useFocusEffect, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Animated, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { faceFor, nextWant, type Strength } from '@/data/faces';
import { ACTIVITIES, activityInfo, cityOf, distanceKm, type ActivityId } from '@/data/options';
import { PEOPLE } from '@/data/people';
import type { Person } from '@/data/types';
import { fitsMeet } from '@/lib/meet';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

// Explore (Yana, 2026-11-21): no more swipe cards. Each person fills the whole page
// with their name, age, neighbourhood, a short bio and 3 strengths in bubbles.
// Swipe up for the next person, swipe sideways to open their profile.
// Wave = "I'd like to train with you"; a wave matches when you share an activity.
const LIME = '#B9E769';

// Sample people live in one city; anyone far away is shown as a short walk away until real members join.
function kmTo(home: Parameters<typeof distanceKm>[0], p: Person) {
  const d = distanceKm(home, p.neighborhood);
  if (d < 50) return d;
  return 0.4 + ([...p.id].reduce((n, c) => n + c.charCodeAt(0), 0) % 42) / 10;
}

function Bubble({ s, light }: { s: Strength; light?: boolean }) {
  return (
    <View style={[styles.bubble, light && styles.bubbleLight]}>
      <Ionicons name={s.icon as keyof typeof Ionicons.glyphMap} size={14} color={light ? colors.ink : '#FFFFFF'} />
      <Text style={[styles.bubbleText, light && { color: colors.ink }]}>{s.label}</Text>
      <View style={styles.bars}>
        <View style={styles.barLine} />
        <View style={[styles.barLine, { width: 8 }]} />
      </View>
    </View>
  );
}

function RailButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [styles.rail, pressed && { transform: [{ scale: 0.9 }] }]}>
      {children}
    </Pressable>
  );
}

function PersonPage({
  p, w, h, km, following, onFollow, onWave, onPass,
}: {
  p: Person; w: number; h: number; km: number; following: boolean;
  onFollow: () => void; onWave: () => void; onPass: () => void;
}) {
  useTheme();
  const [page, setPage] = useState(0);
  const scroller = useRef<ComponentRef<typeof ScrollView>>(null);
  const face = faceFor(p.id);
  const want = nextWant(p.id);
  const strengths = face?.strengths ?? p.activities.slice(0, 3).map((a) => ({ icon: 'fitness', label: activityInfo(a).label }));
  const where = `${p.age} y/o · ${p.neighborhood} · ${km.toFixed(1)} km`;

  const followBtn = (onDark: boolean) => (
    <Pressable onPress={onFollow} style={[styles.follow, following ? styles.followOn : onDark ? styles.followDark : styles.followLight]} accessibilityLabel={following ? `Unfollow ${p.firstName}` : `Follow ${p.firstName}`}>
      <Text style={[styles.followText, following ? { color: '#000' } : { color: onDark ? '#FFFFFF' : colors.ink }]}>{following ? 'Following' : 'Follow'}</Text>
    </Pressable>
  );

  return (
    <View style={{ width: w, height: h }}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / w))}>
        {/* Page 1: the full photo */}
        <View style={{ width: w, height: h }}>
          {face ? <Image source={{ uri: face.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: p.color }]} />}
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.88)']} locations={[0, 0.2, 0.45, 0.85]} style={StyleSheet.absoluteFill} />

          <View style={styles.railWrap}>
            <RailButton label={`Wave at ${p.firstName}`} onPress={onWave}>
              <Text style={{ fontSize: 26 }}>👋</Text>
            </RailButton>
            <RailButton label={`Message ${p.firstName}`} onPress={() => router.push(`/chat/${p.id}` as Href)}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#FFFFFF" />
            </RailButton>
            <RailButton label={`Pass on ${p.firstName}`} onPress={onPass}>
              <Feather name="x" size={28} color="#FF5A5F" />
            </RailButton>
          </View>

          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>{p.firstName.toUpperCase()}</Text>
              {followBtn(true)}
            </View>
            <Text style={styles.where}>{where}</Text>
            <Text style={styles.bio} numberOfLines={2}>{face?.bio ?? p.experience}</Text>
            <View style={styles.bubbles}>
              {strengths.slice(0, 3).map((s) => <Bubble key={s.label} s={s} />)}
            </View>
            <Pressable onPress={() => scroller.current?.scrollTo({ x: w, animated: true })} style={styles.more} hitSlop={8}>
              <Text style={styles.moreText}>Swipe for profile</Text>
              <Feather name="chevron-right" size={14} color="rgba(255,255,255,0.75)" />
            </Pressable>
          </View>
        </View>

        {/* Page 2: their profile */}
        <ScrollView style={{ width: w, height: h, backgroundColor: colors.bg }} contentContainerStyle={styles.profile} showsVerticalScrollIndicator={false}>
          <View style={styles.pHead}>
            {face ? <Image source={{ uri: face.photo }} style={styles.pPhoto} contentFit="cover" /> : <Avatar name={p.firstName} color={p.color} size={88} />}
            <Text style={styles.pName}>{p.firstName}, {p.age}</Text>
            <Text style={styles.pSub}>{face?.work ?? p.experience}</Text>
            <Text style={styles.pSub}>{p.neighborhood}{cityOf(p.neighborhood) ? `, ${cityOf(p.neighborhood)}` : ''} · {km.toFixed(1)} km away</Text>
            <View style={styles.pButtons}>
              {followBtn(false)}
              <Pressable style={styles.msg} onPress={() => router.push(`/chat/${p.id}` as Href)}>
                <Text style={styles.msgText}>Message</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.label}>About</Text>
          <Text style={styles.body}>{face?.bio ?? p.experience}</Text>

          <Text style={styles.label}>Strengths</Text>
          <View style={styles.bubbles}>
            {strengths.slice(0, 3).map((s) => <Bubble key={s.label} s={s} light />)}
          </View>

          {want ? (
            <>
              <Text style={styles.label}>Looking for someone to join</Text>
              <View style={styles.wantCard}>
                <Text style={{ fontSize: 26 }}>{activityInfo(want.type).emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wantTitle}>{want.what}</Text>
                  <Text style={styles.pSub}>{want.label}</Text>
                </View>
                <Pressable style={styles.join} onPress={onWave}>
                  <Text style={styles.joinText}>Ask to join</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          <Text style={styles.label}>Activities</Text>
          <View style={styles.bubbles}>
            {p.activities.map((a) => (
              <View key={a} style={[styles.bubble, styles.bubbleLight]}>
                <Text style={[styles.bubbleText, { color: colors.ink }]}>{activityInfo(a).emoji} {activityInfo(a).label}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.label}>Level</Text>
          <Text style={styles.body}>{p.level}{p.pace ? ` · ${p.pace}` : ''}</Text>
          <Text style={styles.label}>Usually free</Text>
          <Text style={styles.body}>{p.availability.join(', ')}</Text>

          <Pressable style={styles.full} onPress={() => router.push(`/person/${p.id}`)}>
            <Text style={styles.fullText}>Open full profile</Text>
            <Feather name="chevron-right" size={16} color={colors.ink} />
          </Pressable>
        </ScrollView>
      </ScrollView>

      {/* page dashes, like the photo pager in the picture */}
      <View style={styles.dashes} pointerEvents="none">
        {[0, 1].map((i) => <View key={i} style={[styles.dash, page === i && styles.dashOn, page === 1 && { backgroundColor: i === 1 ? colors.ink : colors.edge }]} />)}
      </View>
    </View>
  );
}

export default function Explore() {
  useTheme();
  const [focused, setFocused] = useState(false);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const [now] = useState(() => Date.now());
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, following, toggleFollow, blocked } = useStore();
  const [h, setH] = useState(0);
  const [what, setWhat] = useState<ActivityId | 'any'>('any');
  const [picking, setPicking] = useState(false);
  const [hidden, setHidden] = useState<string[]>([]);
  const [match, setMatch] = useState<Person | null>(null);
  const [toast, setToast] = useState('');
  const [fade] = useState(() => new Animated.Value(0));
  if (!profile) return <Redirect href="/welcome" />;

  const items = PEOPLE.filter((p) => fitsMeet(profile, p) && !blocked.includes(p.id) && !hidden.includes(p.id))
    .filter((p) => what === 'any' || p.activities.includes(what))
    .sort((a, b) => (nextWant(a.id, now)?.when.getTime() ?? Infinity) - (nextWant(b.id, now)?.when.getTime() ?? Infinity));

  function say(text: string) {
    setToast(text);
    fade.setValue(0);
    Animated.sequence([
      Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  function wave(p: Person) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (!following.includes(p.id)) toggleFollow(p.id);
    if (p.activities.some((a) => profile!.activities.includes(a))) setMatch(p);
    else say(`👋 You waved at ${p.firstName}`);
  }

  function follow(p: Person) {
    Haptics.selectionAsync().catch(() => {});
    toggleFollow(p.id);
  }

  const theirFace = match ? faceFor(match.id)?.photo : undefined;

  return (
    <View style={styles.screen} onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}>
      {focused ? <StatusBar style="light" /> : null}
      {h > 0 && items.length ? (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={h}
          snapToAlignment="start"
          getItemLayout={(_, i) => ({ length: h, offset: h * i, index: i })}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          renderItem={({ item }) => (
            <PersonPage
              p={item}
              w={width}
              h={h}
              km={kmTo(profile.neighborhood, item)}
              following={following.includes(item.id)}
              onFollow={() => follow(item)}
              onWave={() => wave(item)}
              onPass={() => {
                Haptics.selectionAsync().catch(() => {});
                setHidden((x) => [...x, item.id]);
              }}
            />
          )}
        />
      ) : h > 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.bg }]}>
          <Feather name="users" size={34} color={colors.muted} />
          <Text style={styles.emptyTitle}>You’ve seen everyone for now</Text>
          <Text style={styles.emptySub}>Try another activity, or start a plan and let people come to you.</Text>
          <Pressable style={styles.lime} onPress={() => { setHidden([]); setWhat('any'); }}>
            <Text style={styles.limeText}>See everyone again</Text>
          </Pressable>
        </View>
      ) : null}

      {/* top bar over the photos */}
      <View style={[styles.top, { top: insets.top + 6 }]} pointerEvents="box-none">
        <Pressable style={styles.topPill} onPress={() => setPicking(true)}>
          <Text style={styles.topPillText}>{what === 'any' ? 'Everyone' : activityInfo(what).label}</Text>
          <Feather name="chevron-down" size={14} color="#FFFFFF" />
        </Pressable>
        <Pressable style={styles.topRound} onPress={() => setPicking(true)} accessibilityLabel="Filters">
          <Ionicons name="options-outline" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <Animated.View pointerEvents="none" style={[styles.toast, { top: insets.top + 56, opacity: fade }]}>
        <Text style={styles.toastText}>{toast}</Text>
      </Animated.View>

      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPicking(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Who do you want to meet?</Text>
            <View style={styles.options}>
              {[{ id: 'any', label: 'Everyone' }, ...ACTIVITIES.map((a) => ({ id: a.id, label: `${a.emoji} ${a.label}` }))].map((o) => (
                <Pressable
                  key={o.id}
                  style={[styles.option, what === o.id && styles.optionOn]}
                  onPress={() => {
                    setWhat(o.id as ActivityId | 'any');
                    setPicking(false);
                  }}>
                  <Text style={[styles.optionText, what === o.id && { color: '#000' }]}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={!!match} animationType="fade" onRequestClose={() => setMatch(null)}>
        <SafeAreaView style={styles.match}>
          <View style={styles.matchMid}>
            <View style={styles.glow} />
            <View style={styles.pair}>
              <View style={styles.face}>
                {profile.photoUri ? <Image source={{ uri: profile.photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Avatar name={profile.firstName} size={124} />}
              </View>
              <View style={[styles.face, { marginLeft: -22 }]}>
                {theirFace ? <Image source={{ uri: theirFace }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}
              </View>
              <View style={styles.heart}>
                <Ionicons name="heart-outline" size={54} color={colors.cta} />
              </View>
            </View>
            <Text style={styles.matchTitle}>It’s a match!</Text>
            <Text style={styles.matchSub}>Start a chat and plan{'\n'}your next workout together.</Text>
          </View>
          <View style={styles.matchBottom}>
            <Pressable
              style={styles.lime}
              onPress={() => {
                const id = match?.id;
                setMatch(null);
                if (id) router.push(`/chat/${id}` as Href);
              }}>
              <Text style={styles.limeText}>Send a message</Text>
            </Pressable>
            <Pressable onPress={() => setMatch(null)} hitSlop={10}>
              <Text style={styles.keep}>Keep exploring</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#000' },
    top: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 16, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)' },
    topPillText: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#FFFFFF' },
    topRound: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center' },
    dashes: { position: 'absolute', top: 64, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 },
    dash: { width: 16, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)' },
    dashOn: { width: 26, backgroundColor: '#FFFFFF' },
    railWrap: { position: 'absolute', right: 16, top: '38%', gap: 14, alignItems: 'center' },
    rail: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(20,20,20,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
    info: { position: 'absolute', left: 20, right: 20, bottom: 22 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    name: { flexShrink: 1, fontFamily: fonts.logo, fontSize: 40, lineHeight: 44, color: LIME, letterSpacing: 0.5 },
    where: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFFFFF', marginTop: 2 },
    bio: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.88)', marginTop: 8 },
    bubbles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
    bubble: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 34, paddingHorizontal: 11, borderRadius: 18, backgroundColor: 'rgba(40,40,40,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
    bubbleLight: { backgroundColor: colors.card, borderColor: colors.line },
    bubbleText: { fontFamily: fonts.sansSemi, fontSize: 12.5, color: '#FFFFFF' },
    bars: { gap: 2, marginLeft: 2 },
    barLine: { width: 10, height: 2, borderRadius: 1, backgroundColor: LIME },
    more: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-end', marginTop: 14 },
    moreText: { fontFamily: fonts.sansSemi, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
    follow: { height: 32, paddingHorizontal: 14, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
    followDark: { borderColor: 'rgba(255,255,255,0.7)', backgroundColor: 'rgba(0,0,0,0.25)' },
    followLight: { borderColor: colors.ink },
    followOn: { backgroundColor: LIME, borderColor: LIME },
    followText: { fontFamily: fonts.sansBold, fontSize: 13 },
    profile: { paddingHorizontal: 20, paddingTop: 96, paddingBottom: 40 },
    pHead: { alignItems: 'center' },
    pPhoto: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: LIME },
    pName: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.ink, marginTop: 12 },
    pSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 3, textAlign: 'center' },
    pButtons: { flexDirection: 'row', gap: 10, marginTop: 16 },
    msg: { height: 32, paddingHorizontal: 18, borderRadius: 16, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center' },
    msgText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.onMine },
    label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: 26 },
    body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 6 },
    wantCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginTop: 10 },
    wantTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
    join: { backgroundColor: LIME, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
    joinText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#000' },
    full: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48, borderRadius: 24, backgroundColor: colors.card, marginTop: 28 },
    fullText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
    toast: { position: 'absolute', alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 9 },
    toastText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#FFFFFF' },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 30 },
    emptyTitle: { fontFamily: fonts.serif, fontSize: 21, color: colors.ink, textAlign: 'center' },
    emptySub: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
    lime: { alignSelf: 'stretch', height: 54, borderRadius: 27, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
    limeText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#000' },
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 40 },
    sheetTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, marginBottom: 14 },
    options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    option: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.card },
    optionOn: { backgroundColor: LIME },
    optionText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
    match: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
    matchMid: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 14 },
    pair: { flexDirection: 'row', marginTop: 30 },
    heart: { position: 'absolute', top: -44, left: 0, right: 0, alignItems: 'center' },
    glow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.cta, opacity: 0.08, top: '22%' },
    face: { width: 128, height: 128, borderRadius: 64, overflow: 'hidden', borderWidth: 4, borderColor: colors.cta, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    matchTitle: { fontFamily: fonts.serif, fontSize: 32, color: colors.ink, marginTop: 8 },
    matchSub: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.muted, textAlign: 'center' },
    matchBottom: { paddingHorizontal: 24, paddingBottom: 20, gap: 16, alignItems: 'center' },
    keep: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  }),
);
