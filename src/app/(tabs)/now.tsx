import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeDeck, deckColors, type SwipeDeckHandle } from '@/components/swipe-deck';
import { Avatar } from '@/components/ui';
import type { Activity } from '@/data/types';
import { startsAt } from '@/lib/time';
import { useStore } from '@/state/store';

const WINDOW_HOURS = 36;
const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });
const ink = '#2B2E1F';

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
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <Avatar name={profile.firstName} uri={profile.photoUri} color={deckColors.olive} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Welcome back</Text>
            <Text style={styles.name}>{profile.firstName}</Text>
          </View>
          <Pressable style={styles.bell} onPress={() => router.push('/activities')}>
            <Text style={{ color: '#fff', fontSize: 15 }}>🔔</Text>
          </Pressable>
        </View>
        <Text style={styles.title}>Your week at{'\n'}Mile Club</Text>

        {joinedMsg && (
          <Pressable style={styles.toast} onPress={() => router.push(`/activity/${joinedMsg.id}`)}>
            <Text style={styles.toastText}>
              You’re in for {joinedMsg.title} at {joinedMsg.time}. Tap for details.
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
            <Text style={styles.hint}>Swipe right to join · left to explore more</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>You’re all caught up</Text>
            <Text style={styles.emptySub}>Nothing else starts in the next day or so. Check back later, or start your own.</Text>
            <Pressable style={styles.primary} onPress={() => router.push('/create-activity')}>
              <Text style={styles.primaryText}>Start something now</Text>
            </Pressable>
            {skipped.length > 0 && (
              <Pressable style={styles.secondary} onPress={clearSkipped}>
                <Text style={styles.secondaryText}>See skipped again</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: deckColors.cream },
  wrap: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hello: { fontSize: 11, color: '#7A7766' },
  name: { fontSize: 15, color: ink, fontFamily: SERIF },
  bell: { width: 38, height: 38, borderRadius: 19, backgroundColor: ink, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: SERIF, fontSize: 32, lineHeight: 38, color: ink, marginTop: 16 },
  toast: { backgroundColor: deckColors.peach, borderRadius: 16, padding: 12, marginTop: 12 },
  toastText: { color: ink, fontWeight: '700', fontSize: 13 },
  hint: { textAlign: 'center', color: '#8A8577', fontSize: 12, marginTop: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 10 },
  emptyTitle: { fontFamily: SERIF, fontSize: 26, color: ink },
  emptySub: { fontSize: 14, color: '#7A7766', textAlign: 'center', lineHeight: 20 },
  primary: { backgroundColor: deckColors.olive, borderRadius: 999, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', marginTop: 10 },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  secondary: { borderRadius: 999, paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center', borderWidth: 1.5, borderColor: deckColors.olive },
  secondaryText: { color: deckColors.olive, fontWeight: '800', fontSize: 15 },
});
