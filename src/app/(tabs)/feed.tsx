import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { RouteMap } from '@/components/route-map';
import { Avatar, Card, Screen } from '@/components/ui';
import { FEED } from '@/data/feed';
import { activityInfo } from '@/data/options';
import { findPerson } from '@/data/people';
import { hoursAgoLabel } from '@/lib/time';
import { useStore } from '@/state/store';
import { colors, radius, space } from '@/theme';

function duration(min: number) {
  const h = Math.floor(min / 60);
  return h ? `${h}h ${min % 60}m` : `${min}m`;
}

export default function Feed() {
  const { profile, activities, kudos, toggleKudos, blocked } = useStore();
  if (!profile) return <Redirect href="/welcome" />;

  const upcoming = activities.filter((a) => a.participants.includes('me')).length;
  const posts = FEED.filter((p) => !blocked.includes(p.personId));
  const crewKm = posts.reduce((s, p) => s + (p.distanceKm ?? 0), 0);

  return (
    <Screen>
      <Text style={styles.brand}>mile club</Text>

      <View style={styles.week}>
        <Text style={styles.weekKicker}>THIS WEEK IN AMSTERDAM</Text>
        <View style={styles.weekRow}>
          <WeekStat value={`${Math.round(crewKm)}`} unit="km" label="by your crew" />
          <WeekStat value={`${posts.reduce((s, p) => s + p.withCount + 1, 0)}`} label="people moved" />
          <WeekStat value={`${upcoming}`} label="your plans" />
        </View>
        <Pressable style={styles.weekCta} onPress={() => router.push('/now')}>
          <Text style={styles.weekCtaText}>⚡ Find a session starting soon →</Text>
        </Pressable>
      </View>

      {posts.map((post) => {
        const person = findPerson(post.personId);
        if (!person) return null;
        const info = activityInfo(post.type);
        const liked = kudos.includes(post.id);
        return (
          <Card key={post.id} style={{ padding: 0, overflow: 'hidden' }}>
            <Pressable style={styles.head} onPress={() => router.push(`/person/${person.id}`)}>
              <Avatar name={person.firstName} color={person.color} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {person.firstName}
                  {person.isCaptain ? <Text style={styles.captain}>  ★ CAPTAIN</Text> : null}
                </Text>
                <Text style={styles.meta}>
                  {info.emoji} {hoursAgoLabel(post.hoursAgo)} · {post.place}
                  {post.withCount ? ` · with ${post.withCount} others` : ''}
                </Text>
              </View>
            </Pressable>
            <View style={{ paddingHorizontal: space.lg }}>
              <Text style={styles.title}>{post.title}</Text>
              {post.note ? <Text style={styles.note}>{post.note}</Text> : null}
              <View style={styles.stats}>
                {post.distanceKm ? <PostStat label="Distance" value={`${post.distanceKm.toFixed(1)} km`} /> : null}
                {post.pace ? <PostStat label={post.type === 'cycling' ? 'Speed' : 'Pace'} value={post.pace} /> : null}
                <PostStat label="Time" value={duration(post.minutes)} />
              </View>
            </View>
            {post.route >= 0 ? (
              <View style={{ paddingHorizontal: space.lg }}>
                <RouteMap route={post.route} />
              </View>
            ) : (
              <View style={[styles.noMap, { marginHorizontal: space.lg }]}>
                <Text style={{ fontSize: 44 }}>{info.emoji}</Text>
              </View>
            )}
            <View style={styles.foot}>
              <Pressable onPress={() => toggleKudos(post.id)} style={[styles.kudos, liked && styles.kudosOn]}>
                <Text style={[styles.kudosText, liked && { color: '#fff' }]}>
                  🙌 {post.kudos + (liked ? 1 : 0)} high fives
                </Text>
              </Pressable>
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

function WeekStat({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.weekValue}>
        {value}
        {unit ? <Text style={styles.weekUnit}> {unit}</Text> : null}
      </Text>
      <Text style={styles.weekLabel}>{label}</Text>
    </View>
  );
}

function PostStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginRight: space.xl }}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { fontSize: 26, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginBottom: space.md },
  week: { backgroundColor: colors.ink, borderRadius: radius.lg, padding: space.lg, marginBottom: space.lg },
  weekKicker: { color: colors.peach, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  weekRow: { flexDirection: 'row', marginTop: space.md },
  weekValue: { color: '#fff', fontSize: 28, fontWeight: '900' },
  weekUnit: { fontSize: 15, fontWeight: '800' },
  weekLabel: { color: '#fff', opacity: 0.7, fontSize: 12, fontWeight: '700' },
  weekCta: { marginTop: space.lg, backgroundColor: colors.accent, borderRadius: radius.pill, paddingVertical: 12, alignItems: 'center' },
  weekCtaText: { color: '#fff', fontWeight: '900', fontSize: 15 },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg, paddingBottom: space.sm },
  name: { fontSize: 16, fontWeight: '800', color: colors.ink },
  captain: { fontSize: 11, fontWeight: '900', color: colors.purple, letterSpacing: 0.5 },
  meta: { fontSize: 13, color: colors.muted, marginTop: 1 },
  title: { fontSize: 20, fontWeight: '900', color: colors.ink, letterSpacing: -0.3 },
  note: { fontSize: 15, color: colors.ink, marginTop: 4, lineHeight: 21 },
  stats: { flexDirection: 'row', marginVertical: space.md },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '700' },
  statValue: { fontSize: 20, fontWeight: '900', color: colors.ink, marginTop: 1 },
  noMap: { height: 90, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  foot: { padding: space.lg, paddingTop: space.md, flexDirection: 'row' },
  kudos: { borderRadius: radius.pill, borderWidth: 1.5, borderColor: colors.line, paddingVertical: 8, paddingHorizontal: 14 },
  kudosOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  kudosText: { fontWeight: '800', color: colors.ink, fontSize: 14 },
});
