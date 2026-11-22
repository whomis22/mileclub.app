import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FollowButton } from '@/components/follow-button';
import { Avatar, Body, Screen } from '@/components/ui';
import { findCoach } from '@/data/coaches';
import { activityInfo } from '@/data/options';
import { friendlyDate } from '@/lib/format';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Coach account, copied from Yana's design board (2026-11-21).
const un = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&h=400&fit=crop&q=70`;
const COACH_PHOTOS: Record<string, string> = {
  'c-jesse': un('1472099645785-5658abf4ff4e'),
  'c-noor': un('1534528741775-53994a69daeb'),
  'c-ruben': un('1519085360753-af0119f7cbe7'),
  'c-elif': un('1580489944761-15a19d654956'),
};
const THUMB: Record<string, string> = {
  running: un('1552674605-db6ffd4facb5'),
  gym: un('1534438327276-14e5300c3a48'),
  strength: un('1517836357463-d25dfeac3438'),
  yoga: un('1544367567-0f2fcb009e0b'),
};

function short(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
}

export default function CoachProfile() {
  useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useStore();
  const c = findCoach(id);
  if (!c) return <Screen edges={[]}><Body>This coach isn’t available.</Body></Screen>;
  const theirs = sessions.filter((s) => s.coachId === c.id);
  const first = c.name.split(' ')[0];

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 4, paddingBottom: insets.bottom + 30, paddingHorizontal: 20 }}>
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} style={styles.icon} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
          <FollowButton id={c.id} name={c.name} />
        </View>

        <View style={styles.head}>
          {COACH_PHOTOS[c.id] ? (
            <Image source={{ uri: COACH_PHOTOS[c.id] }} style={styles.photo} contentFit="cover" />
          ) : (
            <Avatar name={c.name} color={c.color} size={84} />
          )}
          <View style={styles.nameRow}>
            <Text style={styles.name}>Coach {first}</Text>
            <Ionicons name="checkmark-circle" size={18} color="#3B82F6" />
          </View>
          <Text style={styles.cert}>Certified Trainer</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={String(c.sessionsRun)} label="Sessions" />
          <Stat value={short(c.followers)} label="Followers" />
          <Stat value={`${c.rating.toFixed(1)}`} star label="Rating" />
        </View>

        <Text style={styles.spec}>{c.specialties.slice(0, 3).join(' • ')}</Text>
        <Text style={styles.bio}>{c.bio}</Text>

        <Pressable
          style={({ pressed }) => [styles.book, pressed && { opacity: 0.85 }]}
          onPress={() => theirs[0] && router.push(`/session/${theirs[0].id}`)}>
          <Text style={styles.bookText}>Book a Session</Text>
        </Pressable>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Upcoming Sessions</Text>
          <Text style={styles.seeAll}>See all ›</Text>
        </View>
        {theirs.map((s) => (
          <Pressable key={s.id} style={styles.session} onPress={() => router.push(`/session/${s.id}`)}>
            <Image source={{ uri: THUMB[s.type] ?? THUMB.gym }} style={styles.thumb} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.sTitle} numberOfLines={1}>{s.title}</Text>
              <Text style={styles.sMeta}>{friendlyDate(s.date)} · {s.time}</Text>
              <Text style={styles.sMeta}>{activityInfo(s.type).label} · {s.spots - s.booked} spots left</Text>
            </View>
            <Text style={styles.price}>€{s.price}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Stat({ value, label, star }: { value: string; label: string; star?: boolean }) {
  useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValue}>
        {value}
        {star ? <Text style={{ color: '#F5B301' }}> ★</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  icon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  head: { alignItems: 'center' },
  photo: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.card },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.md },
  name: { fontFamily: fonts.sansBold, fontSize: 22, color: colors.ink },
  cert: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 3 },
  stats: { flexDirection: 'row', marginTop: space.lg },
  statValue: { fontSize: 18, fontFamily: fonts.sansBold, color: colors.ink },
  statLabel: { fontSize: 12, fontFamily: fonts.sans, color: colors.muted, marginTop: 2 },
  spec: { textAlign: 'center', fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink, marginTop: space.lg },
  bio: { textAlign: 'center', fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 6 },
  book: { height: 52, borderRadius: 999, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center', marginTop: space.lg },
  bookText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.onMine },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: space.xl, marginBottom: space.sm },
  section: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  seeAll: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  session: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 16, padding: 10, marginBottom: 10 },
  thumb: { width: 54, height: 54, borderRadius: 12, backgroundColor: colors.bg },
  sTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  sMeta: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  price: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
}));
