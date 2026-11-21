import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Redirect, router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { CommentPreview, openComments, useComments } from '@/components/comment-preview';
import { CommentsSheet } from '@/components/comments-sheet';
import { Avatar, Logo, Screen } from '@/components/ui';
import { useCity } from '@/lib/use-city';
import { agoLabel } from '@/data/comments';
import { faceFor } from '@/data/faces';
import { cityOf } from '@/data/options';
import { findPerson } from '@/data/people';
import { openPostActions } from '@/lib/post-actions';
import { hoursAgoLabel } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Home feed, copied from Yana's design board (2026-11-21): logo + bell,
// "Create a post...", then posts with text, a photo, likes, comments and save.
const un = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=600&fit=crop&q=70`;

type Post = { id: string; personId: string; handle: string; hoursAgo: number; text: string; photo?: string | number; likes: number };

const POSTS: Post[] = [
  { id: 'b1', personId: 'sanne', handle: 'sannefit', hoursAgo: 2, text: 'Post run in the park 🏃‍♀️\nAnyone down for another run tonight?', photo: require('../../../assets/images/photos/run-london.jpg'), likes: 247 },
  { id: 'b2', personId: 'mateo', handle: 'mateo.padel', hoursAgo: 3, text: 'Padel later? 7pm', photo: require('../../../assets/images/photos/padel.jpg'), likes: 86 },
  { id: 'b3', personId: 'amira', handle: 'amira.flow', hoursAgo: 5, text: 'Lunchtime yoga is the reset I needed. Who wants to join tomorrow? 🧘‍♀️', photo: un('1544367567-0f2fcb009e0b'), likes: 132 },
  { id: 'b4', personId: 'lucas', handle: 'lucas.lifts', hoursAgo: 6, text: 'Leg day done. Looking for a gym buddy at 6pm this week 💪', photo: un('1534438327276-14e5300c3a48'), likes: 64 },
  { id: 'b5', personId: 'femke', handle: 'femke.outdoors', hoursAgo: 8, text: 'Long walk then sauna this Sunday. Who’s in?', likes: 41 },
  { id: 'b6', personId: 'tom', handle: 'tom.sunrise', hoursAgo: 11, text: 'Sunrise run + coffee tomorrow 06:30. All paces welcome ☕', photo: require('../../../assets/images/photos/football.jpg'), likes: 158 },
];

function greeting(h = new Date().getHours()) {
  return h < 5 ? 'Good evening' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// A 40px round button, so every icon at the top lines up on the same centre line.
function Round({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} hitSlop={4} style={({ pressed }) => [styles.round, pressed && { transform: [{ scale: 0.92 }], opacity: 0.8 }]}>
      {children}
    </Pressable>
  );
}

// Heart that pops when you like a post, with a light tap on the phone.
function LikeButton({ liked, count, onPress }: { liked: boolean; count: number; onPress: () => void }) {
  useTheme();
  const [scale] = useState(() => new Animated.Value(1));
  function tap() {
    if (!liked) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      scale.setValue(0.7);
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 160, useNativeDriver: true }).start();
    }
    onPress();
  }
  return (
    <Pressable onPress={tap} style={styles.action} accessibilityLabel={liked ? 'Unlike' : 'Like'} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={liked ? 'heart' : 'heart-outline'} size={21} color={liked ? '#FF4D6D' : colors.ink} />
      </Animated.View>
      <Text style={styles.count}>{count}</Text>
    </Pressable>
  );
}

function PostCard({
  id, name, handle, photoUri, color, when, text, photo, likes, onOpenPerson, onMore,
}: {
  id: string; name: string; handle: string; photoUri?: string; color?: string; when: string; text: string;
  photo?: string | number; likes: number; onOpenPerson?: () => void; onMore?: () => void;
}) {
  useTheme();
  const { kudos, toggleKudos } = useStore();
  const [saved, setSaved] = useState(false);
  const liked = kudos.includes(id);
  const comments = useComments(id).length;
  return (
    <View style={styles.post}>
      <View style={styles.head}>
        <Pressable onPress={onOpenPerson}>
          <Avatar name={name} color={color} uri={photoUri} size={40} />
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={onOpenPerson}>
          <Text style={styles.handle}>{handle}</Text>
          <Text style={styles.meta}>{when}</Text>
        </Pressable>
        <Pressable onPress={onMore} hitSlop={10} accessibilityLabel="More">
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </Pressable>
      </View>
      <Text style={styles.text}>{text}</Text>
      {photo ? (
        <View style={styles.photo}>
          <Image source={typeof photo === 'string' ? { uri: photo } : photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={250} cachePolicy="memory-disk" recyclingKey={id} />
        </View>
      ) : null}
      <View style={styles.actions}>
        <LikeButton liked={liked} count={likes + (liked ? 1 : 0)} onPress={() => toggleKudos(id)} />
        <Pressable onPress={() => openComments(id)} style={styles.action} accessibilityLabel="Comments">
          <Ionicons name="chatbubble-outline" size={19} color={colors.ink} />
          <Text style={styles.count}>{comments}</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => setSaved(!saved)} hitSlop={8} accessibilityLabel="Save">
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={colors.ink} />
        </Pressable>
      </View>
      <CommentPreview postId={id} />
    </View>
  );
}

export default function Home() {
  const { isDark } = useTheme();
  const here = useCity();
  const { profile, blocked, myPosts, archivePost, deletePost } = useStore();
  const [pulls, setPulls] = useState(0);
  if (!profile) return <Redirect href="/welcome" />;
  const city = here.city ?? profile.city ?? cityOf(profile.neighborhood) ?? '';
  const where = (h: number) => `${hoursAgoLabel(h)}${city ? ` · ${city}` : ''}`;

  return (
    <Screen onRefresh={() => { setPulls(pulls + 1); return 0; }}>
      <View style={styles.top}>
        <View style={styles.logoMid} pointerEvents="none">
          <Logo size={38} m={isDark ? '#9CB561' : '#556B2F'} c="#F4B595" />
        </View>
        <Round label="Open menu" onPress={() => router.push('/menu')}>
          <Ionicons name="menu" size={20} color={colors.ink} />
        </Round>
        <View style={{ flex: 1 }} />
        <Round label="Notifications" onPress={() => router.push('/notifications' as Href)}>
          <Ionicons name="notifications-outline" size={19} color={colors.ink} />
        </Round>
        <Round label="Messages" onPress={() => router.push('/messages' as Href)}>
          <Ionicons name="paper-plane-outline" size={18} color={colors.ink} style={{ marginLeft: -1, marginTop: 1 }} />
        </Round>
      </View>

      <View style={styles.hello}>
        <Text style={styles.helloText}>{greeting()}, {profile.firstName}</Text>
        <Pressable style={styles.cityRow} onPress={here.city ? undefined : here.ask} disabled={!!here.city} hitSlop={8} accessibilityLabel={here.city ? `You're in ${here.city}` : 'Turn on location'}>
          <Ionicons name={here.city ? 'location' : 'location-outline'} size={14} color={colors.muted} />
          <Text style={styles.cityText} numberOfLines={1}>{here.city ?? 'Set your location'}</Text>
        </Pressable>
      </View>

      <Pressable style={styles.create} onPress={() => router.push('/new-post' as Href)} accessibilityLabel="Create a post">
        <Avatar name={profile.firstName} uri={profile.photoUri} size={32} />
        <Text style={styles.createText}>Create a post...</Text>
      </Pressable>

      {myPosts.filter((p) => !p.archived).map((mp) => (
        <PostCard
          key={mp.id}
          id={mp.id}
          name={profile.firstName}
          handle={profile.firstName.toLowerCase()}
          photoUri={profile.photoUri}
          when={`${agoLabel(mp.at)}${city ? ` · ${city}` : ''}`}
          text={mp.caption}
          photo={mp.uri}
          likes={0}
          onMore={() => openPostActions(mp, { archivePost, deletePost })}
        />
      ))}

      {POSTS.filter((p) => !blocked.includes(p.personId)).map((p) => {
        const person = findPerson(p.personId);
        return (
          <PostCard
            key={p.id}
            id={p.id}
            name={person?.firstName ?? p.handle}
            handle={p.handle}
            color={person?.color}
            photoUri={faceFor(p.personId)?.photo}
            when={where(p.hoursAgo)}
            text={p.text}
            photo={p.photo}
            likes={p.likes}
            onOpenPerson={() => router.push(`/person/${p.personId}`)}
            onMore={() => router.push(`/person/${p.personId}`)}
          />
        );
      })}
      <CommentsSheet />
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, marginBottom: space.md },
  round: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  logo: { height: 44, justifyContent: 'center', marginTop: -6 },
  logoMid: { position: 'absolute', left: 0, right: 0, top: -6, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  hello: { marginBottom: space.md, gap: 3 },
  helloText: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, letterSpacing: -0.4 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  cityText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted, flexShrink: 1 },
  create: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 10, marginBottom: space.sm },
  createText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.muted },
  post: { paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  handle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },
  text: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 21, color: colors.ink, marginTop: 10 },
  photo: { height: 210, borderRadius: 16, overflow: 'hidden', marginTop: 10, backgroundColor: colors.card },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 18, marginTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
}));
