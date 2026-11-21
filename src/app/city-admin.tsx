import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTop } from '@/components/page-top';
import { allCities, demoReferral, setLive, useCities, WAITLIST_GOAL } from '@/lib/cities';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Admin dashboard (Yana, 2026-11-21): each city's status, members, waitlist and top referrers.
// Turning a city Live unlocks Explore there and tells its waitlist "[City] is live!".
// DEMO: the switches and numbers only live on this phone until the server is connected.
export default function CityAdmin() {
  useTheme();
  const st = useCities();
  const insets = useSafeAreaInsets();
  const list = allCities(st);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
      <PageTop title="City admin" />
      <Text style={styles.demo}>Demo: these switches only change this phone for now. Once the server is set up they’ll change it for everyone and send real push notifications.</Text>
      {list.map((c) => (
        <View key={c.city} style={styles.card}>
          <View style={styles.head}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.label}</Text>
              <Text style={[styles.status, c.live && styles.statusLive]}>{c.live ? 'Live' : 'Locked'}</Text>
            </View>
            <Switch
              value={c.live}
              onValueChange={(on) => setLive(c.city, on)}
              trackColor={{ false: colors.edge, true: colors.cta }}
              thumbColor="#fff"
              ios_backgroundColor={colors.edge}
              accessibilityLabel={`${c.label} live`}
            />
          </View>
          <View style={styles.stats}>
            <Stat n={c.users} label="Members" />
            <Stat n={c.waitlist} label={`Waitlist / ${WAITLIST_GOAL.toLocaleString('en-US')}`} />
          </View>
          <Text style={styles.sub}>Top referrers</Text>
          {c.referrers.slice(0, 3).map((r, i) => (
            <View key={r.name} style={styles.ref}>
              <Text style={styles.refRank}>{i + 1}</Text>
              <Text style={styles.refName}>{r.name}</Text>
              <Text style={styles.refCount}>{r.count} sign-ups</Text>
            </View>
          ))}
          <Pressable onPress={() => demoReferral(c.city)} hitSlop={6}>
            <Text style={styles.fake}>+ Pretend a friend signed up with my link</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  useTheme();
  return (
    <View style={styles.stat}>
      <Text style={styles.statNum}>{n.toLocaleString('en-US')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  demo: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, color: colors.muted, marginBottom: 14 },
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 12 },
  head: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink },
  status: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.muted, marginTop: 2 },
  statusLive: { color: colors.link },
  stats: { flexDirection: 'row', gap: 10, marginTop: 12 },
  stat: { flex: 1, backgroundColor: colors.bg, borderRadius: 14, padding: 10 },
  statNum: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  statLabel: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted, marginTop: 2 },
  sub: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink, marginTop: 14, marginBottom: 4 },
  ref: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  refRank: { width: 18, fontFamily: fonts.sansBold, fontSize: 13, color: colors.muted },
  refName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.ink },
  refCount: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  fake: { fontFamily: fonts.sansSemi, fontSize: 12.5, color: colors.link, marginTop: 10 },
}));
