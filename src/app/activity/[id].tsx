import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Body, Button, Card, Label, Screen } from '@/components/ui';
import { activityInfo } from '@/data/options';
import { PEOPLE, findPerson } from '@/data/people';
import { rankPeople } from '@/lib/matching';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

export default function ActivityDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, profile, toggleJoin } = useStore();
  const a = activities.find((x) => x.id === id);
  if (!a || !profile) return <Screen edges={[]}><Body>This activity is no longer available.</Body></Screen>;

  const info = activityInfo(a.type);
  const host = a.hostId === 'me' ? null : findPerson(a.hostId);
  const joined = a.participants.includes('me');
  const isHost = a.hostId === 'me';
  const full = a.participants.length >= a.groupSize;

  return (
    <Screen edges={['bottom']}>
      <Text style={styles.emoji}>{info.emoji}</Text>
      <Text style={styles.when}>
        {friendlyDate(a.date).toUpperCase()} · {a.time}
        {a.recurring ? ` · ${a.recurring.toUpperCase()}` : ''}
      </Text>
      <Text style={styles.title}>{a.title}</Text>
      <View style={styles.badges}>
        <Badge label={a.level.toUpperCase()} tone="plain" />
        {a.distance && <Badge label={a.distance} tone="plain" />}
        {a.pace && <Badge label={a.pace} tone="plain" />}
        <Badge label={a.free ? 'FREE' : 'PAID'} tone={a.free ? 'green' : 'accent'} />
      </View>

      <Label>Where</Label>
      <Body>📍 {a.location}</Body>
      <Body muted>{a.neighborhood}, Amsterdam</Body>
      {a.partner && <Body muted>🤝 {a.partner}</Body>}

      <Label>About</Label>
      <Body>{a.description}</Body>

      <Label>Host</Label>
      {host ? (
        <Card onPress={() => router.push(`/person/${host.id}`)} style={styles.hostCard}>
          <Avatar name={host.firstName} color={host.color} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hostName}>{host.firstName}</Text>
            <Text style={styles.hostMeta}>
              {host.isCaptain
                ? `Top host · ${host.sessionsHosted} sessions hosted · ★ ${host.rating}`
                : 'Community member'}
            </Text>
          </View>
        </Card>
      ) : (
        <Body>You’re hosting this one.</Body>
      )}

      <Label>
        Who’s going · {a.participants.length}/{a.groupSize}
      </Label>
      <View style={styles.people}>
        {a.participants.map((pid) => {
          const p = pid === 'me' ? null : findPerson(pid);
          return (
            <View key={pid} style={styles.person}>
              <Avatar
                name={p?.firstName ?? profile.firstName}
                color={p?.color}
                uri={p ? undefined : profile.photoUri}
                size={44}
              />
              <Text style={styles.personName}>{p?.firstName ?? 'You'}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: space.xl }} />
      {isHost ? (
        <>
          <Label>People who’d be a great fit</Label>
          {rankPeople(
            { ...profile, activities: [a.type], level: a.level, neighborhood: a.neighborhood },
            PEOPLE.filter((p) => p.activities.includes(a.type) && !a.participants.includes(p.id)),
          )
            .slice(0, 3)
            .map(({ person, score }) => (
              <Card key={person.id} onPress={() => router.push(`/person/${person.id}`)} style={styles.hostCard}>
                <Avatar name={person.firstName} color={person.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>{person.firstName}</Text>
                  <Text style={styles.hostMeta}>
                    {person.level} · {person.neighborhood}
                  </Text>
                </View>
                <Text style={styles.fit}>{score}%</Text>
              </Card>
            ))}
          <Body muted>Invites and group chat are coming next.</Body>
        </>
      ) : (
        <Button
          title={joined ? "YOU'RE IN · LEAVE" : full ? 'JOIN WAITLIST' : 'JOIN'}
          variant={joined ? 'ghost' : 'secondary'}
          onPress={() => toggleJoin(a.id)}
        />
      )}
      <Text style={styles.safety}>
        Meet in the public spot listed above. Trust your gut and leave if anything feels off.
      </Text>
      {!isHost && (
        <Pressable
          onPress={() =>
            Alert.alert('Report activity', 'Thanks for letting us know. Our team will review this activity.')
          }>
          <Text style={styles.report}>Report this activity</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 48 },
  when: { fontSize: 13, fontWeight: '800', color: colors.accent, letterSpacing: 0.8, marginTop: space.sm },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  hostCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hostName: { fontSize: 17, fontWeight: '800', color: colors.ink },
  hostMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  person: { alignItems: 'center', width: 56 },
  personName: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 4 },
  fit: { fontSize: 18, fontWeight: '900', color: colors.accent },
  safety: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: space.lg, lineHeight: 18 },
  report: { fontSize: 14, fontWeight: '700', color: colors.danger, textAlign: 'center', marginTop: space.lg },
});
