import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SessionCard } from '@/components/session-card';
import { Avatar, MenuButton } from '@/components/ui';
import { findPerson } from '@/data/people';
import { euro, split } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Coach home ("Studio"): what a coach needs first. Their earnings, people asking
// to book or join, their upcoming sessions, and a quick way to host another.
// Coaches can still join other people's runs from the Join tab.
export default function Studio() {
  useTheme();
  const { profile, sessions, incoming, respond, runIncoming, respondRun, activities } = useStore();
  if (!profile) return <Redirect href="/welcome" />;

  const mine = sessions
    .filter((s) => s.coachId === 'me')
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const earned = mine.reduce((sum, s) => sum + split(s.price * s.booked).coach, 0);
  const booked = mine.reduce((sum, s) => sum + s.booked, 0);
  const bookingAsks = incoming.filter((r) => r.status === 'pending');
  const runAsks = runIncoming.filter((r) => r.status === 'pending');

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.header}>
          <MenuButton onPress={() => router.push('/menu')} />
          <Avatar name={profile.firstName} uri={profile.photoUri} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>Coach studio</Text>
            <Text style={styles.hello}>{profile.firstName}</Text>
          </View>
        </View>
        <Text style={styles.title}>
          Your <Text style={styles.italic}>studio</Text>
        </Text>

        <Pressable style={styles.money} onPress={() => router.push('/earnings')}>
          <Text style={styles.moneyKicker}>YOUR EARNINGS</Text>
          <Text style={styles.moneyValue}>{euro(earned)}</Text>
          <View style={styles.moneyRow}>
            <Text style={styles.moneySmall}>{mine.length} sessions · {booked} people booked</Text>
            <Text style={styles.moneyLink}>Earnings →</Text>
          </View>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.host, pressed && { opacity: 0.85 }]} onPress={() => router.push('/host-session')}>
          <Text style={styles.hostText}>+ Host a session</Text>
        </Pressable>

        <Text style={styles.section}>Requests{bookingAsks.length + runAsks.length ? ` · ${bookingAsks.length + runAsks.length}` : ''}</Text>
        {bookingAsks.length + runAsks.length === 0 ? (
          <Text style={styles.empty}>No one waiting right now. New booking requests show up here.</Text>
        ) : null}
        {bookingAsks.map((r) => {
          const p = findPerson(r.personId);
          const s = sessions.find((x) => x.id === r.sessionId);
          if (!p || !s) return null;
          return (
            <View key={r.id} style={styles.req}>
              <Avatar name={p.firstName} color={p.color} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reqName}>{p.firstName}</Text>
                <Text style={styles.reqMeta} numberOfLines={1}>
                  wants to book {s.title} · {friendlyDate(s.date)}
                </Text>
              </View>
              <Pressable onPress={() => respond(r.id, 'declined')} style={styles.no} accessibilityLabel={`Decline ${p.firstName}`}>
                <Text style={styles.noText}>✕</Text>
              </Pressable>
              <Pressable onPress={() => respond(r.id, 'accepted')} style={styles.yes} accessibilityLabel={`Accept ${p.firstName}`}>
                <Text style={styles.yesText}>✓</Text>
              </Pressable>
            </View>
          );
        })}
        {runAsks.map((r) => {
          const p = findPerson(r.personId);
          const a = activities.find((x) => x.id === r.activityId);
          if (!p || !a) return null;
          return (
            <View key={r.id} style={styles.req}>
              <Avatar name={p.firstName} color={p.color} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reqName}>{p.firstName}</Text>
                <Text style={styles.reqMeta} numberOfLines={1}>
                  wants to join {a.title}
                </Text>
              </View>
              <Pressable onPress={() => respondRun(r.id, 'declined')} style={styles.no} accessibilityLabel={`Decline ${p.firstName}`}>
                <Text style={styles.noText}>✕</Text>
              </Pressable>
              <Pressable onPress={() => respondRun(r.id, 'accepted')} style={styles.yes} accessibilityLabel={`Accept ${p.firstName}`}>
                <Text style={styles.yesText}>✓</Text>
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.section}>Your sessions</Text>
        {mine.length === 0 ? (
          <Text style={styles.empty}>You haven’t hosted a session yet. Tap “Host a session” to set your first one.</Text>
        ) : (
          mine.map((s) => <SessionCard key={s.id} s={s} mine />)
        )}

        <Pressable style={styles.joinCard} onPress={() => router.navigate('/now')}>
          <Text style={styles.joinTitle}>Run with others too</Text>
          <Text style={styles.empty}>Coaches can join group runs like everyone else. Swipe through what’s on this week.</Text>
          <Text style={styles.joinLink}>Find a run →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    body: { paddingHorizontal: space.xl, paddingBottom: 40 },
    header: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingTop: space.sm },
    kicker: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
    hello: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink },
    title: { fontFamily: fonts.serif, fontSize: 38, lineHeight: 40, color: colors.ink, marginTop: 18 },
    italic: { fontFamily: fonts.serifItalic },
    money: { marginTop: space.lg, borderRadius: 28, backgroundColor: colors.oliveDark, padding: 22 },
    moneyKicker: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.peach },
    moneyValue: { fontFamily: fonts.serif, fontSize: 48, color: colors.onBrand, marginTop: 6 },
    moneyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    moneySmall: { fontFamily: fonts.sans, fontSize: 12, color: '#E3E6D3' },
    moneyLink: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.onBrand },
    host: { marginTop: space.md, height: 54, borderRadius: radius.pill, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
    hostText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.onBrand },
    section: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, marginTop: space.xl, marginBottom: space.sm },
    empty: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.muted },
    req: {
      flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card,
      borderRadius: 22, padding: space.md, marginBottom: space.sm,
    },
    reqName: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
    reqMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
    yes: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
    yesText: { color: colors.onBrand, fontSize: 18, fontWeight: '800' },
    no: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    noText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
    joinCard: { marginTop: space.xl, borderRadius: 24, borderWidth: 1, borderColor: colors.edge, padding: 20, gap: 6 },
    joinTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
    joinLink: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.link, marginTop: 4 },
  }),
);
