import { StyleSheet, Switch, Text, View } from 'react-native';

import { Avatar, Logo, Screen } from '@/components/ui';
import { setGroupSetting, useGroupSettings, type GroupSettings } from '@/lib/group-settings';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

const ROWS: { key: keyof GroupSettings; title: string; sub: string }[] = [
  { key: 'adminsOnly', title: 'Only admins can post', sub: 'Members can read and react, but not send messages.' },
  { key: 'reactions', title: 'Members can react', sub: 'Likes on posts.' },
  { key: 'muted', title: 'Mute notifications', sub: 'Just for you.' },
];

export default function GroupSettingsScreen() {
  useTheme();
  const settings = useGroupSettings();
  const { profile } = useStore();

  return (
    <Screen edges={[]}>
      <View style={styles.top}>
        <View style={styles.icon}>
          <Logo size={44} m={colors.bg} />
        </View>
        <Text style={styles.title}>Mile Club Members</Text>
        <Text style={styles.sub}>Everyone who signs up joins this chat automatically.</Text>
      </View>

      <View style={styles.card}>
        {ROWS.map((r, i) => (
          <View key={r.key} style={[styles.row, i < ROWS.length - 1 && styles.line]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{r.title}</Text>
              <Text style={styles.rowSub}>{r.sub}</Text>
            </View>
            <Switch
              value={settings[r.key]}
              onValueChange={(v) => setGroupSetting(r.key, v)}
              trackColor={{ true: colors.olive, false: colors.line }}
              thumbColor={colors.bg}
            />
          </View>
        ))}
      </View>

      <Text style={styles.section}>ADMINS</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Avatar name="Mile Club" size={40} />
          <Text style={[styles.rowTitle, { flex: 1 }]}>Mile Club team</Text>
          <View style={styles.owner}>
            <Text style={styles.ownerText}>Owner</Text>
          </View>
        </View>
      </View>
      {profile ? <Text style={styles.note}>You’re a member of this group.</Text> : null}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  top: { alignItems: 'center', gap: space.sm },
  icon: { width: 88, height: 88, borderRadius: 28, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink, marginTop: space.xs },
  sub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: space.lg, marginTop: space.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.lg },
  line: { borderBottomWidth: 1, borderBottomColor: colors.sand },
  rowTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  rowSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
  section: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, marginTop: space.xl, marginBottom: -space.md },
  owner: { backgroundColor: colors.olive, borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10 },
  ownerText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.onBrand },
  note: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center', marginTop: space.lg },
}));
