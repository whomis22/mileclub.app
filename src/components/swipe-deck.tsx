import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Animated, Dimensions, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';

import { activityInfo, distanceKm, type ActivityId, type Neighborhood } from '@/data/options';
import { findPerson } from '@/data/people';
import type { Activity } from '@/data/types';
import { Avatar } from '@/components/ui';
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

export function photoFor(a: Pick<Activity, "id" | "type">) {
  const list = PHOTOS[a.type] ?? PHOTOS.running!;
  const n = [...a.id].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return list[n % list.length];
}

// Ticket card (design 3, Yana 2026-11-15): photo on top, the time big and bold,
// what and where, then the "seats": a row of spots for groups, or "Name + you"
// when one person is asking someone to join them.
function DeckCard({ a, home, onJoin, onOpen }: { a: Activity; home: Neighborhood; onJoin?: () => void; onOpen?: () => void }) {
  const info = activityInfo(a.type);
  const d = startsAt(a);
  const left = Math.max(0, a.groupSize - a.participants.length);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const day =
    d.toDateString() === today.toDateString()
      ? d.getHours() >= 17 ? 'TONIGHT' : 'TODAY'
      : d.toDateString() === tomorrow.toDateString()
        ? 'TOMORROW'
        : d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();
  const host = findPerson(a.hostId);
  const seats = Math.min(a.groupSize, 12);
  return (
    // Tapping the card (not dragging it) opens the plan's details.
    <Pressable style={styles.card} onPress={onOpen} disabled={!onOpen} accessibilityLabel={`${a.title}, see details`}>
      <View style={styles.photo}>
        <Image source={{ uri: photoFor(a) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} />
        <View style={[styles.kind, a.solo && { backgroundColor: colors.peach }]}>
          <Text style={styles.kindText}>{a.solo ? `Wants ${left === 1 ? '1 person' : `${left} people`}` : 'Group plan'}</Text>
        </View>
        <View style={styles.type}>
          <Text style={styles.typeText}>{info.emoji} {info.label}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{a.time}</Text>
          <Text style={styles.day} numberOfLines={1}>{day}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{a.solo ? `“${a.title}”` : a.title}</Text>
        <Text style={styles.where} numberOfLines={1}>
          {a.location.split(/[,(]/)[0].trim()} · {a.neighborhood} · {formatKm(distanceKm(home, a.neighborhood))}
        </Text>
        <Text style={styles.where} numberOfLines={1}>{startsIn(a)}</Text>

        <View style={styles.perf}>
          <View style={[styles.notch, { left: -12 }]} />
          <View style={styles.dash} />
          <View style={[styles.notch, { right: -12 }]} />
        </View>

        <View style={styles.seatRow}>
          {a.solo && host ? (
            <View style={styles.pair}>
              <Avatar name={host.firstName} color={host.color} size={34} />
              <View style={styles.you}>
                <Text style={styles.youText}>?</Text>
              </View>
              <Text style={styles.pairText} numberOfLines={1}>{host.firstName} + you</Text>
            </View>
          ) : (
            <View style={styles.seats}>
              {Array.from({ length: seats }, (_, k) => (
                <View key={k} style={[styles.seat, k < seats - Math.min(left, seats) && styles.seatTaken]} />
              ))}
              <Text style={styles.leftText}>{left === 1 ? '1 left' : `${left} left`}</Text>
            </View>
          )}
          <Pressable style={styles.joinPill} onPress={onJoin} disabled={!onJoin}>
            <Text style={styles.joinText}>{a.solo ? 'I’m in' : 'Join'}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = themed(() => StyleSheet.create({
  deck: { flex: 1, marginTop: PEEK * 2 + 8 },
  cardWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    flex: 1, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line,
    shadowColor: '#2A2A1A', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  photo: { flex: 1, minHeight: 150, backgroundColor: colors.oliveSoft },
  kind: { position: 'absolute', top: 14, left: 14, backgroundColor: '#FFFFFF', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  kindText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#16190F' },
  type: { position: 'absolute', top: 14, right: 14, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  typeText: { fontFamily: fonts.sansSemi, fontSize: 12, color: '#FFFFFF' },
  body: { padding: 18, paddingBottom: 16, gap: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  time: { fontFamily: fonts.serif, fontSize: 38, color: colors.link, letterSpacing: -1.2 },
  day: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 1, color: colors.muted, flexShrink: 1 },
  title: { fontFamily: fonts.sansBold, fontSize: 19, lineHeight: 25, color: colors.ink, marginTop: 2 },
  where: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  perf: { height: 24, justifyContent: 'center', marginHorizontal: -18, marginTop: 6 },
  dash: { borderTopWidth: 2, borderStyle: 'dashed', borderColor: colors.line, marginHorizontal: 16 },
  notch: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bg, top: 0 },
  seatRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  seats: { flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  seat: { width: 14, height: 14, borderRadius: 4, borderWidth: 2, borderColor: colors.link },
  seatTaken: { backgroundColor: colors.link },
  leftText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink, marginLeft: 4 },
  pair: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  you: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.link, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  youText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.link },
  pairText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink, marginLeft: 8, flexShrink: 1 },
  joinPill: { backgroundColor: colors.olive, borderRadius: 999, paddingVertical: 11, paddingHorizontal: 20 },
  joinText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.onBrand },
  stamp: {
    position: 'absolute', top: 80, borderWidth: 3, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: '#F5F0E6EE',
  },
  stampIn: { left: 24, borderColor: deckColors.olive, transform: [{ rotate: '-12deg' }] },
  tint: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 30 },
  stampSkip: { right: 24, borderColor: '#A1402A', transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 26, fontWeight: '900', letterSpacing: 2 },
}));
