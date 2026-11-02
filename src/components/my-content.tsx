import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { ActivityCard } from '@/components/activity-card';
import { FEED, TEXT_POSTS } from '@/data/feed';
import { findPerson } from '@/data/people';
import { agoLabel } from '@/data/comments';
import { openPostActions } from '@/lib/post-actions';
import { useStore, type MyPost } from '@/state/store';
import { colors, fonts, radius, space, themed } from '@/theme';

const TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'activity', label: 'Activity' },
  { id: 'archived', label: 'Archived' },
] as const;

// On your own profile: your posts, what you've done, and posts you've archived.
export function MyContent() {
  const { myPosts, activities, comments, kudos, archivePost, deletePost } = useStore();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('posts');
  const { width } = useWindowDimensions();
  const tileW = Math.floor((Math.min(width, 500) - 32 - 4) / 3);

  const live = myPosts.filter((p) => !p.archived);
  const archived = myPosts.filter((p) => p.archived);
  const myRuns = activities.filter((a) => a.hostId === 'me' || a.participants.includes('me'));
  const myComments = Object.entries(comments).flatMap(([postId, list]) =>
    list.filter((c) => c.authorId === 'me').map((c) => ({ ...c, postId })),
  ).sort((a, b) => b.at - a.at);

  const tile = (p: MyPost) => (
    <Pressable key={p.id} style={[styles.tile, { width: tileW, height: Math.round(tileW * 1.25) }]} onPress={() => openPostActions(p, { archivePost, deletePost })}>
      {p.uri ? (
        <Image source={{ uri: p.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <Text style={styles.tileText} numberOfLines={6}>{p.caption}</Text>
      )}
      <View style={styles.dots}>
        <Text style={styles.dotsText}>•••</Text>
      </View>
    </Pressable>
  );

  function postName(postId: string) {
    const f = FEED.find((x) => x.id === postId) ?? TEXT_POSTS.find((x) => x.id === postId);
    if (f) return `${findPerson(f.personId)?.firstName ?? 'Someone'}’s post`;
    return 'your post';
  }

  return (
    <View style={{ marginTop: space.lg }}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable key={t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabOn]}>
            <Text style={[styles.tabText, tab === t.id && { color: colors.ink, fontFamily: fonts.sansBold }]}>
              {t.label}
              {t.id === 'posts' ? ` · ${live.length}` : t.id === 'archived' && archived.length ? ` · ${archived.length}` : ''}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'posts' ? (
        live.length ? (
          <>
            <View style={styles.grid}>{live.map(tile)}</View>
            <Text style={styles.hint}>Tap a post to edit, archive or delete it.</Text>
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>You haven’t posted yet.</Text>
            <Pressable style={styles.cta} onPress={() => router.push('/new-post' as Href)}>
              <Text style={styles.ctaText}>Share your first post</Text>
            </Pressable>
          </View>
        )
      ) : null}

      {tab === 'activity' ? (
        <View style={{ gap: space.sm }}>
          <View style={styles.statsRow}>
            <Stat n={myRuns.length} label="runs" />
            <Stat n={live.length} label="posts" />
            <Stat n={myComments.length} label="comments" />
            <Stat n={kudos.length} label="likes" />
          </View>
          {myRuns.length ? <Text style={styles.section}>YOUR RUNS</Text> : null}
          {myRuns.map((a) => (
            <ActivityCard key={a.id} activity={a} />
          ))}
          {myComments.length ? <Text style={styles.section}>YOUR COMMENTS</Text> : null}
          {myComments.slice(0, 10).map((c) => (
            <View key={c.id} style={styles.row}>
              <Text style={styles.rowText} numberOfLines={2}>
                <Text style={{ fontFamily: fonts.sansSemi }}>On {postName(c.postId)}: </Text>
                {c.text}
              </Text>
              <Text style={styles.rowTime}>{agoLabel(c.at)}</Text>
            </View>
          ))}
          {!myRuns.length && !myComments.length ? <Text style={styles.emptyText}>Join a run or comment on a post and it shows up here.</Text> : null}
        </View>
      ) : null}

      {tab === 'archived' ? (
        <View style={{ gap: space.sm }}>
          <Text style={styles.hint}>🔒 Only you can see archived posts. They’re hidden from For You.</Text>
          {archived.length === 0 ? <Text style={styles.emptyText}>Nothing archived.</Text> : null}
          {archived.map((p) => (
            <View key={p.id} style={styles.archRow}>
              {p.uri ? <Image source={{ uri: p.uri }} style={styles.archImg} contentFit="cover" /> : <View style={[styles.archImg, styles.archTextImg]}><Text style={{ fontSize: 18 }}>💬</Text></View>}
              <Text style={styles.rowText} numberOfLines={2}>{p.caption || 'Photo'}</Text>
              <Pressable onPress={() => archivePost(p.id, false)} style={styles.small}>
                <Text style={styles.smallText}>Restore</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert('Delete this post?', 'This can’t be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => deletePost(p.id) },
                  ])
                }
                hitSlop={8}>
                <Text style={{ color: colors.danger, fontSize: 16 }}>🗑</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statN}>{n}</Text>
      <Text style={styles.statL}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: space.md },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -1 },
  tabOn: { borderBottomColor: colors.ink },
  tabText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  tile: { backgroundColor: colors.sand, overflow: 'hidden', justifyContent: 'center', borderRadius: 4 },
  tileText: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 16, padding: 8, color: colors.ink },
  dots: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 8, paddingHorizontal: 5 },
  dotsText: { color: '#fff', fontSize: 10, fontFamily: fonts.sansBold },
  hint: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: space.sm },
  empty: { alignItems: 'center', gap: space.md, paddingVertical: space.xl },
  emptyText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, textAlign: 'center' },
  cta: { backgroundColor: colors.olive, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 18 },
  ctaText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.onBrand },
  statsRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.lg, paddingVertical: space.md },
  statN: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  statL: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  section: { fontFamily: fonts.sansSemi, fontSize: 11, letterSpacing: 1.5, color: colors.muted, marginTop: space.md },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, padding: space.md },
  rowText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  rowTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  archRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.md, padding: space.sm },
  archImg: { width: 48, height: 48, borderRadius: 8 },
  archTextImg: { backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  small: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingVertical: 6, paddingHorizontal: 12 },
  smallText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.ink },
}));
