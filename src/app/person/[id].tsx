import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActivityCard } from '@/components/activity-card';
import { FollowButton } from '@/components/follow-button';
import { Avatar, Badge, Body, Chip, Chips, Label, Screen } from '@/components/ui';
import { activityInfo, distanceKm } from '@/data/options';
import { findPerson } from '@/data/people';
import { formatKm, matchScore } from '@/lib/matching';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

export default function PersonDetail() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, activities, block, following, runStatus } = useStore();
  const p = findPerson(id);
  if (!p || !profile) return null;

  const score = matchScore(profile, p);
  const theirs = activities.filter((a) => a.participants.includes(p.id));
  const follows = following.includes(p.id);
  // Runs you've been accepted into together: separate from following.
  const together = theirs.filter((a) => runStatus(a.id) === 'accepted' || a.participants.includes('me'));

  function shareLocation() {
    Alert.alert(`Share your location with ${p!.firstName}?`, 'They will see where you are for the next hour.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => Alert.alert('Location shared', `${p!.firstName} can see where you are for the next hour.`) },
    ]);
  }

  function onBlock() {
    Alert.alert(`Block ${p!.firstName}?`, "You won't see each other or each other's activities.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          block(p!.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen edges={['bottom']}>
      <View style={styles.head}>
        <Avatar name={p.firstName} color={p.color} size={96} />
        <Text style={styles.name}>{p.firstName}</Text>
        <Text style={styles.meta}>
          {p.age} · {p.neighborhood} · {formatKm(distanceKm(profile.neighborhood, p.neighborhood))}
        </Text>
        <View style={styles.badges}>
          <Badge label={`${score}% MATCH`} />
          {p.isCaptain && <Badge label="✓ VERIFIED HOST" tone="green" />}
        </View>
        <View style={{ marginTop: space.md }}>
          <FollowButton id={p.id} name={p.firstName} />
        </View>
        {follows ? (
          <View style={styles.actions}>
            <Pressable style={styles.action} onPress={() => router.push(`/chat/${p.id}` as Href)}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionText}>Message</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => router.push(`/call/${p.id}` as Href)}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Call</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={() => router.push(`/call/${p.id}?video=1` as Href)}>
              <Text style={styles.actionIcon}>🎥</Text>
              <Text style={styles.actionText}>Video</Text>
            </Pressable>
            <Pressable style={styles.action} onPress={shareLocation}>
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionText}>Location</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.hint}>Follow {p.firstName} to message, call, video call and share your location.</Text>
        )}
        <View style={styles.together}>
          <Text style={styles.togetherText}>
            {together.length
              ? `🏃 You’re in ${together.length} ${together.length === 1 ? 'run' : 'runs'} together`
              : 'Following doesn’t put you in their runs. Ask to join a run below.'}
          </Text>
        </View>
        {p.isCaptain && (
          <Text style={styles.captain}>
            {p.sessionsHosted} sessions hosted · ★ {p.rating} community rating
          </Text>
        )}
      </View>

      <Label>Moves</Label>
      <Chips>
        {p.activities.map((a) => (
          <Chip
            key={a}
            label={`${activityInfo(a).emoji} ${activityInfo(a).label}`}
            selected={profile.activities.includes(a)}
          />
        ))}
      </Chips>
      <Label>Level</Label>
      <Body>
        {p.level}
        {p.pace ? ` · ${p.pace}` : ''}
      </Body>
      <Body muted>{p.experience}</Body>
      <Label>Goals</Label>
      <Body>{p.goals.join(', ')}</Body>
      <Label>Usually free</Label>
      <Body>{p.availability.join(', ')}</Body>
      <Label>Vibe</Label>
      <Body>
        {p.groupSize} · {p.social}
      </Body>

      {theirs.length > 0 && (
        <>
          <Label>Join {p.firstName} at</Label>
          {theirs.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
        </>
      )}

      <View style={styles.safetyRow}>
        <Pressable onPress={() => Alert.alert('Report sent', `Thanks. Our team will review ${p.firstName}'s profile.`)}>
          <Text style={styles.danger}>Report</Text>
        </Pressable>
        <Pressable onPress={onBlock}>
          <Text style={styles.danger}>Block</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  head: { alignItems: 'center' },
  name: { fontSize: 32, fontWeight: '900', color: colors.ink, marginTop: space.md },
  meta: { fontSize: 15, color: colors.muted, marginTop: 2 },
  badges: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  captain: { fontSize: 13, color: colors.muted, marginTop: space.sm },
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
  action: { alignItems: 'center', gap: 4, minWidth: 72, paddingVertical: 10, paddingHorizontal: 8, borderRadius: radius.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  actionIcon: { fontSize: 20 },
  actionText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink },
  hint: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: space.sm, textAlign: 'center' },
  together: { marginTop: space.md, borderRadius: radius.pill, backgroundColor: colors.oliveSoft, paddingVertical: 8, paddingHorizontal: 14 },
  togetherText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink, textAlign: 'center' },
  safetyRow: { flexDirection: 'row', justifyContent: 'center', gap: space.xxl, marginTop: space.xxl },
  danger: { fontSize: 15, fontWeight: '700', color: colors.danger },
}));
