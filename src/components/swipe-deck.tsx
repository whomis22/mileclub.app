import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';

import { activityInfo, distanceKm, type Neighborhood } from '@/data/options';
import { findPerson } from '@/data/people';
import type { Activity } from '@/data/types';
import { formatKm } from '@/lib/matching';
import { startsIn } from '@/lib/time';
import { colors, radius, space } from '@/theme';

import { Avatar } from './ui';

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
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) fly('right');
        else if (g.dx < -THRESHOLD) fly('left');
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      },
    });
    return { handlers: responder.panHandlers, fly };
  });

  useImperativeHandle(deckRef, () => ({ swipe: pan.fly }), [pan]);

  const rotate = pos.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-14deg', '0deg', '14deg'] });
  const inOpacity = pos.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const skipOpacity = pos.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const nextScale = pos.x.interpolate({
    inputRange: [-W, 0, W],
    outputRange: [1, 0.94, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.deck}>
      {items[1] && (
        <Animated.View style={[styles.cardWrap, { transform: [{ scale: nextScale }] }]}>
          <DeckCard a={items[1]} home={home} />
        </Animated.View>
      )}
      {top && (
        <Animated.View
          key={top.id}
          {...pan.handlers}
          style={[styles.cardWrap, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}>
          <DeckCard a={top} home={home} />
          <Animated.View style={[styles.stamp, styles.stampIn, { opacity: inOpacity }]}>
            <Text style={[styles.stampText, { color: colors.green }]}>I’M IN</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.stampSkip, { opacity: skipOpacity }]}>
            <Text style={[styles.stampText, { color: colors.muted }]}>SKIP</Text>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

function DeckCard({ a, home }: { a: Activity; home: Neighborhood }) {
  const info = activityInfo(a.type);
  const host = findPerson(a.hostId);
  const left = a.groupSize - a.participants.length;
  const going = a.participants.map(findPerson).filter((p) => !!p);
  return (
    <View style={styles.card}>
      <View style={styles.hero}>
        <View style={styles.heroGlowPink} />
        <View style={styles.heroGlowPeach} />
        <View style={styles.soonPill}>
          <Text style={styles.soonText}>⚡ {startsIn(a).toUpperCase()}</Text>
        </View>
        <Text style={styles.heroEmoji}>{info.emoji}</Text>
        <Text style={styles.heroTitle}>{a.title}</Text>
        <Text style={styles.heroTime}>
          {a.time} · {formatKm(distanceKm(home, a.neighborhood))}
        </Text>
      </View>
      <View style={styles.body}>
        <View style={styles.stats}>
          <Stat value={a.distance ?? '—'} label="Distance" />
          <Stat value={a.pace ?? a.level} label={a.pace ? 'Pace' : 'Level'} />
          <Stat value={`${left}`} label={left === 1 ? 'Spot left' : 'Spots left'} highlight={left <= 2} />
        </View>
        <Text style={styles.place} numberOfLines={1}>📍 {a.location}</Text>
        <Text style={styles.desc} numberOfLines={2}>{a.description}</Text>
        <View style={styles.goingRow}>
          <View style={{ flexDirection: 'row' }}>
            {going.slice(0, 5).map((p, i) => (
              <View key={p.id} style={{ marginLeft: i ? -10 : 0, borderWidth: 2, borderColor: '#fff', borderRadius: 20 }}>
                <Avatar name={p.firstName} color={p.color} size={32} />
              </View>
            ))}
          </View>
          <Text style={styles.goingText} numberOfLines={1}>
            {going.length} going{host ? ` · hosted by ${host.firstName}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[styles.statValue, highlight && { color: colors.accent }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { flex: 1, marginTop: space.md },
  cardWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  card: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.line,
    shadowColor: '#1B1035', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 4,
  },
  hero: { flex: 1, backgroundColor: colors.ink, padding: space.xl, justifyContent: 'flex-end', overflow: 'hidden' },
  heroGlowPink: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: colors.accent, opacity: 0.55,
    top: -90, right: -80,
  },
  heroGlowPeach: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: colors.peach, opacity: 0.45,
    top: 20, right: 60,
  },
  soonPill: {
    position: 'absolute', top: space.lg, left: space.lg, backgroundColor: '#fff', borderRadius: radius.pill,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  soonText: { color: colors.ink, fontWeight: '900', fontSize: 12, letterSpacing: 0.6 },
  heroEmoji: { fontSize: 56, marginBottom: space.sm },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  heroTime: { color: '#fff', opacity: 0.85, fontSize: 16, fontWeight: '700', marginTop: 4 },
  body: { padding: space.lg, gap: space.sm },
  stats: { flexDirection: 'row', paddingBottom: space.sm, borderBottomWidth: 1, borderBottomColor: colors.line },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.ink },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginTop: 2 },
  place: { fontSize: 15, fontWeight: '700', color: colors.ink, marginTop: 4 },
  desc: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 4 },
  goingText: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.muted },
  stamp: {
    position: 'absolute', top: 70, borderWidth: 4, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 14,
    backgroundColor: '#ffffffEE',
  },
  stampIn: { left: 24, borderColor: colors.green, transform: [{ rotate: '-12deg' }] },
  stampSkip: { right: 24, borderColor: colors.muted, transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 30, fontWeight: '900', letterSpacing: 2 },
});
