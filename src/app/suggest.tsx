import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityCard } from '@/components/activity-card';
import { Avatar, Body, Label, Screen } from '@/components/ui';
import { activityInfo } from '@/data/options';
import { PEOPLE } from '@/data/people';
import { fitsMeet } from '@/lib/meet';
import { startsAt } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// After a "no" (or no answer yet): other runs and people to work out with instead.
export default function Suggest() {
  useTheme();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const { activities, profile, runRequests, blocked } = useStore();
  const [now] = useState(() => Date.now());
  if (!profile) return null;
  const from = activities.find((a) => a.id === activityId);
  const type = from?.type ?? profile.activities[0];
  const status = activityId ? runRequests[activityId]?.status : undefined;

  const open = activities
    .filter(
      (a) =>
        a.id !== activityId &&
        a.hostId !== 'me' &&
        !a.participants.includes('me') &&
        !runRequests[a.id] &&
        a.participants.length < a.groupSize &&
        startsAt(a).getTime() > now,
    )
    .sort((a, b) => Number(b.type === type) - Number(a.type === type) || startsAt(a).getTime() - startsAt(b).getTime())
    .slice(0, 4);
  const people = PEOPLE.filter((p) => !blocked.includes(p.id) && fitsMeet(profile, p) && p.activities.includes(type) && p.id !== from?.hostId).slice(0, 5);

  return (
    <Screen edges={['bottom']}>
      <Text style={styles.title}>{status === 'declined' ? 'Not this time, but plenty more' : 'Others to work out with'}</Text>
      <Body muted>
        {status === 'declined'
          ? `${from?.title ?? 'That run'} didn’t work out. Here are other ${activityInfo(type).label.toLowerCase()} plans and people near you.`
          : 'While you wait for an answer, here are other plans and people near you.'}
      </Body>

      <Label>Runs you can join</Label>
      {open.length ? open.map((a) => <ActivityCard key={a.id} activity={a} />) : <Body muted>Nothing open right now.</Body>}
      <Pressable style={styles.cta} onPress={() => router.push('/create-activity')}>
        <Text style={styles.ctaText}>Or start your own and invite people</Text>
      </Pressable>

      <Label>People who like {activityInfo(type).label.toLowerCase()}</Label>
      {people.map((p) => (
        <Pressable key={p.id} style={styles.person} onPress={() => router.push(`/person/${p.id}`)}>
          <Avatar name={p.firstName} color={p.color} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{p.firstName}</Text>
            <Text style={styles.meta} numberOfLines={1}>{p.level} · free {p.availability[0]?.toLowerCase()}</Text>
          </View>
          <Text style={styles.meta}>›</Text>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  title: { fontFamily: fonts.serif, fontSize: 26, color: colors.ink, marginBottom: space.sm },
  cta: { borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.olive, paddingVertical: 12, alignItems: 'center', marginTop: space.sm },
  ctaText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.link },
  person: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm },
  name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
}));
