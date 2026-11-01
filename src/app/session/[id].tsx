import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { SplitBox } from '@/components/split-box';
import { Avatar, Badge, Body, Button, Card, Label, Screen } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { activityInfo } from '@/data/options';
import { ROLES, euro, split } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme';

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, booked, book, cancelBooking, profile } = useStore();
  const [checkout, setCheckout] = useState(false);
  const s = sessions.find((x) => x.id === id);
  if (!s || !profile) return <Screen edges={[]}><Body>This session is no longer available.</Body></Screen>;

  const mine = s.coachId === 'me';
  const coach = findCoach(s.coachId);
  const isBooked = booked.includes(s.id);
  const left = s.spots - s.booked;
  const parts = split(s.price);

  return (
    <Screen edges={['bottom']}>
      <Text style={{ fontSize: 44 }}>{activityInfo(s.type).emoji}</Text>
      <Text style={styles.kind}>{s.kind.toUpperCase()}{s.weeks ? ` · ${s.weeks}-WEEK PROGRAMME` : ''}</Text>
      <Text style={styles.title}>{s.title}</Text>
      <Text style={styles.when}>{friendlyDate(s.date)} · {s.time}</Text>
      <View style={{ flexDirection: 'row', gap: space.sm, marginTop: space.md }}>
        <Badge label={`${euro(s.price)} PER PERSON`} />
        <Badge label={left > 0 ? `${left} OF ${s.spots} SPOTS LEFT` : 'FULL'} tone="plain" />
      </View>

      <Label>Where</Label>
      <Body>📍 {s.location}</Body>
      <Body muted>{s.neighborhood}, Amsterdam</Body>
      <Label>What you get</Label>
      <Body>{s.description}</Body>

      <Label>Your coach</Label>
      {mine ? (
        <Body>You’re the {ROLES.coach.name} for this one.</Body>
      ) : coach ? (
        <Card onPress={() => router.push(`/coach/${coach.id}`)} style={styles.coachCard}>
          <Avatar name={coach.name} color={coach.color} />
          <View style={{ flex: 1 }}>
            <Text style={styles.coachName}>{coach.name}</Text>
            <Text style={styles.coachMeta}>{coach.headline} · ★ {coach.rating}</Text>
          </View>
        </Card>
      ) : null}

      {mine ? (
        <>
          <Label>Your earnings so far</Label>
          <SplitBox gross={s.price * s.booked} note={`${s.booked} people × ${euro(s.price)}`} />
        </>
      ) : (
        <>
          <Label>Where your money goes</Label>
          <SplitBox gross={s.price} note="per booking" />
        </>
      )}

      <View style={{ height: space.xl }} />
      {mine ? (
        <Button title="SEE ALL EARNINGS" onPress={() => router.push('/earnings')} />
      ) : isBooked ? (
        <>
          <Badge label="✓ YOU’RE BOOKED" tone="green" />
          <View style={{ height: space.md }} />
          <Button
            title="Cancel booking"
            variant="ghost"
            onPress={() =>
              Alert.alert('Cancel booking?', 'In the real app you’d get a refund. This is a test, so no money moves.', [
                { text: 'Keep it', style: 'cancel' },
                { text: 'Cancel booking', style: 'destructive', onPress: () => cancelBooking(s.id) },
              ])
            }
          />
        </>
      ) : (
        <Button title={`BOOK FOR ${euro(s.price)}`} variant="secondary" disabled={left <= 0} onPress={() => setCheckout(true)} />
      )}

      <Modal visible={checkout} transparent animationType="slide" onRequestClose={() => setCheckout(false)}>
        <Pressable style={styles.backdrop} onPress={() => setCheckout(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Confirm booking</Text>
          <Text style={styles.sheetSub}>{s.title}</Text>
          <View style={styles.line}>
            <Text style={styles.lineLabel}>Session</Text>
            <Text style={styles.lineValue}>{euro(parts.gross)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineMuted}>Goes to {coach?.name.split(' ')[0] ?? 'the coach'} (80%)</Text>
            <Text style={styles.lineMuted}>{euro(parts.coach)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.lineMuted}>Mile Club (20%)</Text>
            <Text style={styles.lineMuted}>{euro(parts.fee)}</Text>
          </View>
          <View style={styles.demo}>
            <Text style={styles.demoText}>🧪 Test mode: no card needed and no real money is taken.</Text>
          </View>
          <Button
            title={`PAY ${euro(s.price)}`}
            variant="secondary"
            onPress={() => {
              book(s.id);
              setCheckout(false);
              Alert.alert('You’re booked! 🎉', `See you ${friendlyDate(s.date).toLowerCase()} at ${s.time}.`);
            }}
          />
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  kind: { fontSize: 12, fontWeight: '900', color: colors.purple, letterSpacing: 0.8, marginTop: space.sm },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  when: { fontSize: 16, fontWeight: '700', color: colors.accent, marginTop: 4 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  coachName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  coachMeta: { fontSize: 13, color: colors.muted },
  split: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: space.sm },
  barCoach: { backgroundColor: colors.accent },
  barFee: { backgroundColor: colors.purple },
  line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineLabel: { fontSize: 15, fontWeight: '700', color: colors.ink },
  lineValue: { fontSize: 17, fontWeight: '900', color: colors.ink },
  lineMuted: { fontSize: 14, color: colors.muted, fontWeight: '600' },
  backdrop: { flex: 1, backgroundColor: '#1B103566' },
  sheet: { backgroundColor: colors.bg, padding: space.xl, paddingBottom: 40, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: space.md },
  sheetTitle: { fontSize: 24, fontWeight: '900', color: colors.ink },
  sheetSub: { fontSize: 15, color: colors.muted, marginTop: -8 },
  demo: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space.md },
  demoText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});
