import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import type { City } from '@/data/options';
import { cityStats, joinWaitlist, referralLink, useCities, WAITLIST_GOAL } from '@/lib/cities';
import { fonts } from '@/theme';

const LIME = '#B9E769';

// Explore in a Locked city (Yana, 2026-11-21): the page is blurred and can't be used,
// with the city's waitlist, a one-tap Join waitlist, then Invite friends.
export function CityLock({ city, name }: { city: City; name?: string }) {
  const st = useCities();
  const s = cityStats(city, st);
  const pct = Math.min(1, s.waitlist / WAITLIST_GOAL);
  const link = referralLink(name, city);

  function join() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    joinWaitlist(city);
  }

  function invite() {
    Share.share({ message: `Join me on Mile Club, so we can unlock ${s.label} together: ${link}` }).catch(() => {});
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={45} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]} />
      <View style={styles.wrap}>
        <View style={styles.card}>
          <View style={styles.lock}><Feather name="lock" size={22} color="#000" /></View>
          <Text style={styles.title}>Mile Club isn’t live in {s.label} yet.</Text>
          <Text style={styles.sub}>Explore opens when enough people join. Home and posts already work.</Text>

          <View style={styles.barRow}>
            <Text style={styles.barNum}>{s.waitlist.toLocaleString('en-US')} / {WAITLIST_GOAL.toLocaleString('en-US')}</Text>
            <Text style={styles.barLabel}>on the waitlist</Text>
          </View>
          <View style={styles.bar}><View style={[styles.fill, { width: `${pct * 100}%` }]} /></View>

          {s.joined ? (
            <>
              <View style={styles.joined}>
                <Feather name="check-circle" size={16} color={LIME} />
                <Text style={styles.joinedText}>You’re on the {s.label} waitlist</Text>
              </View>
              <Pressable style={styles.btn} onPress={invite} accessibilityLabel="Invite friends">
                <Feather name="share" size={17} color="#000" />
                <Text style={styles.btnText}>Invite friends</Text>
              </Pressable>
              <Text style={styles.link} numberOfLines={1}>{link.replace('https://', '')}</Text>
            </>
          ) : (
            <Pressable style={styles.btn} onPress={join} accessibilityLabel="Join waitlist">
              <Text style={styles.btnText}>Join waitlist</Text>
            </Pressable>
          )}

          <Pressable style={styles.board} onPress={() => router.push('/cities' as Href)} hitSlop={8}>
            <Feather name="bar-chart-2" size={15} color="#FFFFFF" />
            <Text style={styles.boardText}>City leaderboard</Text>
            <Feather name="chevron-right" size={15} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: 'rgba(16,16,16,0.86)', borderRadius: 28, padding: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  lock: { width: 48, height: 48, borderRadius: 24, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 24, lineHeight: 29, color: '#FFFFFF', marginTop: 16, letterSpacing: -0.3 },
  sub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.75)', marginTop: 8 },
  barRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 22 },
  barNum: { fontFamily: fonts.sansBold, fontSize: 20, color: '#FFFFFF' },
  barLabel: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  bar: { height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5, backgroundColor: LIME },
  btn: { flexDirection: 'row', gap: 8, height: 54, borderRadius: 27, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  btnText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#000' },
  joined: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  joinedText: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#FFFFFF' },
  link: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginTop: 8 },
  board: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  boardText: { fontFamily: fonts.sansSemi, fontSize: 14, color: '#FFFFFF' },
});
