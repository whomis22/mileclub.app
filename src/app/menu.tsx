import Feather from '@expo/vector-icons/Feather';
import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { cityOf } from '@/data/options';
import { hasPremium } from '@/lib/swipes';
import { firstSet, SET_SIZE } from '@/lib/ticks';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Side menu (Yana, 2026-11-22: layout 1): profile with the achievements bar, "Your stuff"
// and "Discover" lists with icons, the lime Premium card, then Settings and the dark/light
// switch. Log out, admin mode and the demo call live in Settings.
const LIME = '#B9E769';
type Icon = ComponentProps<typeof Feather>['name'];
type Item = { label: string; icon: Icon; href: Href; badge?: number };

export default function Menu() {
  const { isDark, setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, admin, myPosts, comments, activities, planJoins, notices } = useStore();

  const go = (href: Href) => {
    router.back();
    setTimeout(() => router.push(href), 50);
  };

  const isCoach = profile?.role === 'coach';
  const ticks = profile ? firstSet({ profile, myPosts, comments, activities, planJoins: planJoins ?? [] }) : [];
  const done = ticks.filter((t) => t.done).length;
  const unread = (notices ?? []).filter((n) => !n.read).length;
  const city = profile ? profile.city ?? cityOf(profile.neighborhood) : undefined;

  const yours: Item[] = [
    { label: 'My plans', icon: 'calendar', href: '/plans' as Href, badge: (planJoins ?? []).length },
    { label: 'Private sessions', icon: 'lock', href: '/private-session' as Href },
    { label: 'Notifications', icon: 'bell', href: '/notifications' as Href, badge: unread },
    ...(isCoach
      ? [
          { label: 'Studio', icon: 'award' as Icon, href: '/studio' as Href },
          { label: 'Booking requests', icon: 'inbox' as Icon, href: '/requests' as Href },
          { label: 'Earnings', icon: 'dollar-sign' as Icon, href: '/earnings' as Href },
        ]
      : []),
  ];
  const discover: Item[] = [
    { label: 'Events', icon: 'star', href: '/events' as Href },
    ...(isCoach ? [] : [{ label: 'Coaches', icon: 'award' as Icon, href: '/coaches' as Href }]),
    { label: 'Places near you', icon: 'map-pin', href: '/explore' as Href },
    { label: 'City leaderboard', icon: 'bar-chart-2', href: '/cities' as Href },
    ...(admin ? [{ label: 'City admin', icon: 'sliders' as Icon, href: '/city-admin' as Href }] : []),
  ];

  const setDark = (on: boolean) => setMode(on ? 'dark' : 'light');
  const premium = hasPremium();

  return (
    <View style={styles.root}>
      <View style={[styles.panel, { paddingTop: insets.top + space.md, paddingBottom: insets.bottom + space.md }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
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

          {([['YOUR STUFF', yours], ['DISCOVER', discover]] as const).map(([title, items]) => (
            <View key={title}>
              <Text style={styles.section}>{title}</Text>
              {items.map((it, i) => (
                <Pressable key={it.label} onPress={() => go(it.href)} style={({ pressed }) => [styles.item, title === 'YOUR STUFF' && i === 0 && styles.itemOn, pressed && styles.itemOn]}>
                  <Feather name={it.icon} size={19} color={colors.ink} />
                  <Text style={styles.itemText}>{it.label}</Text>
                  {it.badge ? <Text style={styles.badge}>{it.badge}</Text> : null}
                </Pressable>
              ))}
            </View>
          ))}

          <View style={{ flex: 1, minHeight: 12 }} />
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
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 46, paddingHorizontal: 12, borderRadius: 999 },
  itemOn: { backgroundColor: colors.oliveSoft },
  itemText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 15.5, color: colors.ink },
  section: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, marginTop: 20, marginBottom: 2, marginLeft: 4 },
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
}));
