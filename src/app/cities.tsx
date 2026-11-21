import Feather from '@expo/vector-icons/Feather';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageTop } from '@/components/page-top';
import { cityOf } from '@/data/options';
import { allCities, useCities, WAITLIST_GOAL } from '@/lib/cities';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Public city leaderboard (Yana, 2026-11-21): every city ranked by waitlist size.
export default function Cities() {
  useTheme();
  const st = useCities();
  const insets = useSafeAreaInsets();
  const { profile } = useStore();
  const home = profile ? profile.city ?? cityOf(profile.neighborhood) : undefined;
  const list = allCities(st);
  const locked = list.filter((c) => !c.live);
  const live = list.filter((c) => c.live);

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 40, paddingHorizontal: 20 }}>
      <PageTop title="City leaderboard" />
      <Text style={styles.intro}>Which city unlocks next? Each city opens at {WAITLIST_GOAL.toLocaleString('en-US')} people. Invite friends to push yours up.</Text>

      <Text style={styles.label}>Waiting to unlock</Text>
      {locked.map((c, i) => (
        <View key={c.city} style={[styles.row, c.city === home && styles.rowMine]}>
          <Text style={[styles.rank, i < 3 && styles.rankTop]}>{i + 1}</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{c.label}</Text>
              {c.city === home ? <Text style={styles.you}>Your city</Text> : null}
            </View>
            <View style={styles.bar}><View style={[styles.fill, { width: `${Math.min(1, c.waitlist / WAITLIST_GOAL) * 100}%` }]} /></View>
          </View>
          <Text style={styles.count}>{c.waitlist.toLocaleString('en-US')}</Text>
        </View>
      ))}

      {live.length ? (
        <>
          <Text style={styles.label}>Live now</Text>
          {live.map((c) => (
            <View key={c.city} style={[styles.row, c.city === home && styles.rowMine]}>
              <View style={styles.liveDot}><Feather name="zap" size={14} color={colors.onMine} /></View>
              <Text style={[styles.name, { flex: 1 }]}>{c.label}</Text>
              <Text style={styles.liveText}>{c.users.toLocaleString('en-US')} members</Text>
            </View>
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  intro: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.muted },
  label: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, marginTop: 24, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: 'transparent' },
  rowMine: { borderColor: colors.mine },
  rank: { width: 26, fontFamily: fonts.sansBold, fontSize: 16, color: colors.muted, textAlign: 'center' },
  rankTop: { color: colors.ink },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  you: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.onMine, backgroundColor: colors.mine, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.bg, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: colors.mine },
  count: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink, minWidth: 44, textAlign: 'right' },
  liveDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center' },
  liveText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
}));
