import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { activityInfo, distanceKm, type ActivityId, type Neighborhood } from '@/data/options';
import type { Activity } from '@/data/types';
import { formatKm } from '@/lib/matching';
import { startsAt, startsIn } from '@/lib/time';
import { colors, fonts, themed } from '@/theme';


const W = Dimensions.get('window').width;
const THRESHOLD = W * 0.28;

export type SwipeDeckHandle = { swipe: (dir: 'left' | 'right') => void };

export function SwipeDeck({
  items,
  home,
  onJoin,
  onSkip,
  deckRef,
}: {
  items: Activity[];
  home: Neighborhood;
  onJoin: (a: Activity) => void;
  onSkip: (a: Activity) => void;
  deckRef?: Ref<SwipeDeckHandle>;
}) {
  const [pos] = useState(() => new Animated.ValueXY());
  const top = items[0];
  const latest = useRef({ top, onJoin, onSkip });
  const lastDrag = useRef(0); // when a drag last ended, so it isn't also read as a tap
  useEffect(() => {
    latest.current = { top, onJoin, onSkip };
  });

  // The pan handler reads the latest props through a ref, only inside gesture callbacks.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => {
    const fly = (dir: 'left' | 'right') => {
      const current = latest.current.top;
      if (!current) return;
      Animated.timing(pos, {
        toValue: { x: dir === 'right' ? W * 1.4 : -W * 1.4, y: 40 },
        duration: 220,
        useNativeDriver: false,
      }).start(() => {
        pos.setValue({ x: 0, y: 0 });
        if (dir === 'right') latest.current.onJoin(current);
        else latest.current.onSkip(current);
      });
    };
    const responder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      // Take over from the tap-to-open card as soon as the finger moves sideways.
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        lastDrag.current = Date.now();
        if (g.dx > THRESHOLD) fly('right');
        else if (g.dx < -THRESHOLD) fly('left');
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      },
    });
    return { handlers: responder.panHandlers, fly };
  });

  useImperativeHandle(deckRef, () => ({ swipe: pan.fly }), [pan]);

  const rotate = pos.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-10deg', '0deg', '10deg'] });
  const inOpacity = pos.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = pos.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  // How far the top card has moved away (0..1); the cards behind slide forward as it goes.
  const progress = pos.x.interpolate({ inputRange: [-W, 0, W], outputRange: [1, 0, 1], extrapolate: 'clamp' });

  const behind = items.slice(1, 3);

  return (
    <View style={styles.deck}>
      {behind
        .map((a, i) => {
          const depth = i + 1; // 1 = right behind the top card
          const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [1 - depth * 0.06, 1 - (depth - 1) * 0.06] });
          const translateY = progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-depth * PEEK, -(depth - 1) * PEEK],
          });
          return (
            <Animated.View
              key={a.id}
              pointerEvents="none"
              style={[styles.cardWrap, { transform: [{ translateY }, { scale }] }]}>
              <DeckCard a={a} home={home} />
            </Animated.View>
          );
        })
        .reverse()}
      {top && (
        <Animated.View
          key={top.id}
          {...pan.handlers}
          style={[styles.cardWrap, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}>
          <DeckCard
            a={top}
            home={home}
            onJoin={() => pan.fly('right')}
            onOpen={() => {
              if (Date.now() - lastDrag.current > 400) router.push(`/activity/${top.id}`);
            }}
          />
          {/* While dragging, the card tints olive (join) or dark (skip) and shows a big label. */}
          <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: deckColors.olive, opacity: Animated.multiply(inOpacity, 0.45) }]} />
          <Animated.View pointerEvents="none" style={[styles.tint, { backgroundColor: '#000', opacity: Animated.multiply(skipOpacity, 0.45) }]} />
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampIn, { opacity: inOpacity }]}>
            <Text style={[styles.stampText, { color: deckColors.olive }]}>JOIN ✓</Text>
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampSkip, { opacity: skipOpacity }]}>
            <Text style={[styles.stampText, { color: '#A1402A' }]}>✕ SKIP</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const PEEK = 22;
const SERIF = fonts.serif;

// Rich Olive / Warm Cream / Soft Peach
export const deckColors = {
  get olive() {
    return colors.olive;
  },
  get cream() {
    return colors.bg;
  },
  get peach() {
    return colors.peachDeep;
  },
};

// Remote photos per sport. If one doesn't load, the olive card underneath still looks finished.
const PHOTOS: Partial<Record<ActivityId, string[]>> = {
  running: [
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=900&q=70',
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=900&q=70',
    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=900&q=70',
    'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=900&q=70',
  ],
  yoga: ['https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=900&q=70'],
  pilates: ['https://images.unsplash.com/photo-1518611012118-696072aa579a?w=900&q=70'],
  cycling: ['https://images.unsplash.com/photo-1517649763962-0c623066013b?w=900&q=70'],
  basketball: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&q=70'],
  strength: ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=70'],
};

function photoFor(a: Activity) {
  const list = PHOTOS[a.type] ?? PHOTOS.running!;
  const n = [...a.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return list[n % list.length];
}

const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

function DeckCard({ a, home, onJoin, onOpen }: { a: Activity; home: Neighborhood; onJoin?: () => void; onOpen?: () => void }) {
  const info = activityInfo(a.type);
  const d = startsAt(a);
  const place = a.location.split(/[,(]/)[0].trim();
  const left = a.groupSize - a.participants.length;
  const today = new Date();
  const day =
    d.toDateString() === today.toDateString()
      ? 'TONIGHT'
      : DAYS[d.getDay()];
  return (
    // Tapping the card (not dragging it) opens the run's details.
    <Pressable style={styles.card} onPress={onOpen} disabled={!onOpen} accessibilityLabel={`${a.title}, see details`}>
      <Image source={{ uri: photoFor(a) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
      {/* soft shade so the white text always reads */}
      <View style={[styles.shade, { top: 0, height: 90, opacity: 0.35 }]} />
      <View style={[styles.shade, { bottom: 0, height: '62%', opacity: 0.25 }]} />
      <View style={[styles.shade, { bottom: 0, height: '42%', opacity: 0.35 }]} />

      <View style={styles.topLabel}>
        <Text style={styles.kicker}>{info.label.toUpperCase()}</Text>
        <Text style={styles.club}>MILE CLUB</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.placeRow}>
          <Text style={styles.place} numberOfLines={1}>{place}</Text>
          {a.womenOnly ? (
            <View style={styles.tag}>
              <Text style={styles.tagText}>♀ Women only</Text>
            </View>
          ) : null}
          <View style={styles.tag}>
            <Text style={styles.tagText}>{a.neighborhood}</Text>
          </View>
        </View>
        <View style={styles.rule} />
        <View style={styles.whenRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.small} numberOfLines={1}>{a.title.toUpperCase()}</Text>
            <Text style={styles.small} numberOfLines={1}>
              {[a.distance, a.pace].filter(Boolean).join(' · ').toUpperCase() || a.level.toUpperCase()}
            </Text>
            <Text style={styles.small}>{MONTHS[d.getMonth()]} {d.getDate()} · {formatKm(distanceKm(home, a.neighborhood)).toUpperCase()}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.day}>{day}</Text>
            <Text style={styles.small}>{a.time} · {startsIn(a).replace('Starts ', '').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.joinRow}>
          <Pressable style={styles.joinPill} onPress={onJoin} disabled={!onJoin}>
            <Text style={styles.joinText}>Join {info.id === 'running' ? 'run' : 'session'}</Text>
          </Pressable>
          <Pressable style={styles.joinArrow} onPress={onOpen} disabled={!onOpen} accessibilityLabel="See details">
            <Text style={styles.arrowText}>↗</Text>
          </Pressable>
          <Text style={styles.spots}>{left} {left === 1 ? 'spot' : 'spots'} left</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  deck: { flex: 1, marginTop: PEEK * 2 + 8 },
  cardWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    flex: 1, borderRadius: 30, overflow: 'hidden', backgroundColor: deckColors.olive,
    shadowColor: '#2A2A1A', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  shade: { position: 'absolute', left: 0, right: 0, backgroundColor: '#14180A' },
  topLabel: { alignItems: 'center', paddingTop: 12 },
  kicker: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 3 },
  club: { color: '#fff', fontFamily: SERIF, fontSize: 20, letterSpacing: 2, marginTop: 4 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  place: { color: '#fff', fontFamily: fonts.serifItalic, fontSize: 27, flexShrink: 1 },
  tag: { borderWidth: 1, borderColor: '#ffffffcc', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  tagText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  rule: { height: 1, backgroundColor: '#ffffff66', marginVertical: 10 },
  whenRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  small: { color: '#fff', fontSize: 10, fontWeight: '600', letterSpacing: 1, marginTop: 2, opacity: 0.92 },
  day: { color: '#fff', fontSize: 30, letterSpacing: 0.5, fontFamily: SERIF },
  joinRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  joinPill: { backgroundColor: '#fff', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 20 },
  joinText: { color: deckColors.olive, fontWeight: '700', fontSize: 14 },
  joinArrow: { backgroundColor: '#fff', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  arrowText: { color: deckColors.olive, fontSize: 18, fontWeight: '800' },
  spots: { color: deckColors.peach, fontWeight: '700', fontSize: 12, marginLeft: 'auto' },
  stamp: {
    position: 'absolute', top: 80, borderWidth: 3, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: '#F5F0E6EE',
  },
  stampIn: { left: 24, borderColor: deckColors.olive, transform: [{ rotate: '-12deg' }] },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 30 },
  stampSkip: { right: 24, borderColor: '#A1402A', transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 26, fontWeight: '900', letterSpacing: 2 },
}));
