import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import type { Activity } from '@/data/types';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Schedule / Events, copied from Yana's design board (2026-11-21).
// Dark board: "My Events | Explore". Light board: "Upcoming | Past".
const un = (id: string) => `https://images.unsplash.com/photo-${id}?w=200&h=200&fit=crop&q=70`;
const THUMB: Record<string, string> = {
  running: un('1552674605-db6ffd4facb5'),
  gym: un('1534438327276-14e5300c3a48'),
  strength: un('1517836357463-d25dfeac3438'),
  yoga: un('1544367567-0f2fcb009e0b'),
  pilates: un('1571019613454-1cb2f99b2d8b'),
  tennis: un('1612534847738-b3af9bc31f0c'),
  cycling: un('1517649763962-0c623066013b'),
  hiking: un('1511632765486-a01980e01a18'),
  other: un('1599058917212-d750089bc07e'),
};

const when = (a: Activity) => `${friendlyDate(a.date)}, ${a.time}`;

export default function Events() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { activities, join, runStatus } = useStore();
  const [tab, setTab] = useState(0);
  const labels = isDark ? ['My Events', 'Explore'] : ['Upcoming', 'Past'];
  const today = new Date().toISOString().slice(0, 10);
  const byTime = (x: Activity, y: Activity) => (x.date + x.time).localeCompare(y.date + y.time);
  const mine = activities.filter((a) => a.hostId === 'me' || a.participants.includes('me') || runStatus(a.id));
  const list =
    tab === 0
      ? (mine.length ? mine : activities).filter((a) => a.date >= today).sort(byTime)
      : isDark
      ? activities.filter((a) => a.date >= today).sort(byTime)
      : mine.filter((a) => a.date < today).sort(byTime).reverse();

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: 130, paddingHorizontal: 18 }}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Upcoming Sessions</Text>
        </View>

        <View style={styles.tabs}>
          {labels.map((l, i) => (
            <Pressable key={l} style={[styles.tab, tab === i && styles.tabOn]} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabTextOn]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        {list.length === 0 ? <Text style={styles.empty}>Nothing here yet.</Text> : null}
        {list.map((a, i) => {
          const status = a.hostId === 'me' ? 'host' : a.participants.includes('me') ? 'accepted' : runStatus(a.id);
          const showHead = !isDark && (i === 0 || when(list[i - 1]!) !== when(a));
          return (
            <View key={a.id}>
              {showHead ? <Text style={styles.dayHead}>{when(a)}</Text> : null}
              <Pressable style={styles.card} onPress={() => router.push(`/activity/${a.id}` as Href)}>
                <Image source={{ uri: THUMB[a.type] ?? THUMB.other }} style={styles.thumb} contentFit="cover" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cTitle} numberOfLines={1}>{a.title}</Text>
                  <Text style={styles.cMeta} numberOfLines={1}>{a.location}</Text>
                  {isDark ? <Text style={styles.cMeta}>{when(a)}</Text> : null}
                  <Text style={styles.going}>{a.participants.length} going</Text>
                </View>
                {status ? (
                  <Text style={styles.state}>{status === 'host' ? 'Hosting' : status === 'accepted' ? 'Going' : status === 'pending' ? 'Asked' : 'Declined'}</Text>
                ) : (
                  <Pressable style={styles.join} onPress={() => join(a.id)} hitSlop={6}>
                    <Text style={styles.joinText}>Join</Text>
                  </Pressable>
                )}
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.create, { backgroundColor: isDark ? colors.cta : '#0A0A0A' }, pressed && { opacity: 0.85 }]}
          onPress={() => router.push('/create-activity')}>
          <Text style={[styles.createText, { color: isDark ? '#000' : '#FFF' }]}>Create Event</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: space.md },
  back: { width: 36, height: 40, justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 999, padding: 4, marginBottom: space.md },
  tab: { flex: 1, height: 36, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabOn: { backgroundColor: colors.mine },
  tabText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
  tabTextOn: { color: colors.onMine },
  dayHead: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink, marginTop: 8, marginBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 10, marginBottom: 10 },
  thumb: { width: 64, height: 64, borderRadius: 12, backgroundColor: colors.bg },
  cTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  cMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  going: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink, marginTop: 4 },
  join: { backgroundColor: colors.mine, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 7, alignSelf: 'flex-end' },
  joinText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.onMine },
  state: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.muted, alignSelf: 'flex-end' },
  empty: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 40 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 18, paddingTop: 10, backgroundColor: colors.bg },
  create: { height: 52, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  createText: { fontFamily: fonts.sansBold, fontSize: 16 },
}));
