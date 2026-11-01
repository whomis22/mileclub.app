import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SplitBox } from '@/components/split-box';
import { Body, Button, Card, Chip, Chips, Label, Screen } from '@/components/ui';
import { ROLES, euro, split } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme';

export default function Earnings() {
  const { sessions } = useStore();
  const mine = sessions.filter((s) => s.coachId === 'me');
  const gross = mine.reduce((sum, s) => sum + s.price * s.booked, 0);
  const total = split(gross);
  const bookings = mine.reduce((n, s) => n + s.booked, 0);

  // A "what if" calculator: fans on the app, how many pay, and the price.
  const [fans, setFans] = useState(100);
  const [paying, setPaying] = useState(25);
  const [price, setPrice] = useState(40);
  const whatIf = split(paying * price);

  return (
    <Screen edges={['bottom']}>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>YOU’VE EARNED</Text>
        <Text style={styles.heroValue}>{euro(total.coach)}</Text>
        <Text style={styles.heroSub}>
          from {bookings} booking{bookings === 1 ? '' : 's'} across {mine.length} session{mine.length === 1 ? '' : 's'}
        </Text>
      </View>

      <Label>How it’s split</Label>
      <SplitBox gross={gross} note="all bookings" />
      <Body muted style={{ marginTop: space.sm }}>
        As a {ROLES.coach.name} you keep 80% of every booking. Mile Club keeps 20% to run the app, find you clients and
        handle payments.
      </Body>

      <Label>Per session</Label>
      {mine.length === 0 ? (
        <Card>
          <Body muted>No sessions yet. Host your first one and your earnings will show up here.</Body>
          <View style={{ height: space.md }} />
          <Button title="+ HOST A SESSION" variant="secondary" onPress={() => router.push('/host-session')} />
        </Card>
      ) : (
        mine.map((s) => {
          const p = split(s.price * s.booked);
          return (
            <Card key={s.id} onPress={() => router.push(`/session/${s.id}`)}>
              <Text style={styles.sTitle}>{s.title}</Text>
              <Text style={styles.sMeta}>
                {friendlyDate(s.date)} · {s.booked}/{s.spots} booked × {euro(s.price)}
              </Text>
              <View style={styles.sRow}>
                <Text style={styles.sYou}>You get {euro(p.coach)}</Text>
                <Text style={styles.sFee}>Mile Club {euro(p.fee)}</Text>
              </View>
            </Card>
          );
        })
      )}

      <Label>What could I earn?</Label>
      <Card>
        <Text style={styles.calcQ}>Fans who follow you on Mile Club</Text>
        <Chips>
          {[50, 100, 500, 1000].map((n) => (
            <Chip key={n} label={`${n}`} selected={fans === n} onPress={() => { setFans(n); setPaying(Math.min(paying, n)); }} />
          ))}
        </Chips>
        <Text style={styles.calcQ}>How many of them pay</Text>
        <Chips>
          {[10, 25, 50, 100].filter((n) => n <= fans).map((n) => (
            <Chip key={n} label={`${n}`} selected={paying === n} onPress={() => setPaying(n)} />
          ))}
        </Chips>
        <Text style={styles.calcQ}>Price per person</Text>
        <Chips>
          {[10, 20, 40, 80].map((n) => (
            <Chip key={n} label={euro(n)} selected={price === n} onPress={() => setPrice(n)} />
          ))}
        </Chips>
        <View style={styles.calcResult}>
          <Text style={styles.calcLine}>
            {paying} of {fans} fans × {euro(price)} = {euro(whatIf.gross)}
          </Text>
          <Text style={styles.calcBig}>You keep {euro(whatIf.coach)}</Text>
          <Text style={styles.calcSmall}>Mile Club’s 20%: {euro(whatIf.fee)}</Text>
        </View>
      </Card>

      <View style={styles.demo}>
        <Text style={styles.demoText}>🧪 Test mode: bookings and money here are pretend. Real payouts come later.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: space.xl, alignItems: 'center' },
  heroKicker: { color: colors.peach, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroValue: { color: '#fff', fontSize: 48, fontWeight: '900', marginTop: 4 },
  heroSub: { color: '#fff', opacity: 0.7, fontSize: 14, fontWeight: '600' },
  sTitle: { fontSize: 16, fontWeight: '800', color: colors.ink },
  sMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  sRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.sm },
  sYou: { fontSize: 15, fontWeight: '900', color: colors.accent },
  sFee: { fontSize: 14, fontWeight: '700', color: colors.purple },
  calcQ: { fontSize: 14, fontWeight: '800', color: colors.ink, marginTop: space.md, marginBottom: space.sm },
  calcResult: { marginTop: space.lg, backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: space.lg },
  calcLine: { fontSize: 14, color: colors.ink, fontWeight: '600' },
  calcBig: { fontSize: 26, fontWeight: '900', color: colors.accent, marginTop: 4 },
  calcSmall: { fontSize: 13, fontWeight: '700', color: colors.purple, marginTop: 2 },
  demo: { backgroundColor: colors.bg, borderRadius: radius.md, padding: space.md, marginTop: space.md, borderWidth: 1, borderColor: colors.line },
  demoText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
});
