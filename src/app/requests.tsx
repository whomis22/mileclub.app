import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Body, Button, Card, Label, Screen } from '@/components/ui';
import { findPerson } from '@/data/people';
import { euro, split } from '@/data/roles';
import { friendlyDate } from '@/lib/format';
import { useStore, type IncomingRequest } from '@/state/store';
import { colors, space } from '@/theme';

export default function Requests() {
  const { incoming, sessions, respond } = useStore();
  const pending = incoming.filter((r) => r.status === 'pending');
  const done = incoming.filter((r) => r.status !== 'pending');

  const row = (r: IncomingRequest, actions: boolean) => {
    const p = findPerson(r.personId);
    const s = sessions.find((x) => x.id === r.sessionId);
    if (!p || !s) return null;
    return (
      <Card key={r.id}>
        <View style={styles.row}>
          <Avatar name={p.firstName} color={p.color} size={48} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{p.firstName}, {p.age}</Text>
            <Text style={styles.meta} numberOfLines={1}>
              {s.title} · {friendlyDate(s.date)} {s.time}
            </Text>
            <Text style={styles.meta}>{p.level} · {p.experience}</Text>
          </View>
          {!actions && (
            <Badge label={r.status === 'accepted' ? 'ACCEPTED' : 'DECLINED'} tone={r.status === 'accepted' ? 'green' : 'plain'} />
          )}
        </View>
        {r.note ? <Text style={styles.note}>“{r.note}”</Text> : null}
        {actions && (
          <>
            <Text style={styles.pay}>Pays {euro(s.price)} · you’d get {euro(split(s.price).coach)}</Text>
            <View style={styles.btns}>
              <Button title="Decline" variant="ghost" style={{ flex: 1 }} onPress={() => respond(r.id, 'declined')} />
              <Button title="Accept" variant="secondary" style={{ flex: 1 }} onPress={() => respond(r.id, 'accepted')} />
            </View>
          </>
        )}
      </Card>
    );
  };

  return (
    <Screen edges={['bottom']}>
      <Body muted>
        People ask to join your sessions here. They’re only charged when you accept. If you decline, they aren’t charged.
      </Body>
      <Label>Waiting for you · {pending.length}</Label>
      {pending.length ? (
        pending.map((r) => row(r, true))
      ) : (
        <Card>
          <Body muted>No new requests right now.</Body>
          <View style={{ height: space.md }} />
          <Button title="+ HOST A SESSION" variant="secondary" onPress={() => router.push('/host-session')} />
        </Card>
      )}
      {done.length > 0 && (
        <>
          <Label>Answered</Label>
          {done.map((r) => row(r, false))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { fontSize: 17, fontWeight: '800', color: colors.ink },
  meta: { fontSize: 13, color: colors.muted, marginTop: 1 },
  note: { fontSize: 15, color: colors.ink, fontStyle: 'italic', marginTop: space.md },
  pay: { fontSize: 13, fontWeight: '700', color: colors.link, marginTop: space.md },
  btns: { flexDirection: 'row', gap: space.sm, marginTop: space.md },
});
