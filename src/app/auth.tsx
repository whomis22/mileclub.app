import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo, Wordmark } from '@/components/ui';
import { homeFor } from '@/lib/home';
import { fetchMyProfile, friendlyError, supabase } from '@/lib/supabase';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Sign Up / Log In, copied from Yana's design board (2026-11-21).
// Sign Up hands name, email and password to the step-by-step sign-up (code, photo, username).
// Log In is real: email + password against Mile Club's server.

function Input({ icon, ...props }: TextInputProps & { icon: keyof typeof Feather.glyphMap }) {
  useTheme();
  return (
    <View style={styles.input}>
      <Feather name={icon} size={18} color={colors.muted} />
      <TextInput placeholderTextColor={colors.muted} style={styles.inputText} {...props} />
    </View>
  );
}

export default function Auth() {
  const { isDark } = useTheme();
  const { saveProfile } = useStore();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<'signup' | 'login'>(params.tab === 'login' ? 'login' : 'signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const mail = email.trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  const ok = tab === 'signup' ? name.trim().length > 0 && emailOk && password.length >= 8 : emailOk && password.length >= 6;

  async function submit() {
    setProblem('');
    if (!ok) {
      setProblem(tab === 'signup' ? 'Add your name, a real email and a password of 8+ characters.' : 'Enter your email and password.');
      return;
    }
    if (tab === 'signup') {
      router.push({ pathname: '/signup', params: { name: name.trim(), email: mail, password } });
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: mail, password });
      if (error) throw error;
      const profile = await fetchMyProfile();
      router.dismissAll();
      if (profile) {
        saveProfile(profile);
        router.replace(homeFor(profile));
      } else {
        const { data } = await supabase.auth.getSession();
        const meta = (data.session?.user.user_metadata ?? {}) as { name?: string; age?: number };
        router.replace({ pathname: '/onboarding', params: { firstName: meta.name?.split(' ')[0] ?? '', ...(meta.age ? { age: String(meta.age) } : {}) } });
      }
    } catch (e) {
      setProblem(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  async function apple() {
    if (Platform.OS !== 'ios' || !(await AppleAuthentication.isAvailableAsync().catch(() => false))) {
      Alert.alert('Apple sign-in', 'Apple sign-in works on iPhone.');
      return;
    }
    try {
      const c = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      const fullName = [c.fullName?.givenName, c.fullName?.familyName].filter(Boolean).join(' ');
      router.push({ pathname: '/signup', params: { apple: '1', name: fullName, email: c.email ?? '' } });
    } catch (e) {
      if ((e as { code?: string }).code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('Apple sign-in didn’t work', 'Please try again, or sign up with email.');
    }
  }

  const google = (
    <Pressable key="g" style={styles.social} onPress={() => Alert.alert('Google sign-in', 'Coming soon.')} accessibilityLabel="Continue with Google">
      <Ionicons name="logo-google" size={20} color={isDark ? '#FFFFFF' : '#0A0A0A'} />
    </Pressable>
  );
  const appleBtn = (
    <Pressable key="a" style={styles.social} onPress={apple} accessibilityLabel="Continue with Apple">
      <Ionicons name="logo-apple" size={22} color={isDark ? '#FFFFFF' : '#0A0A0A'} />
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back} accessibilityLabel="Back">
        <Feather name="chevron-left" size={24} color={colors.ink} />
      </Pressable>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Logo size={64} m="#B9E769" c={isDark ? '#FFFFFF' : '#0A0A0A'} />
            <Wordmark size={24} color={colors.ink} />
          </View>

          <View style={styles.tabs}>
            {(['signup', 'login'] as const).map((t) => (
              <Pressable key={t} style={styles.tab} onPress={() => { setTab(t); setProblem(''); }}>
                <Text style={[styles.tabText, tab === t && styles.tabTextOn]}>{t === 'signup' ? 'Sign Up' : 'Log In'}</Text>
                <View style={[styles.tabLine, tab === t && styles.tabLineOn]} />
              </Pressable>
            ))}
          </View>

          {tab === 'signup' ? (
            <Input icon="user" placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" textContentType="name" />
          ) : null}
          <Input icon="mail" placeholder="Email Address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" textContentType={tab === 'signup' ? 'emailAddress' : 'username'} />
          <Input icon="lock" placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={tab === 'signup' ? 'new-password' : 'current-password'} textContentType={tab === 'signup' ? 'newPassword' : 'password'} onSubmitEditing={submit} />

          {tab === 'login' ? (
            <Pressable onPress={() => router.push('/login' as Href)} style={{ alignSelf: 'flex-end', marginBottom: 4 }}>
              <Text style={styles.forgot}>Forgot password?</Text>
            </Pressable>
          ) : null}
          {problem ? <Text style={styles.problem}>{problem}</Text> : null}

          <Pressable onPress={submit} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}>
            {busy ? <ActivityIndicator color="#000" /> : <Text style={styles.ctaText}>{tab === 'signup' ? 'Create Account' : 'Log In'}</Text>}
          </Pressable>

          <Text style={styles.or}>or continue with</Text>
          <View style={styles.socialRow}>{isDark ? [appleBtn, google] : [google, appleBtn]}</View>

          <Pressable onPress={() => setTab(tab === 'signup' ? 'login' : 'signup')} style={{ alignSelf: 'center', marginTop: space.lg }}>
            <Text style={styles.already}>
              {tab === 'signup' ? 'Already have an account? ' : 'New to Mile Club? '}
              <Text style={styles.alreadyLink}>{tab === 'signup' ? 'Log in' : 'Sign up'}</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  back: { position: 'absolute', top: 54, left: 16, zIndex: 2, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 26, paddingTop: 56, paddingBottom: 40 },
  logo: { alignItems: 'center', gap: 2, marginBottom: 34 },
  tabs: { flexDirection: 'row', marginBottom: 26 },
  tab: { flex: 1, alignItems: 'center' },
  tabText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.muted, paddingBottom: 10 },
  tabTextOn: { fontFamily: fonts.sansBold, color: colors.ink },
  tabLine: { height: 2, alignSelf: 'stretch', backgroundColor: colors.line },
  tabLineOn: { height: 3, backgroundColor: colors.cta, borderRadius: 2 },
  input: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 54, borderRadius: 16, backgroundColor: colors.card, paddingHorizontal: 16, marginBottom: 12 },
  inputText: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, height: '100%' },
  forgot: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.link },
  problem: { fontFamily: fonts.sans, fontSize: 13, color: colors.danger, marginBottom: 4 },
  cta: { height: 54, borderRadius: radius.pill, backgroundColor: '#B9E769', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  ctaText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#000' },
  or: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 24, marginBottom: 14 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  social: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  already: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  alreadyLink: { fontFamily: fonts.sansBold, color: colors.ink },
}));
