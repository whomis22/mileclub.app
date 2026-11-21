import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Avatar, Screen } from '@/components/ui';
import { activityInfo, cityOf } from '@/data/options';
import { openPostActions } from '@/lib/post-actions';
import { firstSet, SET_SIZE } from '@/lib/ticks';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Profile, copied from Yana's design board (2026-11-21): photo with a lime ring,
// name + tick, city, Posts / Friends / Clubs, a short bio, Edit Profile,
// then Posts / Stats / Achievements.
const TABS = ['Posts', 'Stats', 'Achievements'] as const;

export default function ProfileTab() {
  useTheme();
  const { profile, activities, following, myPosts, archivePost, deletePost, comments, planJoins } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Posts');
  const { width } = useWindowDimensions();
  if (!profile) return null;

  const live = myPosts.filter((p) => !p.archived);
  const archived = myPosts.filter((p) => p.archived).length;
  const going = activities.filter((a) => a.participants.includes('me')).length;
  const hosting = activities.filter((a) => a.hostId === 'me').length;
  const clubs = new Set(activities.filter((a) => a.participants.includes('me') || a.hostId === 'me').map((a) => a.type)).size;
  const city = profile.city ?? cityOf(profile.neighborhood) ?? profile.neighborhood;
  const bio = `${profile.activities.slice(0, 3).map((a) => activityInfo(a).label).join('. ')}. Repeat.`;
  const tile = Math.floor((Math.min(width, 500) - 32 - 6) / 3);
  const ticks = firstSet({ profile, myPosts, comments, activities, planJoins: planJoins ?? [] });
  const done = ticks.filter((t) => t.done).length;
  const setOneDone = done >= SET_SIZE;
  // The blue tick is earned by finishing both sets of 10 (Yana, 2026-11-21). Set 2 isn't out yet.
  const verified = false;

  return (
    <Screen>
      <View style={styles.topRow}>
        <Pressable style={styles.gear} onPress={() => router.push('/settings' as Href)} accessibilityLabel="Settings">
          <Ionicons name="settings-outline" size={22} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.head}>
        <View style={styles.ring}>
          <Avatar name={profile.firstName} uri={profile.photoUri} size={92} />
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.firstName}</Text>
          {verified ? <Ionicons name="checkmark-circle" size={18} color="#3B82F6" /> : null}
        </View>
        <Text style={styles.city}>{city}</Text>
      </View>

      <View style={styles.stats}>
        <Stat n={live.length} label="Posts" />
        <Stat n={following.length} label="Friends" onPress={() => router.push('/people' as Href)} />
        <Stat n={clubs} label="Clubs" onPress={() => router.push('/activities' as Href)} />
      </View>

      <Text style={styles.bio}>
        {bio} <Ionicons name="heart-outline" size={14} color={colors.ink} />
      </Text>

      <Pressable
        style={({ pressed }) => [styles.edit, pressed && { opacity: 0.8 }]}
        onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } })}>
        <Text style={styles.editText}>Edit Profile</Text>
      </Pressable>

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t}</Text>
            <View style={[styles.tabLine, tab === t && styles.tabLineOn]} />
          </Pressable>
        ))}
      </View>

      {tab === 'Posts' ? (
        live.length ? (
          <View style={styles.grid}>
            {live.map((p) => (
              <Pressable key={p.id} style={[styles.tile, { width: tile, height: tile }]} onPress={() => openPostActions(p, { archivePost, deletePost })}>
                {p.uri ? (
                  <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Text style={styles.tileText} numberOfLines={5}>{p.caption}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Feather name="camera" size={28} color={colors.muted} />
            <Text style={styles.emptyText}>Share your first post</Text>
            <Pressable style={styles.share} onPress={() => router.push('/new-post' as Href)}>
              <Text style={styles.shareText}>Create a post</Text>
            </Pressable>
          </View>
        )
      ) : null}
      {tab === 'Posts' && archived ? (
        <Text style={styles.archived}>{archived} archived · tap a post to edit, archive or delete it</Text>
      ) : null}

      {tab === 'Stats' ? (
        <View style={styles.statGrid}>
          <StatCard icon="calendar" n={going} label="Plans joined" />
          <StatCard icon="flag" n={hosting} label="Plans hosted" />
          <StatCard icon="activity" n={profile.activities.length} label="Sports" />
          <StatCard icon="users" n={following.length} label="Friends" />
        </View>
      ) : null}

      {tab === 'Achievements' ? (
        <View style={{ marginTop: space.md }}>
          <View style={styles.setCard}>
            <View style={styles.setTop}>
              <Text style={styles.setTitle}>Set 1</Text>
              <Text style={styles.setCount}>{done}/{SET_SIZE} ticks</Text>
            </View>
            <View style={styles.bar}><View style={[styles.barFill, { width: `${(done / SET_SIZE) * 100}%` }]} /></View>
            <View style={styles.reward}>
              <Text style={{ fontSize: 18 }}>🎾</Text>
              <Text style={styles.rewardText}>
                {setOneDone ? 'Unlocked: one free padel or pilates session!' : 'Finish all 10 for a free padel or pilates session'}
              </Text>
            </View>
          </View>

          <View style={{ gap: 8, marginTop: 12 }}>
            {ticks.map((t, i) => (
              <View key={t.id} style={[styles.badge, t.soon && { opacity: 0.5 }]}>
                <View style={[styles.tickNum, t.done && styles.tickNumOn]}>
                  {t.done ? <Feather name="check" size={18} color={colors.onMine} /> : <Text style={styles.tickNumText}>{i + 1}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.badgeTitle}>{t.title}</Text>
                  <Text style={styles.badgeSub}>{t.hint}</Text>
                  {t.progress && !t.done ? (
                    <View style={[styles.bar, { height: 4, marginTop: 6 }]}><View style={[styles.barFill, { width: `${(t.progress[0] / t.progress[1]) * 100}%` }]} /></View>
                  ) : null}
                </View>
                <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={20} color={t.done ? colors.ink : colors.muted} />
              </View>
            ))}
          </View>

          <View style={[styles.setCard, { marginTop: 16, opacity: setOneDone ? 1 : 0.6 }]}>
            <View style={styles.setTop}>
              <Text style={styles.setTitle}>Set 2</Text>
              <Feather name="lock" size={16} color={colors.muted} />
            </View>
            <View style={styles.reward}>
              <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
              <Text style={styles.rewardText}>Unlocks after set 1. Finish it to earn your blue tick.</Text>
            </View>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function Stat({ n, label, onPress }: { n: number; label: string; onPress?: () => void }) {
  useTheme();
  return (
    <Pressable style={styles.stat} onPress={onPress} disabled={!onPress}>
      <Text style={styles.statNum}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Pressable>
  );
}

function StatCard({ icon, n, label }: { icon: keyof typeof Feather.glyphMap; n: number; label: string }) {
  useTheme();
  return (
    <View style={styles.statCard}>
      <Feather name={icon} size={18} color={colors.link} />
      <Text style={styles.statCardNum}>{n}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  gear: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center', marginTop: -8 },
  ring: { borderWidth: 3, borderColor: colors.cta, borderRadius: 56, padding: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  name: { fontSize: 22, fontFamily: fonts.sansBold, color: colors.ink },
  city: { fontSize: 13, fontFamily: fonts.sans, color: colors.muted, marginTop: 3 },
  stats: { flexDirection: 'row', marginTop: space.lg },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.ink },
  statLabel: { fontSize: 12, fontFamily: fonts.sans, color: colors.muted, marginTop: 2 },
  bio: { textAlign: 'center', fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink, marginTop: space.lg },
  edit: { height: 46, borderRadius: 999, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginTop: space.md },
  editText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  tabs: { flexDirection: 'row', marginTop: space.lg },
  tab: { flex: 1, alignItems: 'center' },
  tabText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.muted, paddingBottom: 8 },
  tabTextOn: { fontFamily: fonts.sansBold, color: colors.ink },
  tabLine: { height: 1, alignSelf: 'stretch', backgroundColor: colors.line },
  tabLineOn: { height: 2, backgroundColor: colors.purple },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, marginTop: 3 },
  tile: { backgroundColor: colors.card, overflow: 'hidden', justifyContent: 'center', padding: 8 },
  tileText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
  empty: { alignItems: 'center', gap: 10, paddingVertical: space.xl },
  emptyText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  share: { backgroundColor: colors.cta, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 11 },
  shareText: { fontFamily: fonts.sansBold, fontSize: 14, color: '#000' },
  archived: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: space.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: space.md },
  statCard: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: 18, padding: space.md, gap: 4 },
  statCardNum: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.ink, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: 18, padding: space.md },
  setCard: { backgroundColor: colors.card, borderRadius: 20, padding: space.md },
  setTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setTitle: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink },
  setCount: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.bg, overflow: 'hidden', marginTop: 10 },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.mine },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  rewardText: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 13.5, lineHeight: 19, color: colors.ink },
  tickNum: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  tickNumOn: { backgroundColor: colors.mine, borderColor: colors.mine },
  tickNumText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.muted },
  badgeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  badgeTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  badgeSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },
}));
