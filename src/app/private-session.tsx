import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar, Button } from '@/components/ui';
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
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TIMES = ['07:00', '08:00', '09:00', '10:00', '12:00', '12:30', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

export default function PrivateSessionScreen() {
  useTheme();
  const insets = useSafeAreaInsets();
  const { profile, following, blocked, createPrivate, privateSessions } = useStore();
  const [type, setType] = useState<ActivityId | undefined>(profile?.activities[0]);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState<string>(() => nextDays(1)[0]);
  const [time, setTime] = useState<string>();
  const [place, setPlace] = useState('');
  const [invited, setInvited] = useState<string[]>([]);

  // Friends first (people you follow), then everyone else you've met on Mile Club.
  const people = PEOPLE.filter((p) => !blocked.includes(p.id)).sort((a, b) => Number(following.includes(b.id)) - Number(following.includes(a.id)));
  const ready = type && date && time && place.trim() && invited.length > 0;
  const total = invited.length + 1;

  // Your own activities first, then the rest.
  const mineFirst = profile?.activities ?? [];
  const acts = [...ACTIVITIES].sort((a, b) => Number(mineFirst.includes(b.id)) - Number(mineFirst.includes(a.id)));
  const [days] = useState(() => nextDays(14));
  const act = ACTIVITIES.find((a) => a.id === type);
  const autoTitle = act ? `${act.label}${date ? ` · ${date === days[0] ? 'today' : DAYS[new Date(`${date}T12:00:00`).getDay()]}` : ''}` : '';

  function toggle(id: string) {
    setInvited((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id]));
  }

  function create() {
    if (!ready) return;
    const ps = createPrivate({ type, title: title.trim() || autoTitle, date, time, place: place.trim(), invited });
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
          <Feather name="lock" size={13} color={colors.muted} />
          <Text style={styles.noteText}>Only the friends you invite can see it</Text>
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

        {/* Simpler (Yana, 2026-11-22): one row each, swipe for more. Name is optional. */}
        <Text style={styles.label}>What</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.bleed}>
          {acts.map((a) => {
            const on = type === a.id;
            return (
              <Pressable key={a.id} onPress={() => setType(a.id)} style={[styles.act, on && styles.on]} accessibilityLabel={a.label} accessibilityState={{ selected: on }}>
                <Text style={{ fontSize: 24 }}>{a.emoji}</Text>
                <Text style={[styles.actText, on && styles.onText]} numberOfLines={1}>{a.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>When</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.bleed}>
          {days.map((d, i) => {
            const on = date === d;
            const dt = new Date(`${d}T12:00:00`);
            return (
              <Pressable key={d} onPress={() => setDate(d)} style={[styles.day, on && styles.on]} accessibilityLabel={friendlyDate(d)}>
                <Text style={[styles.dayName, on && styles.onText]}>{i === 0 ? 'Today' : DAYS[dt.getDay()]}</Text>
                <Text style={[styles.dayNum, on && styles.onText]}>{dt.getDate()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { marginTop: 10 }]} style={styles.bleed}>
          {TIMES.map((t) => (
            <Pressable key={t} onPress={() => setTime(t)} style={[styles.time, time === t && styles.on]}>
              <Text style={[styles.timeText, time === t && styles.onText]}>{t}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.label}>Where</Text>
        {input(place, setPlace, 'e.g. Padel Club Oost')}

        <Text style={styles.label}>Invite friends{invited.length ? ` · ${invited.length}` : ''}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.row, { gap: 14 }]} style={styles.bleed}>
          {people.map((p) => {
            const on = invited.includes(p.id);
            return (
              <Pressable key={p.id} style={styles.friend} onPress={() => toggle(p.id)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Invite ${p.firstName}`}>
                <View style={[styles.ring, on && styles.ringOn]}>
                  <Avatar name={p.firstName} color={p.color} uri={faceFor(p.id)?.photo} size={52} />
                  {on ? <View style={styles.tick}><Feather name="check" size={12} color="#000" /></View> : null}
                </View>
                <Text style={styles.friendName} numberOfLines={1}>{p.firstName}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Text style={styles.hint}>
          {total >= CORNER_MIN ? 'Everyone gets a group chat once they say yes.' : `Invite ${CORNER_MIN - total} more to get a group chat.`}
        </Text>

        <Text style={styles.label}>Name <Text style={styles.optional}>(optional)</Text></Text>
        {input(title, setTitle, autoTitle || 'e.g. Saturday padel with the girls')}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button title={invited.length ? `Send ${invited.length} invite${invited.length === 1 ? '' : 's'}` : 'Send invites'} variant="alt" onPress={create} disabled={!ready} />
      </View>
    </View>
  );
}

const LIME = '#B9E769';

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  note: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -6 },
  noteText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  bleed: { marginHorizontal: -20 },
  row: { paddingHorizontal: 20, gap: 8 },
  on: { backgroundColor: LIME },
  onText: { color: '#000' },
  act: { width: 82, height: 82, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 4 },
  actText: { fontFamily: fonts.sansSemi, fontSize: 11.5, color: colors.ink },
  day: { width: 54, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.card, alignItems: 'center' },
  dayName: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  dayNum: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink, marginTop: 2 },
  time: { height: 38, paddingHorizontal: 16, borderRadius: 19, backgroundColor: colors.card, justifyContent: 'center' },
  timeText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  friend: { width: 62, alignItems: 'center' },
  ring: { borderWidth: 2.5, borderColor: 'transparent', borderRadius: 32, padding: 2 },
  ringOn: { borderColor: LIME },
  tick: { position: 'absolute', right: -2, bottom: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.bg },
  friendName: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink, marginTop: 5 },
  optional: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: 22, marginBottom: 10 },
  hint: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 17, color: colors.muted, marginTop: 10 },
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
