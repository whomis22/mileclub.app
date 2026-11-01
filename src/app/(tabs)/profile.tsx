import { router } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Body, Button, Card, Chip, Chips, Label, Screen } from '@/components/ui';
import { activityInfo } from '@/data/options';
import { useStore } from '@/state/store';
import { colors, space } from '@/theme';

export default function ProfileTab() {
  const { profile, activities, reset } = useStore();
  if (!profile) return null;
  const hosting = activities.filter((a) => a.hostId === 'me').length;
  const going = activities.filter((a) => a.participants.includes('me')).length;

  return (
    <Screen>
      <View style={styles.head}>
        <Avatar name={profile.firstName} uri={profile.photoUri} size={88} />
        <Text style={styles.name}>{profile.firstName}</Text>
        <Text style={styles.meta}>
          {profile.age ? `${profile.age} · ` : ''}{profile.neighborhood}, Amsterdam
        </Text>
        <View style={{ marginTop: space.sm }}>
          <Badge label="MILE CLUB MEMBER" />
        </View>
      </View>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statNum}>{going}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statNum}>{hosting}</Text>
          <Text style={styles.statLabel}>Hosting</Text>
        </Card>
      </View>

      <Label>Activities</Label>
      <Chips>
        {profile.activities.map((a) => (
          <Chip key={a} label={`${activityInfo(a).emoji} ${activityInfo(a).label}`} />
        ))}
      </Chips>
      <Label>Level</Label>
      <Body>
        {profile.level}
        {profile.pace ? ` · ${profile.pace}` : ''}
      </Body>
      <Label>Goals</Label>
      <Body>{profile.goals.join(', ')}</Body>
      <Label>Free</Label>
      <Body>{profile.availability.join(', ')}</Body>
      <Label>Vibe</Label>
      <Body>
        {profile.groupSize} · {profile.social}
      </Body>
      {profile.emergencyContact ? (
        <>
          <Label>Emergency contact</Label>
          <Body>{profile.emergencyContact}</Body>
        </>
      ) : null}

      <View style={{ height: space.xxl }} />
      <Button
        title="Start over"
        variant="ghost"
        onPress={() =>
          Alert.alert('Start over?', 'This clears your profile and plans on this phone.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Start over',
              style: 'destructive',
              onPress: () => {
                reset();
                router.replace('/welcome');
              },
            },
          ])
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { alignItems: 'center', marginTop: space.lg },
  name: { fontSize: 30, fontWeight: '900', color: colors.ink, marginTop: space.md },
  meta: { fontSize: 15, color: colors.muted, marginTop: 2 },
  stats: { flexDirection: 'row', gap: space.md, marginTop: space.xl },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 28, fontWeight: '900', color: colors.accent },
  statLabel: { fontSize: 13, fontWeight: '700', color: colors.muted },
});
