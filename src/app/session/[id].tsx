import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { SplitBox } from '@/components/split-box';
import { Avatar, Badge, Body, Button, Card, Label, Screen } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { activityInfo } from '@/data/options';
import { ROLES, euro } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore, type RequestStatus } from '@/state/store';
import { colors, radius, space, themed, useTheme } from '@/theme';

const STATUS = themed((): Record<RequestStatus, { title: string; body: (coach: string) => string; bg: string; fg: string }> => ({
  pending: {
    title: '⏳ Request sent',
    body: (c) => `${c} will accept or decline soon. You’re only charged if they accept.`,
    bg: '#FFF1E2', fg: '#9A5B1E',
  },
  accepted: { title: '✓ You’re booked', body: (c) => `${c} accepted. See you there!`, bg: colors.greenSoft, fg: colors.green },
  declined: {
    title: 'Not this time',
    body: (c) => `${c} couldn’t take you for this one. You haven’t been charged.`,
    bg: '#F3EEF0', fg: colors.muted,
  },
}));

export default function SessionDetail() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions, statusOf, incoming, book, cancelBooking, profile } = useStore();
  const [checkout, setCheckout] = useState(false);
  const [paying, setPaying] = useState<'idle' | 'paying' | 'done'>('idle');
  const s = sessions.find((x) => x.id === id);
  if (!s || !profile) return <Screen edges={[]}><Body>This session is no longer available.</Body></Screen>;

  const mine = s.coachId === 'me';
  const coach = findCoach(s.coachId);
  const status = statusOf(s.id);
  const left = s.spots - s.booked;
  const pendingForMe = incoming.filter((r) => r.sessionId === s.id && r.status === 'pending').length;

  function pay() {
    setPaying('paying');
    setTimeout(() => {
      setPaying('done');
      book(s!.id);
      setTimeout(() => {
        setCheckout(false);
        setPaying('idle');
      }, 900);
    }, 1300);
  }

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
      <Body muted>{s.neighborhood}</Body>
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

      {mine && (
        <>
          <Label>Your earnings so far</Label>
          <SplitBox gross={s.price * s.booked} note={`${s.booked} people × ${euro(s.price)}`} />
        </>
      )}

      <View style={{ height: space.xl }} />
      {mine ? (
        <View style={{ gap: space.sm }}>
          <Button
            title={pendingForMe ? `REVIEW ${pendingForMe} REQUEST${pendingForMe === 1 ? '' : 'S'}` : 'SEE REQUESTS'}
            variant="secondary"
            onPress={() => router.push('/requests')}
          />
          <Button title="See all earnings" variant="ghost" onPress={() => router.push('/earnings')} />
        </View>
      ) : status ? (
        <>
          <View style={[styles.status, { backgroundColor: STATUS[status].bg }]}>
            <Text style={[styles.statusTitle, { color: STATUS[status].fg }]}>{STATUS[status].title}</Text>
            <Text style={[styles.statusBody, { color: STATUS[status].fg }]}>
              {STATUS[status].body(coach?.name.split(' ')[0] ?? 'The coach')}
            </Text>
          </View>
          <View style={{ height: space.md }} />
          {status === 'declined' ? (
            <Button title="Got it" variant="ghost" onPress={() => cancelBooking(s.id)} />
          ) : (
            <Button
              title={status === 'pending' ? 'Withdraw request' : 'Cancel booking'}
              variant="ghost"
              onPress={() =>
                Alert.alert(
                  status === 'pending' ? 'Withdraw request?' : 'Cancel booking?',
                  'You’d get your money back. This is a test, so no money moves.',
                  [
                    { text: 'Keep it', style: 'cancel' },
                    { text: 'Yes, cancel', style: 'destructive', onPress: () => cancelBooking(s.id) },
                  ],
                )
              }
            />
          )}
        </>
      ) : (
        <Button title={`REQUEST TO BOOK · ${euro(s.price)}`} variant="secondary" disabled={left <= 0} onPress={() => setCheckout(true)} />
      )}

      <Modal visible={checkout} transparent animationType="slide" onRequestClose={() => setCheckout(false)}>
        <Pressable style={styles.backdrop} onPress={() => paying === 'idle' && setCheckout(false)} />
        <View style={styles.sheet}>
          {paying === 'done' ? (
            <View style={{ alignItems: 'center', paddingVertical: space.xl, gap: space.sm }}>
              <View style={styles.doneCircle}><Text style={{ color: '#fff', fontSize: 34, fontWeight: '900' }}>✓</Text></View>
              <Text style={styles.sheetTitle}>Done</Text>
            </View>
          ) : (
            <>
              <View style={styles.apHead}>
                <Text style={styles.apBrand}>{Platform.OS === 'ios' ? '' : ''}Pay</Text>
                <Pressable onPress={() => setCheckout(false)} disabled={paying !== 'idle'}>
                  <Text style={styles.apCancel}>Cancel</Text>
                </Pressable>
              </View>
              <View style={styles.apRow}>
                <Text style={styles.apLabel}>CARD</Text>
                <Text style={styles.apValue}>Test Card ···· 4242</Text>
              </View>
              <View style={styles.apRow}>
                <Text style={styles.apLabel}>FOR</Text>
                <Text style={styles.apValue} numberOfLines={1}>{s.title}</Text>
              </View>
              <View style={[styles.apRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.apLabel}>PAY MILE CLUB</Text>
                <Text style={[styles.apValue, { fontSize: 22, fontWeight: '800' }]}>{euro(s.price)}</Text>
              </View>
              <Text style={styles.apNote}>
                Your request goes to {coach?.name.split(' ')[0] ?? 'the coach'}. You’re only charged if they accept.
                {'\n'}Test mode: no real money moves.
              </Text>
              {paying === 'paying' ? (
                <View style={styles.apButton}><ActivityIndicator color="#fff" /></View>
              ) : (
                <Pressable style={styles.apButton} onPress={pay}>
                  <Text style={styles.apButtonText}>
                    {Platform.OS === 'ios' ? 'Pay with Pay' : 'Pay with Google Pay'}
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </Modal>
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  kind: { fontSize: 12, fontWeight: '900', color: colors.purple, letterSpacing: 0.8, marginTop: space.sm },
  title: { fontSize: 28, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginTop: 2 },
  when: { fontSize: 16, fontWeight: '700', color: colors.link, marginTop: 4 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  coachName: { fontSize: 16, fontWeight: '800', color: colors.ink },
  coachMeta: { fontSize: 13, color: colors.muted },
  split: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.sm },
  bar: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: space.sm },
  barCoach: { backgroundColor: colors.accent },
  barFee: { backgroundColor: colors.purple },
  status: { borderRadius: radius.md, padding: space.lg },
  statusTitle: { fontSize: 17, fontWeight: '900' },
  statusBody: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  backdrop: { flex: 1, backgroundColor: '#00000055' },
  sheet: { backgroundColor: '#F2F2F7', padding: space.xl, paddingBottom: 40, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#000' },
  apHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.md },
  apBrand: { fontSize: 24, fontWeight: '600', color: '#000' },
  apCancel: { fontSize: 16, color: '#007AFF' },
  apRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.lg, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#C6C6C8' },
  apLabel: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  apValue: { fontSize: 15, color: '#000', flexShrink: 1, textAlign: 'right' },
  apNote: { fontSize: 12, color: '#8E8E93', textAlign: 'center', marginVertical: space.md, lineHeight: 17 },
  apButton: { backgroundColor: '#000', borderRadius: 12, height: 52, alignItems: 'center', justifyContent: 'center' },
  apButtonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  doneCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center' },
}));
