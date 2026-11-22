import { Image, type ImageContentPosition } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { faceFor } from '@/data/faces';
import type { ChatThread } from '@/data/messages';
import { findPerson } from '@/data/people';
import { PLANS } from '@/data/plans';
import { parseDate } from '@/lib/format';
import type { PrivateSession } from '@/state/store';
import { fonts } from '@/theme';

// This week's plans as photo cards (Messages and the All plans page, Yana 2026-11-22).
export const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export type Session = {
  key: string; title: string; day: number; time: string; sub: string; photo: string | number; pos?: ImageContentPosition;
  people: string[]; unread?: boolean; tag?: string; href: Href; place?: string;
};

// Which Explore photo to use for a private session's activity.
const PHOTO_FOR: Record<string, string> = {
  running: 'x-run', gym: 'x-gym', strength: 'x-gym', pilates: 'x-pilates', yoga: 'x-yoga', cycling: 'x-cycling',
  basketball: 'x-basketball', tennis: 'x-padel', spa: 'x-sauna',
};

export function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Days from today (0 = today) for a plan's "when", e.g. "Tonight 19:00", "Tomorrow 18:30", "Every Sun 19:00".
function dayOffset(when: string) {
  if (/tonight|today/i.test(when)) return 0;
  if (/tomorrow/i.test(when)) return 1;
  const i = DAY.findIndex((d) => when.includes(d));
  if (i < 0) return -1;
  return (i - new Date().getDay() + 7) % 7;
}

export function sessionsThisWeek(corners: ChatThread[], privateSessions: PrivateSession[], planJoins: string[]): Session[] {
  const today = startOfToday().getTime();
  const out: Session[] = [];
  for (const c of corners) {
    const ps = privateSessions.find((p) => p.id === c.sessionId);
    if (!ps) continue;
    const day = Math.round((parseDate(ps.date).getTime() - today) / 86400000);
    if (day < 0 || day > 6) continue;
    const plan = PLANS.find((p) => p.id === (PHOTO_FOR[ps.type] ?? 'x-run'))!;
    const last = c.messages[c.messages.length - 1];
    const who = last?.from === 'admin' ? 'Mile Club: ' : last?.from === 'me' ? 'You: ' : '';
    out.push({
      key: c.id, title: c.name, day, time: ps.time, sub: last ? who + last.text : ps.title, photo: plan.photo, pos: plan.pos,
      people: ps.invited.filter((id) => ps.answers[id] === 'accepted'), unread: c.unread, href: `/chat/${c.id}` as Href, place: ps.place,
    });
  }
  for (const id of planJoins) {
    const p = PLANS.find((x) => x.id === id);
    if (!p) continue;
    const day = dayOffset(p.when);
    if (day < 0) continue;
    out.push({
      key: p.id, title: p.title, day, time: p.when.match(/\d\d:\d\d/)?.[0] ?? '', sub: p.place, photo: p.photo, pos: p.pos,
      people: p.going, href: '/now' as Href, place: p.place,
    });
  }
  return out.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
}

function Faces({ ids }: { ids: string[] }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {ids.slice(0, 4).map((id, i) => (
        <View key={id} style={[styles.faceRing, i > 0 && { marginLeft: -8 }]}>
          <Avatar name={findPerson(id)?.firstName ?? id} color={findPerson(id)?.color} uri={faceFor(id)?.photo} size={22} />
        </View>
      ))}
    </View>
  );
}

export function SessionCard({ s, big, label }: { s: Session; big?: boolean; label: string }) {
  return (
    <Pressable onPress={() => router.push(s.href)} style={({ pressed }) => [styles.card, big ? styles.cardBig : styles.cardSmall, pressed && { opacity: 0.85 }]}>
      <Image source={s.photo} contentFit="cover" contentPosition={s.pos ?? 'center'} style={StyleSheet.absoluteFill} />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} locations={[0.25, 1]} style={StyleSheet.absoluteFill} />
      <Text style={styles.tag}>{label}</Text>
      {s.unread ? <View style={styles.unread} /> : null}
      <View style={styles.cardIn}>
        <Text style={[styles.cardTitle, !big && { fontSize: 15 }]} numberOfLines={1}>{s.title}</Text>
        {big ? <Text style={styles.cardSub} numberOfLines={1}>{s.sub}</Text> : null}
        <View style={styles.goingRow}>
          {big ? <Faces ids={s.people} /> : null}
          <Text style={styles.going}>{s.people.length + 1} going</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function sessionLabel(s: Session) {
  const d = new Date(startOfToday().getTime() + s.day * 86400000);
  return `${s.day === 0 ? 'TODAY' : s.day === 1 ? 'TOMORROW' : DAY[d.getDay()].toUpperCase()} ${s.time}`;
}

const LIME = '#B9E769';
const styles = StyleSheet.create({
  card: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#141414' },
  cardBig: { height: 160 },
  cardSmall: { height: 124 },
  tag: { position: 'absolute', top: 12, left: 12, backgroundColor: LIME, color: '#000', fontFamily: fonts.sansBold, fontSize: 10.5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  unread: { position: 'absolute', top: 14, right: 14, width: 12, height: 12, borderRadius: 6, backgroundColor: LIME, borderWidth: 2, borderColor: '#000' },
  cardIn: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 19, color: '#FFFFFF' },
  cardSub: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  goingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  going: { fontFamily: fonts.sansSemi, fontSize: 12, color: '#FFFFFF' },
  faceRing: { borderRadius: 13, borderWidth: 2, borderColor: 'rgba(0,0,0,0.4)' },
});
