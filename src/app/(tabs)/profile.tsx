import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Body, Button, Card, Chip, Chips, Label, MenuButton, Screen } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { activityInfo } from '@/data/options';
import { findPerson } from '@/data/people';
import { ROLES } from '@/data/roles';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

export default function ProfileTab() {
  useTheme();
  const { profile, activities, reset, setRole, following } = useStore();
  if (!profile) return null;
  const hosting = activities.filter((a) => a.hostId === 'me').length;
  const role = profile.role ?? 'member';
  const going = activities.filter((a) => a.participants.includes('me')).length;

  return (
    <Screen>
      <MenuButton onPress={() => router.push('/menu')} />
      <View style={styles.head}>
        <View style={styles.ring}>
          <Avatar name={profile.firstName} uri={profile.photoUri} size={88} />
        </View>
        <Text style={styles.name}>{profile.firstName}</Text>
        <Text style={styles.meta}>
          {profile.age ? `${profile.age} · ` : ''}{profile.neighborhood}
        </Text>
        <View style={{ marginTop: space.sm }}>
          <Badge label={role === 'coach' ? ROLES.coach.name : `${ROLES.member.name} member`} />
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{going}</Text>
          <Text style={styles.statLabel}>UPCOMING</Text>
        </View>
        <View style={[styles.stat, styles.statMid]}>
          <Text style={styles.statNum}>{hosting}</Text>
          <Text style={styles.statLabel}>HOSTING</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{profile.activities.length}</Text>
          <Text style={styles.statLabel}>SPORTS</Text>
        </View>
      </View>

      <Card style={styles.followCard}>
        <Text style={styles.followTitle}>Following · {following.length}</Text>
        <Text style={styles.followNote}>🔒 Only you can see who you follow and who follows you.</Text>
        {following.length === 0 ? (
          <Body muted>Tap Follow on someone’s profile or post to see their posts in For You.</Body>
        ) : (
          <View style={styles.followRow}>
            {following.map((id) => {
              const p = findPerson(id);
              const c = p ? undefined : findCoach(id);
              const name = p?.firstName ?? c?.name;
              if (!name) return null;
              return (
                <Pressable key={id} style={styles.followPerson} onPress={() => router.push(p ? `/person/${id}` : `/coach/${id}`)}>
                  <Avatar name={name} color={p?.color ?? c?.color} size={44} />
                  <Text style={styles.followName} numberOfLines={1}>{name.split(' ')[0]}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Card>

      {role === 'coach' ? (
        <Card style={styles.coachCard}>
          <Text style={styles.coachTitle}>You’re a {ROLES.coach.name}</Text>
          <Body muted>Host paid sessions. You keep 80%, Mile Club keeps 20%.</Body>
          <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
            <Button title="Host a session" variant="secondary" style={{ flex: 1 }} onPress={() => router.push('/host-session')} />
            <Button title="Earnings" style={{ flex: 1 }} onPress={() => router.push('/earnings')} />
          </View>
          <View style={{ marginTop: space.sm }}>
            <Button title="Booking requests" variant="ghost" onPress={() => router.push('/requests')} />
          </View>
        </Card>
      ) : (
        <Card style={styles.coachCard}>
          <Text style={styles.coachTitle}>Are you a coach?</Text>
          <Body muted>
            Become a {ROLES.coach.name}: host paid training sessions and keep 80% of what you earn.
          </Body>
          <View style={{ height: space.md }} />
          <Button title={`Become a ${ROLES.coach.name}`} variant="secondary" onPress={() => {
            setRole('coach');
            router.navigate('/studio' as Href);
          }} />
        </Card>
      )}

      <Label>Activities</Label>
      <Chips>
        {profile.activities.map((a) => (
          <Chip key={a} label={activityInfo(a).label} />
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
      {role === 'coach' && (
        <Button title={`Switch back to a ${ROLES.member.one} account`} variant="ghost" style={{ marginBottom: space.md }} onPress={() => {
          setRole('member');
          router.navigate('/now');
        }} />
      )}
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

const styles = themed(() => StyleSheet.create({
  head: { alignItems: 'center', marginTop: space.sm },
  ring: { borderWidth: 3, borderColor: colors.olive, borderRadius: 50, padding: 3 },
  name: { fontSize: 29, fontFamily: fonts.serif, color: colors.ink, marginTop: space.md },
  meta: { fontSize: 13, fontFamily: fonts.sans, color: colors.muted, marginTop: 2 },
  stats: { flexDirection: 'row', marginTop: space.xl, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.line, paddingVertical: space.md },
  stat: { flex: 1, alignItems: 'center' },
  statMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.line },
  statNum: { fontSize: 24, fontFamily: fonts.serif, color: colors.ink },
  followCard: { marginTop: space.lg, gap: 6 },
  followTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  followNote: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  followRow: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md, marginTop: space.sm },
  followPerson: { alignItems: 'center', width: 56 },
  followName: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink, marginTop: 4 },
  coachCard: { marginTop: space.lg },
  coachTitle: { fontSize: 19, fontFamily: fonts.serif, color: colors.ink, marginBottom: 4 },
  statLabel: { fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.sansMedium, color: colors.muted, marginTop: 2 },
}));
