import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeDeck, deckColors, type SwipeDeckHandle } from '@/components/swipe-deck';
import { Avatar, MenuButton } from '@/components/ui';
import type { Activity } from '@/data/types';
import { startsAt } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

const WINDOW_HOURS = 36;
const SERIF = fonts.serif;

export default function Now() {
  useTheme();
  const { profile, activities, skipped, runRequests, join, skip, clearSkipped } = useStore();
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
        !skipped.includes(a.id) &&
        !runRequests[a.id]
      );
    })
    .sort((a, b) => startsAt(a).getTime() - startsAt(b).getTime());

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.wrap}>
        <View style={styles.header}>
          <MenuButton onPress={() => router.push('/menu')} />
          <Avatar name={profile.firstName} uri={profile.photoUri} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>Welcome back</Text>
            <Text style={styles.name}>{profile.firstName}</Text>
          </View>
          <Pressable style={styles.bell} onPress={() => router.push('/messages')} accessibilityLabel="Messages">
            <View style={styles.bubble} />
            <View style={styles.badge} />
          </Pressable>
        </View>
        <Text style={styles.title}>Your week at{'\n'}Mile Club</Text>

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

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: deckColors.cream },
  wrap: { flex: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hello: { fontSize: 11, color: colors.muted, fontFamily: fonts.sans },
  name: { fontSize: 18, color: colors.ink, fontFamily: SERIF },
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, gap: 10 },
  emptyTitle: { fontFamily: SERIF, fontSize: 26, color: colors.ink },
  emptySub: { fontSize: 14, color: colors.muted, fontFamily: fonts.sans, textAlign: 'center', lineHeight: 20 },
  primary: { backgroundColor: deckColors.olive, borderRadius: 999, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center', marginTop: 10 },
  primaryText: { color: colors.onBrand, fontFamily: fonts.sansSemi, fontSize: 15 },
  secondary: { borderRadius: 999, paddingVertical: 12, alignSelf: 'stretch', alignItems: 'center', borderWidth: 1.5, borderColor: deckColors.olive },
  secondaryText: { color: deckColors.olive, fontFamily: fonts.sansSemi, fontSize: 15 },
}));
