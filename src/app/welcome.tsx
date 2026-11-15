import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from '@/components/ui';
import { colors, fonts, radius, space, themed } from '@/theme';

// Welcome, laid out like Hinge (Yana, 2026-11-15): a full-screen photo that
// slowly changes, the logo and one line in the middle, and big buttons at the
// bottom. Same look in light and dark (it's a photo screen).

const SLIDES = [
  { photo: require('../../assets/images/photos/padel.jpg'), tag: 'Rooftop padel' },
  { photo: require('../../assets/images/photos/football.jpg'), tag: '5-a-side under the lights' },
  { photo: require('../../assets/images/photos/run-london.jpg'), tag: 'Sunset runs with new faces' },
];

export default function Welcome() {
  const logIn = () => router.push('/login' as Href);
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
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Slideshow />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.85)']}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.middle}>
          <Logo size={64} m="#FFFFFF" c={colors.peach} />
          <Text style={styles.brand}>Mile Club</Text>
          <Text style={styles.hero}>Plans worth leaving the house for.</Text>
        </View>

        <View style={styles.bottom}>
          {appleReady ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={28}
              style={styles.appleButton}
              onPress={continueWithApple}
            />
          ) : null}
          <Pressable onPress={signUp} style={({ pressed }) => [styles.join, pressed && { opacity: 0.85 }]}>
            <Text style={styles.joinText}>Create account</Text>
          </Pressable>
          <Pressable onPress={logIn} hitSlop={10} style={styles.loginWrap}>
            <Text style={styles.login}>Sign in</Text>
          </Pressable>
          <Text style={styles.coach}>
            Are you a coach?{' '}
            <Text style={styles.coachLink} onPress={signUp}>
              Host sessions
            </Text>
          </Text>
          <Text style={styles.terms}>
            By continuing, you agree to our Terms. See how we use your data in our Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Photos that gently fade into each other, with a small label at the top.
function Slideshow() {
  const [i, setI] = useState(0);
  const [fade] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const t = setInterval(() => {
      Animated.timing(fade, { toValue: 0, duration: 450, useNativeDriver: true }).start(() => {
        setI((n) => (n + 1) % SLIDES.length);
        Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }).start();
      });
    }, 4200);
    return () => clearInterval(t);
  }, [fade]);
  const slide = SLIDES[i];
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade, backgroundColor: '#111' }]}>
      <Image source={slide.photo} style={StyleSheet.absoluteFill} contentFit="cover" />
      <SafeAreaView edges={['top']} style={styles.tagWrap}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{slide.tag}</Text>
        </View>
        <View style={styles.dots}>
          {SLIDES.map((_, k) => (
            <View key={k} style={[styles.dot, k === i && styles.dotOn]} />
          ))}
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111' },
  safe: { flex: 1, justifyContent: 'space-between' },
  tagWrap: { alignItems: 'center', paddingTop: space.md, gap: 10 },
  tag: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 14 },
  tagText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#FFFFFF' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.45)' },
  dotOn: { width: 18, backgroundColor: '#FFFFFF' },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingTop: 80, gap: 6 },
  brand: { fontFamily: fonts.serif, fontSize: 30, color: '#FFFFFF', letterSpacing: -0.8 },
  hero: { fontFamily: fonts.sansMedium, fontSize: 17, lineHeight: 24, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },
  bottom: { paddingHorizontal: 24, paddingBottom: space.lg, gap: space.md },
  appleButton: { width: '100%', height: 56 },
  join: { height: 56, borderRadius: radius.pill, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  joinText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#FFFFFF' },
  loginWrap: { alignSelf: 'center', paddingVertical: 6 },
  login: { fontFamily: fonts.sansBold, fontSize: 16, color: '#FFFFFF' },
  coach: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  coachLink: { fontFamily: fonts.sansBold, color: colors.peach },
  terms: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 15 },
}));
