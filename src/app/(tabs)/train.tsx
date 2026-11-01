import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { SessionCard } from '@/components/session-card';
import { Avatar, Button, Label, Screen, Title } from '@/components/ui';
import { COACHES } from '@/data/coaches';
import { ROLES, euro, split } from '@/data/roles';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme';

export default function Train() {
  const { profile, sessions, booked } = useStore();
  if (!profile) return <Redirect href="/welcome" />;
  const isCoach = profile.role === 'coach';

  const mine = sessions.filter((s) => s.coachId === 'me');
  const others = sessions
    .filter((s) => s.coachId !== 'me')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const myBookings = others.filter((s) => booked.includes(s.id));
  const earned = mine.reduce((sum, s) => sum + split(s.price * s.booked).coach, 0);

  return (
    <Screen>
      <Title sub={`Paid sessions from ${ROLES.coach.name}s, local coaches who know Amsterdam.`}>Train with a pro</Title>

      {isCoach ? (
        <View style={styles.dash}>
          <Text style={styles.dashKicker}>{ROLES.coach.emoji} YOUR {ROLES.coach.name.toUpperCase()} DASHBOARD</Text>
          <View style={styles.dashRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashValue}>{euro(earned)}</Text>
              <Text style={styles.dashLabel}>You’ve earned (80%)</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dashValue}>{mine.length}</Text>
              <Text style={styles.dashLabel}>Sessions hosted</Text>
            </View>
          </View>
          <View style={styles.dashBtns}>
            <Pressable style={[styles.dashBtn, { backgroundColor: colors.accent }]} onPress={() => router.push('/host-session')}>
              <Text style={styles.dashBtnText}>+ Host a session</Text>
            </Pressable>
            <Pressable style={[styles.dashBtn, { backgroundColor: '#ffffff22' }]} onPress={() => router.push('/earnings')}>
              <Text style={styles.dashBtnText}>See earnings</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable style={styles.becomeCoach} onPress={() => router.push('/profile')}>
          <Text style={styles.becomeText}>
            Are you a coach? Become a {ROLES.coach.name} and keep 80% of what you earn →
          </Text>
        </Pressable>
      )}

      <Label>{ROLES.coach.name}s near you</Label>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -space.xl }}>
        <View style={{ flexDirection: 'row', gap: space.md, paddingHorizontal: space.xl }}>
          {COACHES.map((c) => (
            <Pressable key={c.id} style={styles.coach} onPress={() => router.push(`/coach/${c.id}`)}>
              <Avatar name={c.name} color={c.color} size={56} />
              <Text style={styles.coachName} numberOfLines={1}>{c.name.split(' ')[0]}</Text>
              <Text style={styles.coachHead} numberOfLines={2}>{c.headline}</Text>
              <Text style={styles.coachRating}>★ {c.rating} · {c.followers.toLocaleString()} fans</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {mine.length > 0 && (
        <>
          <Label>You’re hosting</Label>
          {mine.map((s) => <SessionCard key={s.id} s={s} mine />)}
        </>
      )}

      {myBookings.length > 0 && (
        <>
          <Label>You booked</Label>
          {myBookings.map((s) => <SessionCard key={s.id} s={s} booked />)}
        </>
      )}

      <Label>Upcoming sessions</Label>
      {others.filter((s) => !booked.includes(s.id)).map((s) => <SessionCard key={s.id} s={s} />)}

      {isCoach && mine.length === 0 && (
        <Button title="+ HOST YOUR FIRST SESSION" variant="secondary" onPress={() => router.push('/host-session')} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dash: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: space.lg },
  dashKicker: { color: colors.peach, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  dashRow: { flexDirection: 'row', marginTop: space.md },
  dashValue: { color: '#fff', fontSize: 30, fontWeight: '900' },
  dashLabel: { color: '#fff', opacity: 0.7, fontSize: 12, fontWeight: '700' },
  dashBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  dashBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  dashBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  becomeCoach: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space.lg },
  becomeText: { color: colors.accent, fontWeight: '800', fontSize: 15, lineHeight: 21 },
  coach: {
    width: 150, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, borderWidth: 1,
    borderColor: colors.line, alignItems: 'flex-start', gap: 4,
  },
  coachName: { fontSize: 16, fontWeight: '900', color: colors.ink, marginTop: space.sm },
  coachHead: { fontSize: 12, color: colors.muted, lineHeight: 16, minHeight: 32 },
  coachRating: { fontSize: 12, fontWeight: '800', color: colors.purple },
});
