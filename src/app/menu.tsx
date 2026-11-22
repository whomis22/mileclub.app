import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { cityOf } from '@/data/options';
import { hasPremium } from '@/lib/swipes';
import { firstSet, SET_SIZE } from '@/lib/ticks';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Side menu (Yana, 2026-11-22: a mix of layouts 1 and 2): profile with the achievements
// bar, the main pages as big tiles, a short list, the lime Premium card, then Settings
// and the dark/light switch.
const LIME = '#B9E769';
type Icon = ComponentProps<typeof Feather>['name'];

export default function Menu() {
  const { isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, reset, admin, setAdmin, myPosts, comments, activities, planJoins, notices } = useStore();

  const go = (href: Href) => {
    router.back();
    setTimeout(() => router.push(href), 50);
  };

  const isCoach = profile?.role === 'coach';
  const ticks = profile ? firstSet({ profile, myPosts, comments, activities, planJoins: planJoins ?? [] }) : [];
  const done = ticks.filter((t) => t.done).length;
  const unread = (notices ?? []).filter((n) => !n.read).length;
  const city = profile ? profile.city ?? cityOf(profile.neighborhood) : undefined;

  const tiles: { label: string; icon: Icon; href: Href }[] = [
    { label: 'My plans', icon: 'calendar', href: '/plans' as Href },
    { label: 'Private sessions', icon: 'lock', href: '/private-session' as Href },
    { label: 'Events', icon: 'star', href: '/events' as Href },
    isCoach ? { label: 'Studio', icon: 'award', href: '/studio' as Href } : { label: 'Coaches', icon: 'award', href: '/train' as Href },
    { label: 'Places', icon: 'map-pin', href: '/explore' as Href },
    { label: 'Leaderboard', icon: 'bar-chart-2', href: '/cities' as Href },
  ];
  const rows: { label: string; icon: Icon; onPress: () => void; badge?: number }[] = [
    { label: 'Notifications', icon: 'bell', onPress: () => go('/notifications' as Href), badge: unread },
    ...(isCoach
      ? [
          { label: 'Booking requests', icon: 'inbox' as Icon, onPress: () => go('/requests' as Href) },
          { label: 'Earnings', icon: 'dollar-sign' as Icon, onPress: () => go('/earnings' as Href) },
        ]
      : []),
    { label: 'Who I meet up with', icon: 'users', onPress: () => go('/meet-settings' as Href) },
    ...(admin ? [{ label: 'City admin', icon: 'sliders' as Icon, onPress: () => go('/city-admin' as Href) }] : []),
    {
      label: 'Try an incoming call (demo)',
      icon: 'phone-incoming',
      onPress: () => {
        router.back();
        setTimeout(() => router.push('/call/femke?incoming=1' as Href), 1500);
      },
    },
    { label: 'About Mile Club', icon: 'info', onPress: () => go('/about' as Href) },
  ];

  const setDark = (on: boolean) => setMode(on ? 'dark' : 'light');
  const premium = hasPremium();

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
      <View style={[styles.panel, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {profile ? (
            <>
              <Pressable style={styles.me} onPress={() => go('/profile')}>
                <Avatar name={profile.firstName} uri={profile.photoUri} size={54} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.meName}>{profile.firstName}</Text>
                  <Text style={styles.meSub} numberOfLines={1}>{city ? `📍 ${city} · ` : ''}View profile</Text>
                </View>
              </Pressable>
              <Pressable style={styles.prog} onPress={() => go('/profile')} accessibilityLabel={`Achievements, ${done} of ${SET_SIZE}`}>
                <View style={styles.progTop}>
                  <Text style={styles.progText}>🏅 Achievements</Text>
                  <Text style={styles.progText}>{done} / {SET_SIZE}</Text>
                </View>
                <View style={styles.bar}><View style={[styles.fill, { width: `${(done / SET_SIZE) * 100}%` }]} /></View>
              </Pressable>
            </>
          ) : null}

          <View style={styles.tiles}>
            {tiles.map((t, i) => (
              <Pressable key={t.label} onPress={() => go(t.href)} style={({ pressed }) => [styles.tile, i === 0 && styles.tileHi, pressed && { opacity: 0.75 }]}>
                <Feather name={t.icon} size={21} color={i === 0 ? colors.onMine : colors.ink} />
                <Text style={[styles.tileText, i === 0 && { color: colors.onMine }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.section}>MORE</Text>
          {rows.map((r) => (
            <Pressable key={r.label} onPress={r.onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}>
              <Feather name={r.icon} size={18} color={colors.ink} />
              <Text style={styles.rowText}>{r.label}</Text>
              {r.badge ? <Text style={styles.badge}>{r.badge}</Text> : <Feather name="chevron-right" size={17} color={colors.muted} />}
            </Pressable>
          ))}
          <Pressable style={styles.row} onPress={() => setAdmin(!admin)} accessibilityRole="switch" accessibilityState={{ checked: admin }}>
            <Feather name="shield" size={18} color={colors.ink} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rowText}>Admin mode</Text>
              <Text style={styles.hint}>For testing: calls, city switches</Text>
            </View>
            <Switch value={admin} onValueChange={setAdmin} trackColor={{ false: colors.edge, true: LIME }} thumbColor="#FFFFFF" ios_backgroundColor={colors.edge} />
          </Pressable>

          <Pressable onPress={() => go('/premium' as Href)} style={({ pressed }) => [styles.prem, pressed && { opacity: 0.85 }]}>
            <Feather name="zap" size={20} color="#000" />
            <View style={{ flex: 1 }}>
              <Text style={styles.premTitle}>{premium ? 'You’re Premium' : 'Mile Club Premium'}</Text>
              <Text style={styles.premSub}>Padel, sauna &amp; pilates free</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#000" />
          </Pressable>

          <View style={styles.foot}>
            <Pressable onPress={() => go('/settings' as Href)} style={styles.pill}>
              <Feather name="settings" size={16} color={colors.ink} />
              <Text style={styles.pillText}>Settings</Text>
            </Pressable>
            <Pressable onPress={() => setDark(!isDark)} style={styles.pill} accessibilityRole="switch" accessibilityState={{ checked: isDark }} accessibilityLabel="Dark mode">
              <Feather name={isDark ? 'moon' : 'sun'} size={16} color={colors.ink} />
              <Text style={styles.pillText}>{isDark ? 'Dark' : 'Light'}</Text>
              <View style={[styles.tog, isDark && styles.togOn]}><View style={[styles.knob, isDark && styles.knobOn]} /></View>
            </Pressable>
          </View>
          <Pressable onPress={logOut} style={styles.logout}>
            <Feather name="log-out" size={16} color={colors.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </ScrollView>
      </View>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} accessibilityLabel="Close menu" />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.overlay },
  panel: { width: '84%', maxWidth: 340, backgroundColor: colors.bg, borderTopRightRadius: 32, borderBottomRightRadius: 32, paddingHorizontal: 18 },
  me: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  meName: { fontFamily: fonts.sansBold, fontSize: 19, color: colors.ink },
  meSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  prog: { marginTop: 14, backgroundColor: colors.card, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 14 },
  progTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progText: { fontFamily: fonts.sansSemi, fontSize: 12.5, color: colors.ink },
  bar: { height: 6, borderRadius: 3, backgroundColor: colors.line, marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: LIME, borderRadius: 3 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  tile: { width: '47.5%', height: 88, borderRadius: 20, backgroundColor: colors.card, padding: 14, justifyContent: 'space-between' },
  tileHi: { backgroundColor: colors.mine },
  tileText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  section: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, marginTop: 20, marginBottom: 2, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: colors.line },
  rowText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  hint: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, marginTop: 1 },
  badge: { minWidth: 22, textAlign: 'center', backgroundColor: LIME, color: '#000', fontFamily: fonts.sansBold, fontSize: 11, borderRadius: 11, overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3 },
  prem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: LIME, borderRadius: 20, padding: 14, marginTop: 20 },
  premTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: '#000' },
  premSub: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(0,0,0,0.7)', marginTop: 1 },
  foot: { flexDirection: 'row', gap: 10, marginTop: 12 },
  pill: { flex: 1, height: 44, borderRadius: 22, backgroundColor: colors.sand, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pillText: { fontFamily: fonts.sansSemi, fontSize: 13.5, color: colors.ink },
  tog: { width: 36, height: 22, borderRadius: 11, backgroundColor: colors.line, padding: 2 },
  togOn: { backgroundColor: LIME },
  knob: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF' },
  knobOn: { transform: [{ translateX: 14 }] },
  logout: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 8 },
  logoutText: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.danger },
}));
