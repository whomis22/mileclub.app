import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SessionCard } from '@/components/session-card';
import { PageTop } from '@/components/page-top';
import { Avatar, Button, Label, Screen } from '@/components/ui';
import { COACHES } from '@/data/coaches';
import { ROLES, euro, split } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Coaches page (opened from the side menu as /coaches).
export default function Train() {
  useTheme();
  const { profile, sessions, statusOf, incoming } = useStore();
  if (!profile) return <Redirect href="/welcome" />;
  const isCoach = profile.role === 'coach';

  const mine = sessions.filter((s) => s.coachId === 'me');
  const others = sessions
    .filter((s) => s.coachId !== 'me')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const myBookings = others.filter((s) => statusOf(s.id));
  const pendingCount = incoming.filter((r) => r.status === 'pending').length;
  const earned = mine.reduce((sum, s) => sum + split(s.price * s.booked).coach, 0);

  return (
    <Screen>
      <PageTop title="Coaches" />
      <Text style={styles.intro}>Verified coaches near you and the sessions they run. You pay the coach per session.</Text>

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
          {pendingCount > 0 && (
            <Pressable style={styles.reqBanner} onPress={() => router.push('/requests')}>
              <Text style={styles.reqText}>
                {pendingCount} new booking request{pendingCount === 1 ? '' : 's'} · Review →
              </Text>
            </Pressable>
          )}
          <View style={styles.dashBtns}>
            <Pressable style={[styles.dashBtn, { backgroundColor: colors.accent }]} onPress={() => router.push('/host-session')}>
              <Text style={styles.dashBtnText}>+ Host a session</Text>
            </Pressable>
            <Pressable style={[styles.dashBtn, { backgroundColor: '#ffffff22' }]} onPress={() => router.push('/earnings')}>
              <Text style={styles.dashBtnText}>Earnings</Text>
            </Pressable>
            <Pressable style={[styles.dashBtn, { backgroundColor: '#ffffff22' }]} onPress={() => router.push('/requests')}>
              <Text style={styles.dashBtnText}>Requests</Text>
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

      {/* Coaches (Yana, 2026-11-22): every coach with a blue tick, tap for their profile,
          and their upcoming sessions right under them. */}
      <Label>Verified coaches</Label>
      {COACHES.map((c) => {
        const theirs = others.filter((x) => x.coachId === c.id);
        return (
          <View key={c.id} style={styles.cCard}>
            <Pressable style={styles.cTop} onPress={() => router.push(`/coach/${c.id}`)} accessibilityLabel={`Open ${c.name}'s profile`}>
              <Avatar name={c.name} color={c.color} size={56} />
              <View style={{ flex: 1 }}>
                <View style={styles.cNameRow}>
                  <Text style={styles.cName} numberOfLines={1}>{c.name}</Text>
                  <Ionicons name="checkmark-circle" size={17} color="#3B82F6" />
                </View>
                <Text style={styles.cHead} numberOfLines={1}>{c.headline}</Text>
                <Text style={styles.cMeta}>★ {c.rating} · {c.followers.toLocaleString('en-US')} followers</Text>
              </View>
              <Text style={styles.cView}>Profile ›</Text>
            </Pressable>
            {theirs.length ? (
              theirs.map((x) => (
                <Pressable key={x.id} style={styles.sRow} onPress={() => router.push(`/session/${x.id}`)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sTitle} numberOfLines={1}>{x.title}</Text>
                    <Text style={styles.sMeta}>{friendlyDate(x.date)} · {x.time} · {x.spots - x.booked} spots left</Text>
                  </View>
                  <Text style={styles.sPrice}>{euro(x.price)}</Text>
                </Pressable>
              ))
            ) : (
              <Text style={styles.sNone}>No sessions this week</Text>
            )}
          </View>
        );
      })}

      {mine.length > 0 && (
        <>
          <Label>You’re hosting</Label>
          {mine.map((s) => <SessionCard key={s.id} s={s} mine />)}
        </>
      )}

      {myBookings.length > 0 && (
        <>
          <Label>Your bookings</Label>
          {myBookings.map((s) => <SessionCard key={s.id} s={s} status={statusOf(s.id)} />)}
        </>
      )}

      {isCoach && mine.length === 0 && (
        <Button title="+ HOST YOUR FIRST SESSION" variant="secondary" onPress={() => router.push('/host-session')} />
      )}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  dash: { backgroundColor: colors.inkBg, borderRadius: radius.lg, padding: space.lg },
  dashKicker: { color: colors.peach, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  dashRow: { flexDirection: 'row', marginTop: space.md },
  dashValue: { color: '#fff', fontSize: 30, fontWeight: '900' },
  dashLabel: { color: '#fff', opacity: 0.7, fontSize: 12, fontWeight: '700' },
  reqBanner: { backgroundColor: colors.peach, borderRadius: radius.md, padding: space.md, marginTop: space.md },
  reqText: { color: colors.ink, fontWeight: '900', fontSize: 14 },
  dashBtns: { flexDirection: 'row', gap: space.sm, marginTop: space.lg },
  dashBtn: { flex: 1, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  dashBtnText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  becomeCoach: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space.lg },
  becomeText: { color: colors.link, fontWeight: '800', fontSize: 15, lineHeight: 21 },
  intro: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.muted, marginBottom: space.sm },
  cCard: { backgroundColor: colors.card, borderRadius: 22, padding: 14, marginBottom: 12 },
  cTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cName: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, flexShrink: 1 },
  cHead: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  cMeta: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink, marginTop: 3 },
  cView: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.link },
  sRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line },
  sTitle: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  sMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  sPrice: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink, backgroundColor: colors.bg, borderRadius: 999, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 5 },
  sNone: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 10 },
  coach: {
    width: 150, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, borderWidth: 1,
    borderColor: colors.line, alignItems: 'flex-start', gap: 4,
  },
  coachName: { fontSize: 16, fontWeight: '900', color: colors.ink, marginTop: space.sm },
  coachHead: { fontSize: 12, color: colors.muted, lineHeight: 16, minHeight: 32 },
  coachRating: { fontSize: 12, fontWeight: '800', color: colors.purple },
}));
