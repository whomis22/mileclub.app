import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ActivityCard } from '@/components/activity-card';
import { Avatar, Body, Button, Card, Chip, Label, MenuButton, Screen, Title } from '@/components/ui';
import { ACTIVITIES, type ActivityId } from '@/data/options';
import { findPerson } from '@/data/people';
import { friendlyDate } from '@/lib/format';
import { activityFit } from '@/lib/matching';
import { useStore } from '@/state/store';
import type { RequestStatus } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

const STATUS = themed((): Record<RequestStatus, { label: string; bg: string; fg: string }> => ({
  pending: { label: 'Waiting', bg: colors.sand, fg: colors.muted },
  accepted: { label: 'Accepted', bg: colors.olive, fg: colors.onBrand },
  declined: { label: 'Declined', bg: colors.sand, fg: colors.danger },
}));

export default function Activities() {
  useTheme();
  const { activities, profile, runRequests, runIncoming, respondRun } = useStore();
  const [filter, setFilter] = useState<ActivityId | 'all' | 'mine'>('all');

  const list = activities
    .filter((a) =>
      filter === 'all' ? true : filter === 'mine' ? a.participants.includes('me') : a.type === filter,
    )
    .sort((a, b) => {
      if (filter === 'mine') return (a.date + a.time).localeCompare(b.date + b.time);
      return profile ? activityFit(profile, b) - activityFit(profile, a) : 0;
    });

  // Runs the user asked to join, newest first, with where each request stands.
  const mine = Object.entries(runRequests)
    .sort(([, x], [, y]) => y.at - x.at)
    .map(([id, r]) => ({ a: activities.find((x) => x.id === id), status: r.status }))
    .filter((x): x is { a: (typeof activities)[number]; status: RequestStatus } => !!x.a);
  // People asking to join runs the user hosts.
  const asking = runIncoming.filter((r) => r.status === 'pending');

  const types = ACTIVITIES.filter((t) => activities.some((a) => a.type === t.id));

  return (
    <Screen>
      <MenuButton onPress={() => router.push('/menu')} />
      <View style={{ height: space.lg }} />
      <Title sub="Join something this week, or start your own.">My runs</Title>
      <Button title="+ Start a run" onPress={() => router.push('/create-activity')} />
      {asking.length > 0 && (
        <>
          <Label>Asking to join your runs · {asking.length}</Label>
          {asking.map((r) => {
            const p = findPerson(r.personId);
            const a = activities.find((x) => x.id === r.activityId);
            if (!p || !a) return null;
            return (
              <Card key={r.id} style={styles.row}>
                <Avatar name={p.firstName} color={p.color} />
                <Pressable style={{ flex: 1 }} onPress={() => router.push(`/activity/${a.id}`)}>
                  <Text style={styles.name}>{p.firstName}</Text>
                  <Text style={styles.meta} numberOfLines={1}>wants to join {a.title}</Text>
                </Pressable>
                <Pressable onPress={() => respondRun(r.id, 'declined')} style={styles.decline} accessibilityLabel={`Decline ${p.firstName}`}>
                  <Text style={styles.declineText}>✕</Text>
                </Pressable>
                <Pressable onPress={() => respondRun(r.id, 'accepted')} style={styles.accept} accessibilityLabel={`Accept ${p.firstName}`}>
                  <Text style={styles.acceptText}>✓</Text>
                </Pressable>
              </Card>
            );
          })}
        </>
      )}
      {mine.length > 0 && (
        <>
          <Label>Your requests</Label>
          {mine.map(({ a, status }) => (
            <Card key={a.id} style={styles.row} onPress={() => router.push(`/activity/${a.id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{a.title}</Text>
                <Text style={styles.meta}>
                  {friendlyDate(a.date)} · {a.time}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: STATUS[status].bg }]}>
                <Text style={[styles.pillText, { color: STATUS[status].fg }]}>{STATUS[status].label}</Text>
              </View>
            </Card>
          ))}
          <Body muted>Hosts accept or decline each request. You can take part once you’re accepted.</Body>
        </>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="For you" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="My plans" selected={filter === 'mine'} onPress={() => setFilter('mine')} />
          {types.map((t) => (
            <Chip key={t.id} label={`${t.emoji} ${t.label}`} selected={filter === t.id} onPress={() => setFilter(t.id)} />
          ))}
        </View>
      </ScrollView>
      {list.length === 0 ? (
        <Body muted>Nothing here yet. Join an activity or create one and it will show up here.</Body>
      ) : (
        list.map((a) => <ActivityCard key={a.id} activity={a} />)
      )}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  pill: { borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 12 },
  pillText: { fontFamily: fonts.sansSemi, fontSize: 12 },
  accept: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: colors.onBrand, fontSize: 18, fontWeight: '800' },
  decline: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  declineText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
}));
