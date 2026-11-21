import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DAY, SessionCard, sessionLabel, sessionsThisWeek, startOfToday, type Session } from '@/components/session-cards';
import { Avatar, BrandTile, MenuButton, Screen } from '@/components/ui';
import { faceFor } from '@/data/faces';
import { THREADS } from '@/data/messages';
import { findPerson } from '@/data/people';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Messages (Yana, 2026-11-22): a week calendar on top (dots on days with plans), then
// this week's sessions as activity photo cards, then the normal chats.

export default function Messages() {
  useTheme();
  const { blocked, corners = [], privateSessions = [], planJoins = [] } = useStore();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);

  const today = startOfToday();
  const week = Array.from({ length: 7 }, (_, i) => new Date(today.getTime() + i * 86400000));
  const sessions = sessionsThisWeek(corners, privateSessions, planJoins);
  const shown = picked === null ? sessions : sessions.filter((s) => s.day === picked);
  const inCards = new Set(sessions.map((s) => s.key));
  const label = (s: Session) => sessionLabel(s);

  const q = query.trim().toLowerCase();
  const list = [...corners.filter((c) => !inCards.has(c.id)), ...THREADS]
    .filter((t) => !t.personId || !blocked.includes(t.personId))
    .filter((t) => t.name.toLowerCase().includes(q));

  return (
    <Screen nothingNew="No new messages">
      <View style={styles.head}>
        <MenuButton onPress={() => router.push('/menu')} />
        <Text style={styles.title}>Messages</Text>
        <Pressable onPress={() => { setSearching(!searching); setQuery(''); }} accessibilityLabel="Search messages" style={styles.round}>
          <Feather name={searching ? 'x' : 'search'} size={18} color={colors.ink} />
        </Pressable>
        <Pressable onPress={() => router.push('/private-session' as Href)} accessibilityLabel="Start a session with friends" style={[styles.round, { backgroundColor: colors.mine }]}>
          <Feather name="plus" size={20} color={colors.onMine} />
        </Pressable>
      </View>

      {searching ? (
        <View style={styles.search}>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search messages" autoFocus returnKeyType="search" autoCapitalize="none" placeholderTextColor={colors.muted} style={styles.searchInput} />
        </View>
      ) : null}

      {!q ? (
        <>
          <View style={styles.week}>
            {week.map((d, i) => {
              const on = picked === i;
              const has = sessions.some((s) => s.day === i);
              return (
                <Pressable key={i} onPress={() => setPicked(on ? null : i)} style={[styles.day, on && styles.dayOn, !on && i === 0 && styles.dayToday]} accessibilityLabel={`Plans on ${DAY[d.getDay()]} ${d.getDate()}`}>
                  <Text style={[styles.dayName, on && styles.dayTextOn]}>{i === 0 ? 'Today' : DAY[d.getDay()]}</Text>
                  <Text style={[styles.dayNum, on && styles.dayTextOn]}>{d.getDate()}</Text>
                  <View style={[styles.dayDot, !has && { opacity: 0 }]} />
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.section}>{picked === null ? 'YOUR PLANS THIS WEEK' : `PLANS ${picked === 0 ? 'TODAY' : `ON ${DAY[week[picked].getDay()].toUpperCase()} ${week[picked].getDate()}`}`}</Text>
          {shown.length ? (
            <>
              <SessionCard s={shown[0]} big label={label(shown[0])} />
              <View style={styles.grid}>
                {shown.slice(1, 3).map((s) => (
                  <View key={s.key} style={styles.gridItem}><SessionCard s={s} label={label(s)} /></View>
                ))}
              </View>
              {shown.length > 3 ? (
                <Pressable onPress={() => router.push((picked === null ? '/plans' : `/plans?day=${picked}`) as Href)} style={({ pressed }) => [styles.seeAll, pressed && { opacity: 0.7 }]} accessibilityLabel="See all plans">
                  <Text style={styles.seeAllText}>See all {shown.length} plans</Text>
                  <Feather name="chevron-right" size={18} color={colors.ink} />
                </Pressable>
              ) : null}
            </>
          ) : (
            <Pressable onPress={() => router.push('/now' as Href)} style={styles.empty}>
              <Feather name="calendar" size={20} color={colors.muted} />
              <View style={{ flex: 1 }}>
                <Text style={styles.emptyTitle}>{picked === null ? 'Nothing planned this week' : 'Nothing planned that day'}</Text>
                <Text style={styles.emptySub}>Find something to join on Explore</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.muted} />
            </Pressable>
          )}
        </>
      ) : null}

      <Text style={styles.section}>MESSAGES</Text>
      {list.map((t, i) => {
        const last = t.messages[t.messages.length - 1];
        const person = t.personId ? findPerson(t.personId) : undefined;
        return (
          <Pressable
            key={t.id}
            onPress={() => router.push(`/chat/${t.id}`)}
            style={({ pressed }) => [styles.row, i < list.length - 1 && styles.rowLine, pressed && { opacity: 0.6 }]}>
            {t.sessionId ? (
              <View style={[styles.groupIcon, { backgroundColor: colors.mine }]}>
                <Feather name="users" size={20} color={colors.onMine} />
              </View>
            ) : t.kind === 'group' ? (
              <BrandTile size={50} />
            ) : (
              <Avatar name={t.name} color={person?.color} uri={t.personId ? faceFor(t.personId)?.photo : undefined} size={50} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={[styles.last, t.unread && styles.lastUnread]} numberOfLines={1}>
                {last.from === 'me' ? 'You: ' : t.kind === 'group' && last.from === 'admin' ? 'Mile Club: ' : ''}
                {last.text}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.time}>{t.time}</Text>
              {t.unread ? <View style={styles.dot} /> : null}
            </View>
          </Pressable>
        );
      })}
      {!list.length ? <Text style={styles.last}>No chats found</Text> : null}
    </Screen>
  );
}

const LIME = '#B9E769';

const styles = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 30, color: colors.ink },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  search: { marginTop: space.lg, height: 44, borderRadius: radius.pill, backgroundColor: colors.sand, paddingHorizontal: space.lg, justifyContent: 'center' },
  searchInput: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: space.lg },
  day: { width: 44, alignItems: 'center', paddingVertical: 8, borderRadius: 16 },
  dayOn: { backgroundColor: colors.ink },
  dayToday: { backgroundColor: colors.sand },
  dayName: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted },
  dayNum: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink, marginTop: 3 },
  dayTextOn: { color: colors.bg },
  dayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: LIME, marginTop: 5 },
  section: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, marginTop: space.xl, marginBottom: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  gridItem: { width: '48.5%' },
  seeAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 24, backgroundColor: colors.sand, marginTop: 10 },
  seeAllText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  empty: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 16 },
  emptyTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  emptySub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  groupIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  last: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 3 },
  lastUnread: { fontFamily: fonts.sansMedium, color: colors.ink },
  right: { alignItems: 'flex-end', gap: 6, alignSelf: 'flex-start', paddingTop: 4 },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.olive },
}));
