import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Card, Screen, Title } from '@/components/ui';
import { activityInfo } from '@/data/options';
import { PEOPLE } from '@/data/people';
import { formatKm, rankPeople } from '@/lib/matching';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

export default function Discover() {
  const { profile, blocked } = useStore();
  if (!profile) return <Redirect href="/welcome" />;

  const matches = rankPeople(
    profile,
    PEOPLE.filter((p) => !blocked.includes(p.id)),
  );

  return (
    <Screen edges={['bottom']}>
      <Title sub={`${matches.length} people near ${profile.neighborhood} who move like you`}>
        Hi {profile.firstName} 👋
      </Title>
      {matches.map(({ person, score, km, shared }) => (
        <Card key={person.id} onPress={() => router.push(`/person/${person.id}`)}>
          <View style={styles.row}>
            <Avatar name={person.firstName} color={person.color} size={56} />
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{person.firstName}</Text>
                {person.isCaptain && <Badge label="TOP HOST" tone="green" />}
              </View>
              <Text style={styles.meta}>
                {person.level} · {formatKm(km)}
              </Text>
            </View>
            <View style={styles.score}>
              <Text style={styles.scoreNum}>{score}%</Text>
              <Text style={styles.scoreLabel}>match</Text>
            </View>
          </View>
          <Text style={styles.detail}>
            {(shared.length ? shared : person.activities)
              .map((a) => `${activityInfo(a).emoji} ${activityInfo(a).label}`)
              .join('   ')}
            {person.pace ? `  ·  ${person.pace}` : ''}
          </Text>
          <Text style={styles.detail}>🗓 {person.availability.join(', ')}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  name: { fontSize: 20, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 14, color: colors.muted, marginTop: 2 },
  score: { alignItems: 'center' },
  scoreNum: { fontSize: 24, fontWeight: '900', color: colors.link },
  scoreLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  detail: { fontSize: 14, color: colors.ink, marginTop: space.md },
});
