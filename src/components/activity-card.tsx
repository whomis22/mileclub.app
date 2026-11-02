import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { activityInfo } from '@/data/options';
import type { Activity } from '@/data/types';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, space, themed } from '@/theme';

import { Badge, Card } from './ui';

export function ActivityCard({ activity }: { activity: Activity }) {
  const info = activityInfo(activity.type);
  const filled = activity.participants.length;
  const { runStatus } = useStore();
  const joined = activity.participants.includes('me');
  const status = runStatus(activity.id);
  const full = filled >= activity.groupSize;
  return (
    <Card onPress={() => router.push(`/activity/${activity.id}`)}>
      <View style={styles.row}>
        <Text style={styles.emoji}>{info.emoji}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.when}>
            {friendlyDate(activity.date).toUpperCase()} · {activity.time}
          </Text>
          <Text style={styles.title}>{activity.title}</Text>
          <Text style={styles.meta}>
            {[activity.distance, activity.level, activity.neighborhood].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
      <View style={[styles.row, { marginTop: space.md, justifyContent: 'space-between' }]}>
        <Text style={styles.spots}>
          {filled}/{activity.groupSize} spots filled{activity.womenOnly ? ' · ♀ Women only' : ''}
        </Text>
        {joined ? (
          <Badge label={activity.hostId === 'me' ? "YOU'RE HOSTING" : "YOU'RE IN"} tone="green" />
        ) : status === 'pending' ? (
          <Badge label="WAITING FOR HOST" tone="plain" />
        ) : status === 'declined' ? (
          <Badge label="NOT ACCEPTED" tone="plain" />
        ) : full ? (
          <Badge label="WAITLIST" tone="plain" />
        ) : (
          <Badge label={activity.free ? 'FREE · JOIN' : 'JOIN'} />
        )}
      </View>
    </Card>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  emoji: { fontSize: 34 },
  when: { fontSize: 12, fontWeight: '800', color: colors.link, letterSpacing: 0.8 },
  title: { fontSize: 18, fontWeight: '800', color: colors.ink, marginTop: 2 },
  meta: { fontSize: 14, color: colors.muted, marginTop: 2 },
  spots: { fontSize: 14, fontWeight: '600', color: colors.ink },
}));
