import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SessionCard } from '@/components/session-card';
import { Avatar, Badge, Body, Chip, Chips, Label, Screen } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { ROLES } from '@/data/roles';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

export default function CoachProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, booked } = useStore();
  const c = findCoach(id);
  if (!c) return <Screen edges={[]}><Body>This coach isn’t available.</Body></Screen>;
  const theirs = sessions.filter((s) => s.coachId === c.id);

  return (
    <Screen edges={['bottom']}>
      <View style={styles.head}>
        <Avatar name={c.name} color={c.color} size={96} />
        <Text style={styles.name}>{c.name}</Text>
        <Text style={styles.headline}>{c.headline}</Text>
        <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.sm }}>
          <Badge label={`${ROLES.coach.emoji} ${ROLES.coach.name.toUpperCase()}`} />
          <Badge label={c.neighborhood.toUpperCase()} tone="plain" />
        </View>
      </View>
      <View style={styles.stats}>
        <Stat value={c.followers.toLocaleString()} label="Fans" />
        <Stat value={`★ ${c.rating}`} label="Rating" />
        <Stat value={`${c.sessionsRun}`} label="Sessions run" />
      </View>
      <Label>About</Label>
      <Body>{c.bio}</Body>
      <Label>Specialties</Label>
      <Chips>{c.specialties.map((s) => <Chip key={s} label={s} />)}</Chips>
      <Label>Book a session</Label>
      {theirs.map((s) => <SessionCard key={s.id} s={s} booked={booked.includes(s.id)} />)}
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center' },
  name: { fontSize: 28, fontWeight: '900', color: colors.ink, marginTop: space.md },
  headline: { fontSize: 15, color: colors.muted, marginTop: 2, textAlign: 'center' },
  stats: {
    flexDirection: 'row', marginTop: space.xl, paddingVertical: space.md, borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: colors.line,
  },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.ink },
  statLabel: { fontSize: 12, fontWeight: '700', color: colors.muted },
});
