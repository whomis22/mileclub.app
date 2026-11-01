import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { colors, radius, space } from '@/theme';

// Minimal dark welcome screen: logo in the middle; headline, Get started
// and a quiet "Log in" link at the bottom.

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
  const signUp = () => router.push('/signup');
  const [appleReady, setAppleReady] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleReady).catch(() => setAppleReady(false));
  }, []);

  // Sign in with Apple: Apple confirms who the person is and (the first time
  // only) shares their name and email. We then skip straight to the rest of
  // sign-up. There's no server yet, so the Apple sign-in isn't stored anywhere.
  async function continueWithApple() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');
      router.push({
        pathname: '/signup',
        params: { apple: '1', name: fullName, email: credential.email ?? '' },
      });
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in didn’t work', 'Please try again, or tap Get started to sign up with email.');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.middle}>
        <Image
          source={require('../../assets/images/logo-mark.png')}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Mile Club"
        />
      </View>

      <View style={styles.actions}>
        <Text style={styles.hero}>
          Find people to run with <Text style={styles.heroAccent}>near you.</Text>
        </Text>
        {appleReady ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={26}
            style={styles.appleButton}
            onPress={continueWithApple}
          />
        ) : null}
        <PillButton title="Get started" onPress={signUp} filled />
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

const DIM = '#B9B0CC';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, paddingHorizontal: space.xxl },
  logo: { width: '44%', aspectRatio: 512 / 244 },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: space.xxl },
  hero: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', lineHeight: 40, letterSpacing: -0.5, marginBottom: space.md },
  heroAccent: { color: colors.accent },
  actions: { gap: space.md },
  pill: {
    height: 52,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  appleButton: { width: '100%', height: 52 },
  pillOutline: { backgroundColor: '#FFFFFF' },
  pillFilled: { backgroundColor: colors.accent },
  pillIcon: { fontSize: 18, fontWeight: '800', color: colors.ink },
  pillText: { fontSize: 16, fontWeight: '700', color: colors.ink },
  terms: { color: DIM, fontSize: 13, lineHeight: 18, marginTop: space.xs },
  link: { color: colors.peach, fontWeight: '600' },
  footer: { paddingTop: space.xl, paddingBottom: space.lg + 24 },
  footerText: { color: DIM, fontSize: 15 },
});
