import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Body, Button, Card, Label, Screen } from '@/components/ui';
import { activityInfo } from '@/data/options';
import { PEOPLE, findPerson } from '@/data/people';
import { rankPeople } from '@/lib/matching';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, space, themed, useTheme } from '@/theme';

export default function ActivityDetail() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, profile, toggleJoin, runStatus, runIncoming, respondRun } = useStore();
  const a = activities.find((x) => x.id === id);
  if (!a || !profile) return <Screen edges={[]}><Body>This activity is no longer available.</Body></Screen>;

  const info = activityInfo(a.type);
  const host = a.hostId === 'me' ? null : findPerson(a.hostId);
  const joined = a.participants.includes('me');
  const isHost = a.hostId === 'me';
  const full = a.participants.length >= a.groupSize;
  const status = runStatus(a.id);
  const asking = isHost ? runIncoming.filter((r) => r.activityId === a.id && r.status === 'pending') : [];
  const accepted = isHost ? runIncoming.filter((r) => r.activityId === a.id && r.status === 'accepted') : [];

  return (
    <Screen edges={['bottom']}>
      <Text style={styles.emoji}>{info.emoji}</Text>
      <Text style={styles.when}>
        {friendlyDate(a.date).toUpperCase()} · {a.time}
        {a.recurring ? ` · ${a.recurring.toUpperCase()}` : ''}
      </Text>
      <Text style={styles.title}>{a.title}</Text>
      <View style={styles.badges}>
        <Badge label={a.level.toUpperCase()} tone="plain" />
        {a.distance && <Badge label={a.distance} tone="plain" />}
        {a.pace && <Badge label={a.pace} tone="plain" />}
        <Badge label={a.free ? 'FREE' : 'PAID'} tone={a.free ? 'green' : 'accent'} />
      </View>

      <Label>Where</Label>
      <Body>📍 {a.location}</Body>
      <Body muted>{a.neighborhood}</Body>
      {a.partner && <Body muted>🤝 {a.partner}</Body>}

      <Label>About</Label>
      <Body>{a.description}</Body>

      <Label>Host</Label>
      {host ? (
        <Card onPress={() => router.push(`/person/${host.id}`)} style={styles.hostCard}>
          <Avatar name={host.firstName} color={host.color} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hostName}>{host.firstName}</Text>
            <Text style={styles.hostMeta}>
              {host.isCaptain
                ? `Top host · ${host.sessionsHosted} sessions hosted · ★ ${host.rating}`
                : 'Community member'}
            </Text>
          </View>
        </Card>
      ) : (
        <Body>You’re hosting this one.</Body>
      )}

      <Label>
        Who’s going · {a.participants.length}/{a.groupSize}
      </Label>
      <View style={styles.people}>
        {a.participants.map((pid) => {
          const p = pid === 'me' ? null : findPerson(pid);
          return (
            <View key={pid} style={styles.person}>
              <Avatar
                name={p?.firstName ?? profile.firstName}
                color={p?.color}
                uri={p ? undefined : profile.photoUri}
                size={44}
              />
              <Text style={styles.personName}>{p?.firstName ?? 'You'}</Text>
            </View>
          );
        })}
      </View>

      <View style={{ height: space.xl }} />
      {isHost && asking.length > 0 && (
        <>
          <Label>Asking to join · {asking.length}</Label>
          {asking.map((r) => {
            const p = findPerson(r.personId);
            if (!p) return null;
            return (
              <Card key={r.id} style={styles.hostCard}>
                <Avatar name={p.firstName} color={p.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>{p.firstName}</Text>
                  <Text style={styles.hostMeta}>{p.level} · {p.neighborhood}</Text>
                </View>
                <Pressable onPress={() => respondRun(r.id, 'declined')} style={styles.decline} accessibilityLabel={`Decline ${p.firstName}`}>
                  <Text style={styles.declineText}>✕</Text>
                </Pressable>
                <Pressable onPress={() => respondRun(r.id, 'accepted')} style={styles.accept} accessibilityLabel={`Accept ${p.firstName}`}>
                  <Text style={styles.acceptText}>✓</Text>
                </Pressable>
              </Card>
            );
          })}
        </>
      )}
      {isHost && accepted.length > 0 && (
        <>
          <Label>Accepted · {accepted.length}</Label>
          {accepted.map((r) => {
            const p = findPerson(r.personId);
            if (!p) return null;
            return (
              <Card key={r.id} style={styles.hostCard} onPress={() => router.push(`/person/${p.id}`)}>
                <Avatar name={p.firstName} color={p.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>{p.firstName}</Text>
                  <Text style={styles.hostMeta}>You accepted {p.firstName}</Text>
                </View>
                <Pressable onPress={() => router.push(`/chat/${p.id}` as Href)} style={styles.msgBtn} accessibilityLabel={`Message ${p.firstName}`}>
                  <Text style={styles.msgBtnText}>💬 Message</Text>
                </Pressable>
              </Card>
            );
          })}
        </>
      )}
      {isHost ? (
        <>
          <Label>People who’d be a great fit</Label>
          {rankPeople(
            { ...profile, activities: [a.type], level: a.level, neighborhood: a.neighborhood },
            PEOPLE.filter((p) => p.activities.includes(a.type) && !a.participants.includes(p.id)),
          )
            .slice(0, 3)
            .map(({ person, score }) => (
              <Card key={person.id} onPress={() => router.push(`/person/${person.id}`)} style={styles.hostCard}>
                <Avatar name={person.firstName} color={person.color} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.hostName}>{person.firstName}</Text>
                  <Text style={styles.hostMeta}>
                    {person.level} · {person.neighborhood}
                  </Text>
                </View>
                <Text style={styles.fit}>{score}%</Text>
              </Card>
            ))}
          <Body muted>Invites and group chat are coming next.</Body>
        </>
      ) : (
        <>
          {status === 'pending' && (
            <Card style={styles.statusCard}>
              <Text style={styles.statusTitle}>Waiting for {host?.firstName ?? 'the host'} to accept</Text>
              <Text style={styles.hostMeta}>You can take part once you’re accepted. We’ll let you know.</Text>
              <Pressable onPress={() => router.push(`/suggest?activityId=${a.id}` as Href)}>
                <Text style={styles.linkText}>No answer yet? See others to work out with →</Text>
              </Pressable>
            </Card>
          )}
          {status === 'declined' && (
            <Card style={styles.statusCard}>
              <Text style={styles.statusTitle}>Not accepted this time</Text>
              <Text style={styles.hostMeta}>This run is full or not the right fit. There are plenty of others.</Text>
              <Pressable onPress={() => router.push(`/suggest?activityId=${a.id}` as Href)} style={[styles.msgBtn, { alignSelf: 'flex-start', marginTop: space.sm }]}>
                <Text style={styles.msgBtnText}>Find others to work out with</Text>
              </Pressable>
            </Card>
          )}
          {joined && (
            <Card style={styles.statusCard}>
              <Text style={styles.statusTitle}>You’re in</Text>
              <Text style={styles.hostMeta}>{host?.firstName ?? 'The host'} accepted you. See you at {a.location}.</Text>
              {host ? (
                <Pressable onPress={() => router.push(`/chat/${host.id}` as Href)} style={[styles.msgBtn, { alignSelf: 'flex-start', marginTop: space.sm }]}>
                  <Text style={styles.msgBtnText}>💬 Message {host.firstName}</Text>
                </Pressable>
              ) : null}
            </Card>
          )}
          {status !== 'declined' && (
            <Button
              title={joined ? 'Leave this run' : status === 'pending' ? 'Cancel request' : full ? 'Ask to join the waitlist' : 'Ask to join'}
              variant={joined || status === 'pending' ? 'ghost' : 'secondary'}
              onPress={() => toggleJoin(a.id)}
            />
          )}
        </>
      )}
      <Text style={styles.safety}>
        Meet in the public spot listed above. Trust your gut and leave if anything feels off.
      </Text>
      {!isHost && (
        <Pressable
          onPress={() =>
            Alert.alert('Report activity', 'Thanks for letting us know. Our team will review this activity.')
          }>
          <Text style={styles.report}>Report this activity</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  emoji: { fontSize: 48 },
  when: { fontSize: 13, fontWeight: '800', color: colors.link, letterSpacing: 0.8, marginTop: space.sm },
  title: { fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginTop: 4 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.md },
  hostCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  hostName: { fontSize: 17, fontWeight: '800', color: colors.ink },
  hostMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  people: { flexDirection: 'row', flexWrap: 'wrap', gap: space.lg },
  person: { alignItems: 'center', width: 56 },
  personName: { fontSize: 12, fontWeight: '600', color: colors.ink, marginTop: 4 },
  fit: { fontSize: 18, fontWeight: '900', color: colors.link },
  linkText: { color: colors.link, fontSize: 13, fontWeight: '700', marginTop: 6 },
  msgBtn: { borderRadius: 999, backgroundColor: colors.olive, paddingVertical: 8, paddingHorizontal: 14 },
  msgBtnText: { color: colors.onBrand, fontSize: 13, fontWeight: '700' },
  statusCard: { marginBottom: space.md, gap: 4 },
  statusTitle: { fontSize: 16, fontWeight: '700', color: colors.ink },
  accept: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  acceptText: { color: colors.onBrand, fontSize: 18, fontWeight: '800' },
  decline: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  declineText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  safety: { fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: space.lg, lineHeight: 18 },
  report: { fontSize: 14, fontWeight: '700', color: colors.danger, textAlign: 'center', marginTop: space.lg },
}));
