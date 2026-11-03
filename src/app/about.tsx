import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Logo } from '@/components/ui';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// About Mile Club: the team photo, what the club is and how it works.
const POINTS = [
  { icon: '🧑‍🤝‍🧑', title: 'Meet new people', body: 'Find people near you, and people in your line of work, who want to do things together.' },
  { icon: '🏋️', title: 'Move together', body: 'Workouts, runs, pilates, yoga, tennis. Pick a plan, ask to join, and the host says yes.' },
  { icon: '🧖', title: 'Try new things', body: 'Spa days, coffee and chats, new classes. Say yes to something different with someone new.' },
  { icon: '🤝', title: 'Never do it alone', body: 'Follow people you like, chat after a meet-up, and keep showing up together.' },
  { icon: '🎓', title: 'Train with coaches', body: 'Book sessions with local coaches when you want a bit more.' },
];

export default function About() {
  useTheme();
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }}>
      <Image source={require('../../assets/images/team.jpg')} style={styles.hero} contentFit="cover" contentPosition="top" />
      <View style={styles.body}>
        <Logo size={34} />
        <Text style={styles.title}>Meet the club</Text>
        <Text style={styles.lead}>
          Mile Club is a lifestyle, not just a club. Meet new people, including people in your field, and do things together:
          workouts, fitness, spa days and new experiences. Nobody has to feel alone.
        </Text>
        <View style={{ gap: space.md, marginTop: space.lg }}>
          {POINTS.map((p) => (
            <View key={p.title} style={styles.point}>
              <Text style={styles.icon}>{p.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pointTitle}>{p.title}</Text>
                <Text style={styles.pointBody}>{p.body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Pressable style={styles.cta} onPress={() => router.navigate('/activities' as Href)}>
          <Text style={styles.ctaText}>Find something to do</Text>
        </Pressable>
        <Text style={styles.social}>Instagram and TikTok: @mileclub.app</Text>
      </View>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { width: '100%', aspectRatio: 1179 / 748, backgroundColor: colors.sand },
  body: { padding: space.xl, gap: space.sm },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink, marginTop: space.md },
  lead: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.muted },
  point: { flexDirection: 'row', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg },
  icon: { fontSize: 22 },
  pointTitle: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  pointBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.muted, marginTop: 2 },
  cta: { marginTop: space.xl, backgroundColor: colors.olive, borderRadius: radius.pill, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontFamily: fonts.sansSemi, fontSize: 16, color: colors.onBrand },
  social: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: space.md },
}));
