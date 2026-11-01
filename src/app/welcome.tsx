import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { colors, fonts, radius, space } from '@/theme';

// Welcome: logo and Log in at the top, a fanned stack of run photo cards,
// "Find your running crew." and the Join button at the bottom.

const CARDS = [
  { photo: require('../../assets/images/photos/dusk.png'), title: 'Sunrise 5K', style: { left: '6%', top: 36, transform: [{ rotate: '-10deg' }] } },
  { photo: require('../../assets/images/photos/lake.png'), title: 'Riverside', style: { right: '6%', top: 16, transform: [{ rotate: '9deg' }] } },
] as const;

export default function Welcome() {
  const logIn = () => router.push('/onboarding');
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
      Alert.alert('Apple sign-in didn’t work', 'Please try again, or tap Join Mile Club to sign up with email.');
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.top}>
        <Logo size={34} />
        <Pressable onPress={logIn} hitSlop={12}>
          <Text style={styles.login}>Log in</Text>
        </Pressable>
      </View>

      <View style={styles.stack}>
        {CARDS.map((c) => (
          <View key={c.title} style={[styles.card, styles.back, c.style]}>
            <Image source={c.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
            <Text style={styles.cardTitle}>{c.title}</Text>
          </View>
        ))}
        <View style={[styles.card, styles.front]}>
          <Image source={require('../../assets/images/photos/park.png')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.going}>
            <Text style={styles.goingText}>6 going</Text>
          </View>
          <View>
            <Text style={[styles.cardTitle, { fontSize: 28 }]}>Park loop</Text>
            <Text style={styles.cardMeta}>SAT · 08:00 · EASY</Text>
          </View>
        </View>
      </View>

      <View style={styles.bottom}>
        <Text style={styles.hero}>
          Find your <Text style={styles.heroItalic}>running crew.</Text>
        </Text>
        <View style={{ gap: space.md }}>
          {appleReady ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={27}
              style={styles.appleButton}
              onPress={continueWithApple}
            />
          ) : null}
          <Pressable onPress={signUp} style={({ pressed }) => [styles.join, pressed && { opacity: 0.8 }]}>
            <Text style={styles.joinText}>Join Mile Club</Text>
          </Pressable>
          <Text style={styles.coach}>
            Are you a coach?{' '}
            <Text style={styles.coachLink} onPress={signUp}>
              Host sessions
            </Text>
          </Text>
          <Text style={styles.terms}>
            By joining, you agree to our Terms, Privacy Policy and Community Guidelines.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 28, paddingTop: space.md },
  login: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  stack: { flex: 1, minHeight: 320, marginTop: space.lg },
  card: { position: 'absolute', borderRadius: 28, overflow: 'hidden', padding: 16, justifyContent: 'flex-end' },
  back: { width: '52%', height: '72%' },
  front: { width: '58%', height: '78%', left: '21%', top: 90, justifyContent: 'space-between', borderRadius: 30 },
  cardTitle: { fontFamily: fonts.serifItalic, fontSize: 24, color: colors.bg },
  cardMeta: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.2, color: colors.bg, marginTop: 4 },
  going: { alignSelf: 'flex-start', backgroundColor: colors.peach, borderRadius: radius.pill, paddingVertical: 5, paddingHorizontal: 10 },
  goingText: { fontFamily: fonts.sansSemi, fontSize: 11, color: colors.ink },
  bottom: { paddingHorizontal: 28, paddingBottom: space.lg, gap: space.xl },
  hero: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 42, color: colors.ink, textAlign: 'center' },
  heroItalic: { fontFamily: fonts.serifItalic },
  appleButton: { width: '100%', height: 54 },
  join: { height: 54, borderRadius: radius.pill, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  joinText: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.bg },
  coach: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },
  coachLink: { fontFamily: fonts.sansSemi, color: colors.olive },
  terms: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted, textAlign: 'center', lineHeight: 15 },
});
