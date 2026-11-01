import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SwipeDeck, type SwipeDeckHandle } from '@/components/swipe-deck';
import { Button, Screen } from '@/components/ui';
import type { Activity } from '@/data/types';
import { startsAt } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme';

const WINDOW_HOURS = 36;

export default function Now() {
  const { profile, activities, skipped, join, skip, clearSkipped } = useStore();
  const deck = useRef<SwipeDeckHandle | null>(null);
  const [joinedMsg, setJoinedMsg] = useState<Activity | null>(null);
  const [now] = useState(() => Date.now());
  if (!profile) return <Redirect href="/welcome" />;

  const soon = activities
    .filter((a) => {
      const t = startsAt(a).getTime();
      return (
        t > now &&
        t - now < WINDOW_HOURS * 3600000 &&
        a.hostId !== 'me' &&
        !a.participants.includes('me') &&
        a.participants.length < a.groupSize &&
        !skipped.includes(a.id)
      );
    })
    .sort((a, b) => startsAt(a).getTime() - startsAt(b).getTime());

  return (
    <Screen scroll={false}>
      <View style={styles.wrap}>
        <Text style={styles.kicker}>HAPPENING SOON NEAR {profile.neighborhood.toUpperCase()}</Text>
        <Text style={styles.title}>Last-minute crew</Text>
        <Text style={styles.sub}>Swipe right to join, left to skip.</Text>

        {joinedMsg && (
          <Pressable style={styles.toast} onPress={() => router.push(`/activity/${joinedMsg.id}`)}>
            <Text style={styles.toastText}>
              🎉 You’re in for {joinedMsg.title} at {joinedMsg.time}. Tap for details.
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
            <View style={styles.actions}>
              <Pressable style={[styles.round, styles.skipBtn]} onPress={() => deck.current?.swipe('left')}>
                <Text style={[styles.roundIcon, { color: colors.muted }]}>✕</Text>
              </Pressable>
              <Pressable style={[styles.round, styles.joinBtn]} onPress={() => deck.current?.swipe('right')}>
                <Text style={[styles.roundIcon, { color: '#fff' }]}>✓</Text>
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={{ fontSize: 56 }}>🌙</Text>
            <Text style={styles.emptyTitle}>You’re all caught up</Text>
            <Text style={styles.sub}>Nothing else is starting in the next day or so. Check back later, or start your own.</Text>
            <View style={{ gap: space.sm, alignSelf: 'stretch', marginTop: space.lg }}>
              <Button title="+ START SOMETHING NOW" variant="secondary" onPress={() => router.push('/create-activity')} />
              {skipped.length > 0 && <Button title="See skipped again" variant="ghost" onPress={clearSkipped} />}
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.lg },
  kicker: { fontSize: 12, fontWeight: '900', color: colors.accent, letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  sub: { fontSize: 15, color: colors.muted, marginTop: 2, textAlign: 'left' },
  toast: {
    backgroundColor: colors.greenSoft, borderRadius: radius.md, padding: space.md, marginTop: space.md,
  },
  toastText: { color: colors.green, fontWeight: '800', fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: space.xxl, marginTop: space.lg },
  round: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },
  skipBtn: { backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line },
  joinBtn: { backgroundColor: colors.accent },
  roundIcon: { fontSize: 30, fontWeight: '900' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: colors.ink, marginTop: space.md },
});
