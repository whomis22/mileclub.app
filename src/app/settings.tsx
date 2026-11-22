import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

type Row = { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void };

// Settings list (design board, 2026-11-21): grouped rows, dark mode switch, Log Out.
export default function Settings() {
  const { isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, reset, setRole, admin, setAdmin } = useStore();
  const soon = (what: string) => Alert.alert(what, 'This page is coming soon.');

  const isCoach = profile?.role === 'coach';
  // The six rows from the design board first, then the extras the app needs.
  const groups: { title: string; rows: Row[] }[] = [
    {
      title: '',
      rows: [
        { icon: 'user', label: 'Account Information', onPress: () => router.push({ pathname: '/onboarding', params: { edit: '1' } }) },
        { icon: 'map-pin', label: 'Home city', onPress: () => router.push('/home-city' as Href) },
        { icon: 'bell', label: 'Notifications', onPress: () => router.push('/notifications' as Href) },
        { icon: 'shield', label: 'Privacy & Safety', onPress: () => router.push('/meet-settings' as Href) },
        { icon: 'credit-card', label: 'Payment Methods', onPress: () => soon('Payment Methods') },
        { icon: 'help-circle', label: 'Help & Support', onPress: () => soon('Help & Support') },
        { icon: 'info', label: 'About Mile Club', onPress: () => router.push('/about' as Href) },
      ],
    },
    {
      title: 'More',
      rows: [
        { icon: 'star', label: 'Mile Club Premium', onPress: () => router.push('/premium' as Href) },
        { icon: 'calendar', label: 'Schedule & events', onPress: () => router.push('/events' as Href) },
        { icon: 'map', label: 'Places near you', onPress: () => router.push('/explore' as Href) },
        { icon: 'bar-chart-2', label: 'City leaderboard', onPress: () => router.push('/cities' as Href) },
        ...(admin ? [{ icon: 'sliders' as const, label: 'City admin', onPress: () => router.push('/city-admin' as Href) }] : []),
        {
          icon: 'award',
          label: isCoach ? 'Switch to a member account' : 'Become a coach',
          onPress: () => {
            setRole(isCoach ? 'member' : 'coach');
            router.navigate((isCoach ? '/feed' : '/studio') as Href);
          },
        },
      ],
    },
  ];

  function logOut() {
    Alert.alert('Log out?', 'This clears your profile and plans on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => {
          reset();
          router.dismissAll();
          router.replace('/welcome');
        },
      },
    ]);
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + space.xl, paddingHorizontal: 20 }}>
        <View style={styles.top}>
          <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
            <Feather name="arrow-left" size={22} color={colors.ink} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {groups.map((g) => (
          <View key={g.title}>
            {g.title ? <Text style={styles.group}>{g.title}</Text> : null}
            <View style={styles.card}>
              {g.rows.map((r, i) => (
                <Pressable key={r.label} style={({ pressed }) => [styles.row, i > 0 && styles.rowLine, pressed && { opacity: 0.6 }]} onPress={r.onPress}>
                  <View style={styles.icon}><Feather name={r.icon} size={17} color={colors.ink} /></View>
                  <Text style={styles.label}>{r.label}</Text>
                  <Feather name="chevron-right" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.group}>Appearance</Text>
        <View style={styles.card}>
          <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={() => router.push('/vibration' as Href)}>
            <View style={styles.icon}><Feather name="smartphone" size={17} color={colors.ink} /></View>
            <Text style={styles.label}>Opening vibration</Text>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
          <Pressable style={[styles.row, styles.rowLine]} onPress={() => setMode(isDark ? 'light' : 'dark')} accessibilityRole="switch" accessibilityState={{ checked: isDark }}>
            <View style={styles.icon}><Feather name="moon" size={17} color={colors.ink} /></View>
            <Text style={styles.label}>Dark mode</Text>
            <Switch
              value={isDark}
              onValueChange={(on) => setMode(on ? 'dark' : 'light')}
              trackColor={{ false: colors.edge, true: colors.cta }}
              thumbColor="#fff"
              ios_backgroundColor={colors.edge}
            />
          </Pressable>
        </View>

        {/* Testing tools, moved here from the side menu (Yana, 2026-11-22). */}
        <Text style={styles.group}>Testing</Text>
        <View style={styles.card}>
          <Pressable style={styles.row} onPress={() => setAdmin(!admin)} accessibilityRole="switch" accessibilityState={{ checked: admin }}>
            <View style={styles.icon}><Feather name="sliders" size={17} color={colors.ink} /></View>
            <Text style={styles.label}>Admin mode</Text>
            <Switch value={admin} onValueChange={setAdmin} trackColor={{ false: colors.edge, true: colors.cta }} thumbColor="#fff" ios_backgroundColor={colors.edge} />
          </Pressable>
          <Pressable style={({ pressed }) => [styles.row, styles.rowLine, pressed && { opacity: 0.6 }]} onPress={() => setTimeout(() => router.push('/call/femke?incoming=1' as Href), 1500)}>
            <View style={styles.icon}><Feather name="phone-incoming" size={17} color={colors.ink} /></View>
            <Text style={styles.label}>Try an incoming call (demo)</Text>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        </View>

        <Pressable style={styles.logout} onPress={logOut}>
          <Feather name="log-out" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
  me: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: 22, padding: space.md },
  meName: { fontFamily: fonts.serif, fontSize: 18, color: colors.ink },
  meSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  group: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted, marginTop: space.xl, marginBottom: space.sm, marginLeft: 4 },
  card: { backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56 },
  rowLine: { borderTopWidth: 1, borderTopColor: colors.line },
  icon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: space.xl, backgroundColor: colors.card, borderRadius: 999, height: 54 },
  logoutText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.danger },
}));
