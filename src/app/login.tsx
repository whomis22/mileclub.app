import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { homeFor } from '@/lib/home';
import { fetchMyProfile, friendlyError, supabase } from '@/lib/supabase';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Log in for people who already have an account, with their email and password.
// Forgot the password? We email a 6-digit code instead, then they choose a new one.
export default function LogIn() {
  const { isDark } = useTheme();
  const { saveProfile } = useStore();
  const [mode, setMode] = useState<'password' | 'code' | 'newpass'>('password');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState<'user' | 'pass' | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState('');
  const [note, setNote] = useState('');
  const email = user.trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const ok = mode === 'code' ? code.length >= 6 : mode === 'newpass' ? password.length >= 8 : emailOk && password.length >= 6;

  async function run(task: () => Promise<void>) {
    setBusy(true);
    setProblem('');
    try {
      await task();
    } catch (e) {
      setProblem(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  // Logged in: bring back their profile from the server, or finish setting it up.
  async function goIn() {
    const profile = await fetchMyProfile();
    router.dismissAll();
    if (profile) {
      saveProfile(profile);
      router.replace(homeFor(profile));
      return;
    }
    const { data } = await supabase.auth.getSession();
    const meta = (data.session?.user.user_metadata ?? {}) as { name?: string; age?: number };
    router.replace({
      pathname: '/onboarding',
      params: { firstName: meta.name?.split(' ')[0] ?? '', ...(meta.age ? { age: String(meta.age) } : {}) },
    });
  }

  function logIn() {
    if (!ok || busy) return;
    run(async () => {
      if (mode === 'password') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goIn();
      } else if (mode === 'code') {
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
        if (error) throw error;
        setPassword('');
        setNote('');
        setMode('newpass');
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        await goIn();
      }
    });
  }

  function forgot() {
    if (!emailOk) {
      setProblem('Enter your email first, then tap “Forgot password?” again.');
      return;
    }
    run(async () => {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (error) throw error;
      setCode('');
      setNote(`We sent a 6-digit code to ${email}.`);
      setMode('code');
    });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.backBtn} accessibilityLabel="Back">
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Logo size={28} />
        <View style={{ width: 44 }} />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            {mode === 'newpass' ? (
              <>
                Choose a new <Text style={styles.italic}>password</Text>
              </>
            ) : (
              <>
                Welcome <Text style={styles.italic}>back</Text>
              </>
            )}
          </Text>
          <Text style={styles.help}>
            {mode === 'password'
              ? 'Log in with your email and password.'
              : mode === 'code'
              ? note || 'Enter the code we emailed you.'
              : 'Make sure it’s 8 characters or more.'}
          </Text>

          {mode === 'password' ? (
            <View style={[styles.field, focus === 'user' && styles.fieldOn]}>
              <Text style={[styles.label, focus === 'user' && { color: colors.link }]}>Email</Text>
              <TextInput
                value={user}
                onChangeText={setUser}
                onFocus={() => setFocus('user')}
                onBlur={() => setFocus(null)}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="username"
                returnKeyType="next"
                style={styles.input}
                placeholderTextColor={colors.dashed}
                selectionColor={colors.olive}
                autoFocus
              />
            </View>
          ) : null}

          {mode === 'code' ? (
            <View style={[styles.field, styles.fieldOn]}>
              <Text style={[styles.label, { color: colors.link }]}>Code</Text>
              <TextInput
                value={code}
                onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 8))}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                returnKeyType="go"
                onSubmitEditing={logIn}
                style={styles.input}
                selectionColor={colors.olive}
                autoFocus
              />
            </View>
          ) : (
            <View style={[styles.field, focus === 'pass' && styles.fieldOn]}>
              <View style={styles.passTop}>
                <Text style={[styles.label, focus === 'pass' && { color: colors.link }]}>
                  {mode === 'newpass' ? 'New password' : 'Password'}
                </Text>
                <Pressable onPress={() => setShow(!show)} hitSlop={8}>
                  <Text style={styles.showText}>{show ? 'Hide' : 'Show'}</Text>
                </Pressable>
              </View>
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocus('pass')}
                onBlur={() => setFocus(null)}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={mode === 'newpass' ? 'new-password' : 'password'}
                textContentType={mode === 'newpass' ? 'newPassword' : 'password'}
                returnKeyType="go"
                onSubmitEditing={logIn}
                style={styles.input}
                selectionColor={colors.olive}
                autoFocus={mode === 'newpass'}
              />
            </View>
          )}

          {mode === 'password' ? (
            <Pressable onPress={forgot} disabled={busy} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
              <Text style={styles.link}>Forgot password?</Text>
            </Pressable>
          ) : null}
          {mode === 'code' ? (
            <Pressable
              onPress={() => {
                setProblem('');
                setMode('password');
              }}
              hitSlop={8}
              style={{ alignSelf: 'flex-start' }}>
              <Text style={styles.link}>Back to password</Text>
            </Pressable>
          ) : null}
          {problem ? <Text style={styles.error}>{problem}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={logIn}
            disabled={!ok || busy}
            style={({ pressed }) => [styles.next, !ok && styles.nextOff, pressed && { opacity: 0.85 }]}>
            {busy ? (
              <ActivityIndicator color={colors.onBrand} />
            ) : (
              <Text style={[styles.nextText, !ok && styles.nextTextOff]}>
                {mode === 'password' ? 'Log in' : mode === 'code' ? 'Continue' : 'Save and log in'}
              </Text>
            )}
          </Pressable>
          <Pressable onPress={() => router.replace('/signup')} hitSlop={8} style={{ alignSelf: 'center' }}>
            <Text style={styles.switchText}>
              New to Mile Club? <Text style={styles.link}>Join</Text>
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.sm },
    backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
    backIcon: { color: colors.ink, fontSize: 24, lineHeight: 28, fontFamily: fonts.sansMedium },
    body: { paddingHorizontal: space.xl, paddingTop: space.xxl, paddingBottom: space.xxl },
    title: { color: colors.ink, fontSize: 32, lineHeight: 42, fontFamily: fonts.serif },
    italic: { fontFamily: fonts.serifItalic },
    help: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: space.sm, marginBottom: space.xl, fontFamily: fonts.sans },
    field: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.edge, borderRadius: radius.md, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: 6, marginBottom: space.lg },
    fieldOn: { borderColor: colors.olive },
    label: { color: colors.muted, fontSize: 13, fontFamily: fonts.sans },
    passTop: { flexDirection: 'row', justifyContent: 'space-between' },
    showText: { color: colors.link, fontSize: 13, fontFamily: fonts.sansSemi },
    input: { color: colors.ink, fontSize: 18, paddingVertical: 4, fontFamily: fonts.sans },
    link: { color: colors.link, fontSize: 15, fontFamily: fonts.sansSemi },
    error: { color: '#B4432F', fontSize: 14, marginTop: space.lg, fontFamily: fonts.sans },
    footer: { paddingHorizontal: space.xl, paddingBottom: space.lg, paddingTop: space.sm, gap: space.lg },
    next: { height: 54, borderRadius: radius.pill, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
    nextOff: { backgroundColor: colors.off },
    nextText: { color: colors.onBrand, fontSize: 15, fontFamily: fonts.sansSemi },
    nextTextOff: { color: colors.offText },
    switchText: { color: colors.muted, fontSize: 14, fontFamily: fonts.sans },
  }),
);
