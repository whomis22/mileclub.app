import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar, MenuButton, Screen } from '@/components/ui';
import { FEED } from '@/data/feed';
import { findPerson } from '@/data/people';
import { hoursAgoLabel } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

const PHOTOS = [
  require('../../../assets/images/photos/river.png'),
  require('../../../assets/images/photos/park.png'),
  require('../../../assets/images/photos/dusk.png'),
  require('../../../assets/images/photos/lake.png'),
];

const FILTERS = ['For you', 'Following', 'Nearby', 'Coaches'] as const;

function duration(min: number) {
  const h = Math.floor(min / 60);
  return h ? `${h}h ${min % 60}m` : `${min}m`;
}

export default function Explore() {
  const { profile, kudos, toggleKudos, blocked } = useStore();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('For you');
  const [following, setFollowing] = useState<string[]>([]);
  if (!profile) return <Redirect href="/welcome" />;

  let posts = FEED.filter((p) => !blocked.includes(p.personId));
  if (filter === 'Following') posts = posts.filter((p) => following.includes(p.personId));
  if (filter === 'Nearby') posts = posts.filter((p) => findPerson(p.personId)?.neighborhood === profile.neighborhood);
  if (filter === 'Coaches') posts = [];

  return (
    <Screen>
      <View style={styles.top}>
        <MenuButton onPress={() => router.push('/menu')} />
        <Text style={styles.title}>Explore</Text>
        <Pressable style={styles.people} onPress={() => router.push('/people')}>
          <Text style={styles.peopleText}>People near you</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {FILTERS.map((f) => (
          <Pressable key={f} onPress={() => (f === 'Coaches' ? router.push('/train') : setFilter(f))}>
            <Text style={[styles.tab, filter === f && styles.tabOn]}>{f}</Text>
          </Pressable>
        ))}
      </View>

      {posts.length === 0 ? (
        <Text style={styles.empty}>
          {filter === 'Following' ? 'Follow people to see their runs here.' : 'Nothing here yet.'}
        </Text>
      ) : null}

      {posts.map((post, i) => {
        const person = findPerson(post.personId);
        if (!person) return null;
        const liked = kudos.includes(post.id);
        const follows = following.includes(person.id);
        return (
          <View key={post.id} style={styles.post}>
            <View style={styles.head}>
              <Pressable onPress={() => router.push(`/person/${person.id}`)}>
                <Avatar name={person.firstName} color={person.color} size={38} />
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => router.push(`/person/${person.id}`)}>
                <Text style={styles.name}>{person.firstName}</Text>
                <Text style={styles.meta}>
                  {post.withCount ? `Ran with ${post.withCount} others · ` : ''}
                  {hoursAgoLabel(post.hoursAgo)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFollowing((l) => (follows ? l.filter((x) => x !== person.id) : [...l, person.id]))}
                style={[styles.follow, follows && styles.following]}>
                <Text style={styles.followText}>{follows ? 'Following' : 'Follow'}</Text>
              </Pressable>
            </View>

            <View style={styles.photo}>
              <Image source={PHOTOS[i % PHOTOS.length]} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.overlay}>
                <Text style={styles.postTitle} numberOfLines={2}>
                  {post.title}
                </Text>
                <Text style={styles.stats}>
                  {post.distanceKm ? `${post.distanceKm.toFixed(1)} KM\n` : ''}
                  {post.pace ? `${post.pace.toUpperCase()}\n` : ''}
                  {duration(post.minutes).toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable onPress={() => toggleKudos(post.id)} style={styles.action} accessibilityLabel="Like">
                <Text style={[styles.heart, liked && { color: colors.peachDeep }]}>{liked ? '♥' : '♡'}</Text>
                <Text style={styles.count}>{post.kudos + (liked ? 1 : 0)}</Text>
              </Pressable>
              <Text style={styles.place}>{post.place}</Text>
            </View>
            {post.note ? (
              <Text style={styles.caption}>
                <Text style={{ fontFamily: fonts.sansSemi }}>{person.firstName} </Text>
                {post.note}
              </Text>
            ) : null}
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { flex: 1, fontFamily: fonts.serif, fontSize: 38, color: colors.ink },
  people: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, paddingVertical: 8, paddingHorizontal: 12 },
  peopleText: { fontFamily: fonts.sansMedium, color: colors.ink, fontSize: 12 },
  tabs: { flexDirection: 'row', gap: 22, marginTop: space.lg, marginBottom: space.lg },
  tab: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, paddingBottom: 6 },
  tabOn: { fontFamily: fonts.sansSemi, color: colors.ink, borderBottomWidth: 1.5, borderBottomColor: colors.ink },
  empty: { fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', marginTop: space.xl },
  post: { marginBottom: space.xxl },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginBottom: space.md },
  name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  meta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 1 },
  follow: { borderRadius: radius.pill, backgroundColor: colors.peach, paddingVertical: 7, paddingHorizontal: 14 },
  following: { backgroundColor: colors.sand },
  followText: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.onPeach },
  photo: { height: 330, borderRadius: 28, overflow: 'hidden', backgroundColor: colors.oliveDark },
  overlay: { position: 'absolute', left: 16, right: 16, bottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: space.md },
  postTitle: { flex: 1, fontFamily: fonts.serifItalic, fontSize: 30, lineHeight: 32, color: colors.onBrand },
  stats: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.2, lineHeight: 15, color: colors.onBrand, textAlign: 'right' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.md },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heart: { fontSize: 22, color: colors.ink },
  count: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  place: { flex: 1, textAlign: 'right', fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  caption: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.ink, marginTop: space.sm },
});
