import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button, Chip, Chips } from '@/components/ui';
import { faceFor } from '@/data/faces';
import { ACTIVITIES, type ActivityId } from '@/data/options';
import { PEOPLE } from '@/data/people';
import { friendlyDate } from '@/lib/format';
import { CORNER_MIN, useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Private session (Yana, 2026-11-21): only the friends you invite can see it, it never shows
// on Explore. When everyone says yes and there are 4+ people, a group chat opens for them.
function nextDays(n: number) {
  const pad = (x: number) => String(x).padStart(2, '0');
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
}
const TIMES = ['07:00', '08:00', '09:00', '10:00', '12:00', '12:30', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

export default function PrivateSessionScreen() {
  useTheme();
  const insets = useSafeAreaInsets();
  const { profile, following, blocked, createPrivate, privateSessions } = useStore();
  const [type, setType] = useState<ActivityId | undefined>(profile?.activities[0]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>();
  const [time, setTime] = useState<string>();
  const [place, setPlace] = useState('');
  const [invited, setInvited] = useState<string[]>([]);

  // Friends first (people you follow), then everyone else you've met on Mile Club.
  const people = PEOPLE.filter((p) => !blocked.includes(p.id)).sort((a, b) => Number(following.includes(b.id)) - Number(following.includes(a.id)));
  const ready = type && title.trim() && date && time && place.trim() && invited.length > 0;
  const total = invited.length + 1;

  function toggle(id: string) {
    setInvited((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  }

  function create() {
    if (!ready) return;
    const ps = createPrivate({ type, title: title.trim(), date, time, place: place.trim(), invited });
    router.replace(`/private/${ps.id}` as Href);
  }

  const input = (value: string, onChange: (t: string) => void, placeholder: string) => (
    <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.input} />
  );

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 120, paddingHorizontal: 20 }} keyboardShouldPersistTaps="handled">
        <View style={styles.top}>
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Private session</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.note}>
          <Feather name="lock" size={16} color={colors.ink} />
          <Text style={styles.noteText}>Only the friends you invite can see this. It won’t show on Explore.</Text>
        </View>

        {privateSessions?.length ? (
          <>
            <Text style={styles.label}>Your private sessions</Text>
            {privateSessions.map((ps) => {
              const yes = ps.invited.filter((p) => ps.answers[p] === 'accepted').length;
              return (
                <Pressable key={ps.id} style={styles.mine} onPress={() => router.push(`/private/${ps.id}` as Href)}>
                  <Text style={{ fontSize: 22 }}>{ACTIVITIES.find((a) => a.id === ps.type)?.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mineTitle}>{ps.title}</Text>
                    <Text style={styles.mineSub}>{friendlyDate(ps.date)} {ps.time} · {yes}/{ps.invited.length} said yes</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              );
            })}
            <Text style={[styles.label, { marginTop: 30 }]}>Make a new one</Text>
          </>
        ) : null}

        <Text style={styles.label}>Activity</Text>
        <Chips>
          {ACTIVITIES.map((a) => <Chip key={a.id} label={`${a.emoji} ${a.label}`} selected={type === a.id} onPress={() => setType(a.id)} />)}
        </Chips>
        <Text style={styles.label}>Name it</Text>
        {input(title, setTitle, 'e.g. Saturday padel with the girls')}
        <Text style={styles.label}>Day</Text>
        <Chips>
          {nextDays(10).map((d) => <Chip key={d} label={friendlyDate(d)} selected={date === d} onPress={() => setDate(d)} />)}
        </Chips>
        <Text style={styles.label}>Time</Text>
        <Chips>
          {TIMES.map((t) => <Chip key={t} label={t} selected={time === t} onPress={() => setTime(t)} />)}
        </Chips>
        <Text style={styles.label}>Where</Text>
        {input(place, setPlace, 'e.g. Padel Club Oost')}

        <Text style={styles.label}>Invite friends · {invited.length} picked</Text>
        <Text style={styles.hint}>
          {total >= CORNER_MIN
            ? `Once everyone says yes, you’ll all get a group chat: ${profile?.firstName ?? 'Your'}’s Corner.`
            : `Invite ${CORNER_MIN - total} more to get a group chat for the session (${CORNER_MIN}+ people).`}
        </Text>
        {people.map((p) => {
          const on = invited.includes(p.id);
          return (
            <Pressable key={p.id} style={styles.person} onPress={() => toggle(p.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Invite ${p.firstName}`}>
              <Avatar name={p.firstName} color={p.color} uri={faceFor(p.id)?.photo} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.pName}>{p.firstName}</Text>
                <Text style={styles.pSub} numberOfLines={1}>{following.includes(p.id) ? 'Friend · ' : ''}{faceFor(p.id)?.work ?? p.neighborhood}</Text>
              </View>
              <View style={[styles.box, on && styles.boxOn]}>{on ? <Feather name="check" size={15} color={colors.onMine} /> : null}</View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title={invited.length ? `Send ${invited.length} invite${invited.length === 1 ? '' : 's'}` : 'Send invites'} variant="alt" onPress={create} disabled={!ready} />
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  note: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: 16, padding: 14 },
  noteText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 19, color: colors.ink },
  label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: 22, marginBottom: 10 },
  hint: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.muted, marginTop: -4, marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line },
  pName: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  pSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  box: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: colors.mine, borderColor: colors.mine },
  mine: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 8 },
  mineTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  mineSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
}));
