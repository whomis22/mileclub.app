import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { findCoach, type CoachSession } from '@/data/coaches';
import { activityInfo } from '@/data/options';
import { euro } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { colors, radius, space } from '@/theme';

import { Avatar, Badge, Card } from './ui';

export function SessionCard({ s, mine, booked }: { s: CoachSession; mine?: boolean; booked?: boolean }) {
  const coach = findCoach(s.coachId);
  const left = s.spots - s.booked;
  return (
    <Card onPress={() => router.push(`/session/${s.id}`)}>
      <View style={styles.row}>
        <Text style={{ fontSize: 30 }}>{activityInfo(s.type).emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.kind}>{s.kind.toUpperCase()}{s.weeks ? ` · ${s.weeks} WEEKS` : ''}</Text>
          <Text style={styles.title}>{s.title}</Text>
          <Text style={styles.meta}>
            {friendlyDate(s.date)} · {s.time} · {s.neighborhood}
          </Text>
        </View>
        <View style={styles.price}>
          <Text style={styles.priceText}>{euro(s.price)}</Text>
        </View>
      </View>
      <View style={[styles.row, { marginTop: space.md, justifyContent: 'space-between' }]}>
        <View style={styles.row}>
          {coach && <Avatar name={coach.name} color={coach.color} size={24} />}
          <Text style={styles.coach}>{mine ? 'You’re hosting' : coach?.name}</Text>
        </View>
        {booked ? (
          <Badge label="BOOKED" tone="green" />
        ) : (
          <Badge label={left > 0 ? `${left} SPOTS LEFT` : 'FULL'} tone={left > 0 && left <= 3 ? 'accent' : 'plain'} />
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  kind: { fontSize: 11, fontWeight: '900', color: colors.purple, letterSpacing: 0.8 },
  title: { fontSize: 17, fontWeight: '800', color: colors.ink, marginTop: 2 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  price: { backgroundColor: colors.ink, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  priceText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  coach: { fontSize: 13, fontWeight: '700', color: colors.ink },
});
