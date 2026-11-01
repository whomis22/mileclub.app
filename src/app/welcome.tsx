import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/theme';

// Clean, minimal welcome screen: small wordmark on top, one big headline,
// stacked pill buttons, and a quiet "Log in" link at the bottom.
// Real sign-in (Apple / Google / email) isn't built yet, so every button
// starts profile setup for now.

function PillButton({ title, icon, onPress, filled }: {
  title: string;
  icon?: string;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        filled ? styles.pillFilled : styles.pillOutline,
        pressed && { opacity: 0.75 },
      ]}>
      {icon ? <Text style={[styles.pillIcon, filled && { color: '#fff' }]}>{icon}</Text> : null}
      <Text style={[styles.pillText, filled && { color: '#fff' }]}>{title}</Text>
    </Pressable>
  );
}

export default function Welcome() {
  const start = () => router.push('/onboarding');

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>MILE CLUB</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.hero}>See who’s running in Amsterdam right now.</Text>
      </View>

      <View style={styles.actions}>
        <PillButton title="Continue with Apple" onPress={start} />
        <PillButton title="Continue with Google" onPress={start} />

        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        <PillButton title="Create account" onPress={start} filled />

        <Text style={styles.terms}>
          By signing up, you agree to our <Text style={styles.link}>Terms</Text>,{' '}
          <Text style={styles.link}>Privacy Policy</Text> and{' '}
          <Text style={styles.link}>Community Guidelines</Text>.
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Have an account already?{' '}
          <Text style={styles.link} onPress={start}>
            Log in
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: space.xxl },
  header: { alignItems: 'center', paddingTop: space.md },
  wordmark: { color: colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  middle: { flex: 1, justifyContent: 'center' },
  hero: { color: colors.ink, fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5 },
  actions: { gap: space.md },
  pill: {
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  pillOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: colors.line },
  pillFilled: { backgroundColor: colors.accent },
  pillIcon: { fontSize: 18, fontWeight: '800', color: colors.ink },
  pillText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: space.xs },
  orLine: { flex: 1, height: 1, backgroundColor: colors.line },
  orText: { color: colors.muted, fontSize: 14 },
  terms: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: space.xs },
  link: { color: colors.accent, fontWeight: '600' },
  footer: { paddingVertical: space.xxl },
  footerText: { color: colors.muted, fontSize: 15 },
});
