import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';

import { Logo } from '@/components/ui';
import Feather from '@expo/vector-icons/Feather';

import { fonts, radius, space, themed, useTheme } from '@/theme';

// Welcome, from Yana's design board (2026-11-21): a photo splash with the mc logo,
// then three onboarding slides, then sign up. Always black (it's a photo screen).
const LIME = '#B9E769';
const H = Dimensions.get('window').height;

const SLIDES = [
  { photo: { uri: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=1000&q=75' }, title: 'Meet\nworkout\npartners.', sub: 'Find people who match your sport, goals and vibe.' },
  { photo: require('../../assets/images/photos/padel.jpg'), title: 'Explore\nactivities.', sub: 'Running, padel, Pilates, yoga, gym and more.' },
  { photo: require('../../assets/images/photos/football.jpg'), title: 'Build\nyour community.', sub: 'Make friends. Stay active. Be part of something bigger.' },
];

export default function Welcome() {
  useTheme();
  const [step, setStep] = useState(0); // 0 = splash, 1-3 = onboarding
  const [fade] = useState(() => new Animated.Value(1));
  const [appleReady, setAppleReady] = useState(false);
  const busy = useRef(false);
  const logIn = () => router.push('/login' as Href);
  const signUp = () => router.push('/signup');

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAppleReady).catch(() => setAppleReady(false));
  }, []);

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

  function go(next: number) {
    if (busy.current) return;
    busy.current = true;
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start(() => (busy.current = false));
    });
  }

  if (step === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <Image source={require('../../assets/images/photos/run-london.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.92)']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.splashMid}>
            <Logo size={96} m="#FFFFFF" c={LIME} />
            <Text style={styles.word}>MILE{'\n'}CLUB</Text>
            <Text style={styles.tagline}>A community in motion.</Text>
          </View>
          <View style={styles.bottom}>
            <Pressable onPress={() => go(1)} style={({ pressed }) => [styles.lime, pressed && { opacity: 0.85 }]}>
              <Text style={styles.limeText}>Get Started</Text>
            </Pressable>
            <Pressable onPress={logIn} hitSlop={10} style={styles.loginWrap}>
              <Text style={styles.login}>Log In</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const slide = SLIDES[step - 1];
  const last = step === SLIDES.length;
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={slide.photo} style={styles.photo} contentFit="cover" transition={200} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)', '#000']} locations={[0.35, 0.62, 0.78]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable onPress={() => go(step - 1)} hitSlop={12} accessibilityLabel="Back">
            <Feather name="chevron-left" size={26} color="#FFFFFF" />
          </Pressable>
          {!last ? (
            <Pressable onPress={() => go(SLIDES.length)} hitSlop={12}>
              <Text style={styles.skip}>Skip</Text>
            </Pressable>
          ) : null}
        </View>
        <Animated.View style={[styles.copy, { opacity: fade }]}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.sub}>{slide.sub}</Text>
          <View style={styles.dots}>
            {SLIDES.map((_, k) => (
              <View key={k} style={[styles.dot, k === step - 1 && styles.dotOn]} />
            ))}
          </View>
        </Animated.View>
        <View style={styles.bottom}>
          <Pressable onPress={last ? signUp : () => go(step + 1)} style={({ pressed }) => [styles.lime, pressed && { opacity: 0.85 }]}>
            <Text style={styles.limeText}>{last ? 'Join Mile Club' : 'Next'}</Text>
            {!last ? <Feather name="arrow-right" size={18} color="#000" /> : null}
          </Pressable>
          {last && appleReady ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={28}
              style={styles.appleButton}
              onPress={continueWithApple}
            />
          ) : null}
          {last ? (
            <Pressable onPress={logIn} hitSlop={10} style={styles.loginWrap}>
              <Text style={styles.login}>I already have an account</Text>
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, justifyContent: 'space-between' },
  splashMid: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  word: { fontFamily: fonts.logo, fontSize: 40, lineHeight: 40, color: '#FFFFFF', textAlign: 'center', letterSpacing: -0.5, marginTop: 4, fontStyle: 'italic' },
  tagline: { fontFamily: fonts.sansSemi, fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 12 },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.72 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 6 },
  skip: { fontFamily: fonts.sansSemi, fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  copy: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 26, paddingBottom: 26, gap: 10 },
  title: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, color: '#FFFFFF', letterSpacing: -1 },
  sub: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 22, color: 'rgba(255,255,255,0.75)', maxWidth: 300 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotOn: { width: 20, backgroundColor: LIME },
  bottom: { paddingHorizontal: 24, paddingBottom: space.lg, gap: space.md },
  lime: { height: 56, borderRadius: radius.pill, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  limeText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#000' },
  appleButton: { width: '100%', height: 56 },
  loginWrap: { alignSelf: 'center', paddingVertical: 6 },
  login: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFFFFF' },
}));
