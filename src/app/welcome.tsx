import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { launchEndsIn } from '@/components/launch-screen';
import { BrandMark } from '@/components/ui';
import { fonts, radius, space, themed, useTheme } from '@/theme';

// Welcome, copied from Yana's design board (2026-11-21): splash with the mc logo,
// three photo onboarding slides, then the Sign Up / Log In screen.
// Splash: black-and-white night run in dark mode, white poster in light mode.
const LIME = '#B9E769';
const H = Dimensions.get('window').height;

const SLIDES = [
  { photo: require('../../assets/images/photos/board-ob1.jpg'), title: 'Meet\nworkout\npartners.', sub: 'Find people into\nyour sport, goals and vibe.' },
  { photo: require('../../assets/images/photos/board-ob2.jpg'), title: 'Explore\nactivities.', sub: 'Running, padel, Pilates,\nyoga, gym and more.' },
  { photo: require('../../assets/images/photos/board-ob3.jpg'), title: 'Build\nyour community.', sub: 'Make friends. Stay active.\nBe part of something bigger.' },
];

export default function Welcome() {
  const { isDark } = useTheme();
  const [step, setStep] = useState(0); // 0 = splash, 1-3 = onboarding
  const [fade] = useState(() => new Animated.Value(1));
  const busy = useRef(false);
  // Opening (Yana, 2026-11-22): the logo stays in the middle, where the loading screen
  // had it, while the photo and buttons fade in around it.
  const [rise] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(launchEndsIn()),
      Animated.timing(rise, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [rise]);
  // One full spin of the logo while the welcome screen fades in (Yana, 2026-11-22).
  const spin = { transform: [{ rotate: rise.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] };
  const showRest = { opacity: rise.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0.7, 1], extrapolate: 'clamp' }) };
  const logIn = () => router.push('/auth?tab=login' as Href);
  const signUp = () => router.push('/auth' as Href);

  function go(next: number) {
    if (busy.current) return;
    busy.current = true;
    Animated.timing(fade, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start(() => (busy.current = false));
    });
  }

  if (step === 0 && !isDark) {
    return (
      <View style={[styles.screen, { backgroundColor: '#FFFFFF' }]}>
        <StatusBar style="dark" />
        <View style={styles.city}>
          <Image source={require('../../assets/images/photos/board-ob3.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['#FFFFFF', 'rgba(255,255,255,0)', 'rgba(255,255,255,0)', '#FFFFFF']} locations={[0, 0.35, 0.55, 0.95]} style={StyleSheet.absoluteFill} />
        </View>
        <SafeAreaView style={styles.safe}>
          <View style={styles.posterMid}>
            <BrandMark height={64} tone="black" />
            <Text style={styles.posterTag}>A COMMUNITY{'\n'}IN MOTION.</Text>
            <Text style={styles.posterSub}>Find your people.{'\n'}Find your place.{'\n'}Get moving.</Text>
            <View style={styles.swoosh} />
          </View>
          <View style={styles.bottom}>
            <Pressable onPress={() => go(1)} style={({ pressed }) => [styles.lime, pressed && { opacity: 0.85 }]}>
              <Text style={styles.limeText}>Get Started</Text>
            </Pressable>
            <Pressable onPress={logIn} hitSlop={10} style={styles.loginWrap}>
              <Text style={[styles.login, { color: '#0A0A0A' }]}>Log In</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (step === 0) {
    return (
      <View style={styles.screen}>
        <StatusBar style="light" />
        <Animated.View style={[StyleSheet.absoluteFill, showRest]}>
          <Image source={require('../../assets/images/photos/board-splash.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.95)']} locations={[0, 0.25, 0.55, 1]} style={StyleSheet.absoluteFill} />
        </Animated.View>
        {/* Same size and spot as the loading screen logo, so it stays put (Yana, 2026-11-22). */}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.splashCenter]}>
          <Animated.View style={spin}>
            <BrandMark height={56} tone="white" />
          </Animated.View>
        </View>
        <SafeAreaView style={[styles.safe, { justifyContent: 'flex-end' }]}>
          <Animated.View style={[styles.bottom, showRest]}>
            <Pressable onPress={() => go(1)} style={({ pressed }) => [styles.lime, pressed && { opacity: 0.85 }]}>
              <Text style={styles.limeText}>Get Started</Text>
            </Pressable>
            <Pressable onPress={logIn} hitSlop={10} style={styles.loginWrap}>
              <Text style={styles.login}>Log In</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  const slide = SLIDES[step - 1]!;
  const last = step === SLIDES.length;
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]}>
        <Image source={slide.photo} style={styles.photo} contentFit="cover" transition={200} />
        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.75)', '#000']} locations={[0.3, 0.55, 0.72]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <SafeAreaView style={styles.safe}>
        <View style={styles.top}>
          <Pressable onPress={() => go(step - 1)} hitSlop={12} accessibilityLabel="Back" style={{ opacity: 0.8 }}>
            <Feather name="chevron-left" size={24} color="#FFFFFF" />
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
        </Animated.View>
        <View style={styles.dots}>
          {SLIDES.map((_, k) => (
            <View key={k} style={[styles.dot, k <= step - 1 && styles.dotOn]} />
          ))}
        </View>
        <View style={styles.bottom}>
          <Pressable onPress={last ? signUp : () => go(step + 1)} style={({ pressed }) => [styles.lime, pressed && { opacity: 0.85 }]}>
            <Text style={styles.limeText}>{last ? 'Join Mile Club' : 'Next'}</Text>
            {!last ? <Feather name="arrow-right" size={18} color="#000" /> : null}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000' },
  safe: { flex: 1, justifyContent: 'space-between' },
  splashCenter: { alignItems: 'center', justifyContent: 'center', paddingBottom: 20 }, // matches the loading screen
  city: { position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.48 },
  posterMid: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: H * 0.12 },
  posterTag: { fontFamily: fonts.logo, fontStyle: 'italic', fontSize: 22, lineHeight: 24, color: '#0A0A0A', textAlign: 'center', marginTop: 26 },
  posterSub: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 22, color: '#2A2A2A', textAlign: 'center', marginTop: 18 },
  swoosh: { width: 90, height: 3, borderRadius: 2, backgroundColor: LIME, marginTop: 16, transform: [{ rotate: '-8deg' }] },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.7 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 6 },
  skip: { fontFamily: fonts.sansSemi, fontSize: 15, color: '#FFFFFF' },
  copy: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 26, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 44, color: '#FFFFFF', letterSpacing: -1 },
  sub: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 23, color: 'rgba(255,255,255,0.85)' },
  dots: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 40, marginBottom: 24 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' },
  dotOn: { backgroundColor: LIME },
  bottom: { paddingHorizontal: 24, paddingBottom: space.lg, gap: space.md },
  lime: { height: 56, borderRadius: radius.pill, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  limeText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#000' },
  loginWrap: { alignSelf: 'center', paddingVertical: 6 },
  login: { fontFamily: fonts.sansSemi, fontSize: 15, color: '#FFFFFF' },
}));
