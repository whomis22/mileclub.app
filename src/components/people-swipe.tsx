import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, View } from 'react-native';

import { faceFor } from '@/data/faces';
import { activityInfo } from '@/data/options';
import type { Person } from '@/data/types';
import { colors, fonts, themed, useTheme } from '@/theme';

// Explore swipe from the design board (2026-11-21): one big photo card of a person,
// what they're into, how far and when they're free. Drag right to like, left to pass.
const W = Dimensions.get('window').width;
const THRESHOLD = W * 0.28;

export type SwipePerson = { p: Person; km: number; free: string };
export type PeopleSwipeHandle = { swipe: (dir: 'left' | 'right') => void };

export function PeopleSwipe({ items, onLike, onPass, swipeRef }: { items: SwipePerson[]; onLike: (x: SwipePerson) => void; onPass: (x: SwipePerson) => void; swipeRef?: Ref<PeopleSwipeHandle> }) {
  useTheme();
  const [pos] = useState(() => new Animated.ValueXY());
  const top = items[0];
  const latest = useRef({ top, onLike, onPass });
  useEffect(() => {
    latest.current = { top, onLike, onPass };
  });
  // The pan handler reads the latest props through a ref, only inside gesture callbacks.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() => {
    const fly = (dir: 'left' | 'right') => {
      const cur = latest.current.top;
      if (!cur) return;
      Animated.timing(pos, { toValue: { x: dir === 'right' ? W * 1.4 : -W * 1.4, y: 30 }, duration: 220, useNativeDriver: false }).start(() => {
        pos.setValue({ x: 0, y: 0 });
        if (dir === 'right') latest.current.onLike(cur);
        else latest.current.onPass(cur);
      });
    };
    const r = PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6,
      onPanResponderMove: Animated.event([null, { dx: pos.x, dy: pos.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        if (g.dx > THRESHOLD) fly('right');
        else if (g.dx < -THRESHOLD) fly('left');
        else Animated.spring(pos, { toValue: { x: 0, y: 0 }, friction: 5, useNativeDriver: false }).start();
      },
    });
    return { handlers: r.panHandlers, fly };
  });
  useImperativeHandle(swipeRef, () => ({ swipe: pan.fly }), [pan]);

  const rotate = pos.x.interpolate({ inputRange: [-W, 0, W], outputRange: ['-9deg', '0deg', '9deg'] });
  const likeO = pos.x.interpolate({ inputRange: [0, THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const nopeO = pos.x.interpolate({ inputRange: [-THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });
  const next = items[1];

  return (
    <View style={styles.wrap}>
      {next ? (
        <View style={[styles.card, styles.behind]}>
          <Card x={next} />
        </View>
      ) : null}
      {top ? (
        <Animated.View {...pan.handlers} style={[styles.card, { transform: [{ translateX: pos.x }, { translateY: pos.y }, { rotate }] }]}>
          <Card x={top} />
          <Animated.View style={[styles.stamp, styles.like, { opacity: likeO }]}>
            <Text style={[styles.stampText, { color: '#B9E769' }]}>LIKE</Text>
          </Animated.View>
          <Animated.View style={[styles.stamp, styles.nope, { opacity: nopeO }]}>
            <Text style={[styles.stampText, { color: '#FF5A5F' }]}>PASS</Text>
          </Animated.View>
        </Animated.View>
      ) : null}
    </View>
  );
}

function Card({ x }: { x: SwipePerson }) {
  useTheme();
  const f = faceFor(x.p.id);
  return (
    <>
      {f ? <Image source={{ uri: f.photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: x.p.color }]} />}
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} locations={[0.5, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {x.p.firstName}, {x.p.age}
          </Text>
          <Ionicons name="checkmark-circle" size={20} color="#4C8DFF" />
        </View>
        <Text style={styles.line}>{x.p.activities.map((a) => activityInfo(a).label).slice(0, 3).join(', ')}</Text>
        <Text style={styles.line}>
          {x.km.toFixed(1)} km away · {x.free}
        </Text>
        {f?.wants ? (
          <View style={styles.wants}>
            <Feather name="zap" size={12} color="#000" />
            <Text style={styles.wantsText} numberOfLines={1}>
              {f.wants.what}
            </Text>
          </View>
        ) : null}
      </View>
    </>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { flex: 1, marginTop: 12 },
    card: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.card },
    behind: { transform: [{ scale: 0.95 }, { translateY: 14 }], opacity: 0.6 },
    info: { position: 'absolute', left: 20, right: 20, bottom: 20, gap: 3 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontFamily: fonts.serif, fontSize: 28, color: '#FFFFFF' },
    line: { fontFamily: fonts.sansMedium, fontSize: 14, color: 'rgba(255,255,255,0.88)' },
    wants: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#B9E769', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11, marginTop: 8 },
    wantsText: { fontFamily: fonts.sansBold, fontSize: 12, color: '#000' },
    stamp: { position: 'absolute', top: 30, borderWidth: 3, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 4 },
    like: { left: 24, borderColor: '#B9E769', transform: [{ rotate: '-12deg' }] },
    nope: { right: 24, borderColor: '#FF5A5F', transform: [{ rotate: '12deg' }] },
    stampText: { fontFamily: fonts.sansBold, fontSize: 26, letterSpacing: 2 },
  }),
);
