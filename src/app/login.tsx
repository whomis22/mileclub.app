import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Logo } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Log in for people who already have an account: username (or email/phone) and password.
// There is no server yet, so any username and a password of 6+ characters works.
export default function LogIn() {
  const { isDark } = useTheme();
  const { profile, saveProfile } = useStore();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [focus, setFocus] = useState<'user' | 'pass' | null>(null);
  const ok = user.trim().length >= 3 && password.length >= 6;

  function logIn() {
    if (!ok) return;
    if (!profile) {
      // Test version: make a starter profile from the username.
      const name = user.trim().replace(/^@/, '').split(/[@\s.]/)[0] || 'Runner';
      saveProfile({
        firstName: name.charAt(0).toUpperCase() + name.slice(1),
        age: 30,
        role: 'member',
        neighborhood: 'Centrum',
        activities: ['running'],
        level: 'Beginner',
        goals: [],
        availability: [],
        groupSize: 'Small group (3–6)',
        social: 'A bit of both',
      });
    }
    router.dismissAll();
    router.replace('/now');
  }

  function forgot() {
    Alert.alert(
      'Forgot your password?',
      user.trim()
        ? `We’ll send a reset link to the email or phone for ${user.trim()}.`
        : 'Enter your username, email or phone first, then tap here again.',
      user.trim() ? [{ text: 'Cancel', style: 'cancel' }, { text: 'Send link', onPress: () => Alert.alert('Check your inbox', 'If that account exists, a reset link is on its way.') }] : undefined,
    );
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
            Welcome <Text style={styles.italic}>back</Text>
          </Text>
          <Text style={styles.help}>Log in with your username, email or phone.</Text>

          <View style={[styles.field, focus === 'user' && styles.fieldOn]}>
            <Text style={[styles.label, focus === 'user' && { color: colors.link }]}>Username, email or phone</Text>
            <TextInput
              value={user}
              onChangeText={setUser}
              onFocus={() => setFocus('user')}
              onBlur={() => setFocus(null)}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              returnKeyType="next"
              style={styles.input}
              placeholderTextColor={colors.dashed}
              selectionColor={colors.olive}
              autoFocus
            />
          </View>

          <View style={[styles.field, focus === 'pass' && styles.fieldOn]}>
            <View style={styles.passTop}>
              <Text style={[styles.label, focus === 'pass' && { color: colors.link }]}>Password</Text>
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
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={logIn}
              style={styles.input}
              selectionColor={colors.olive}
            />
          </View>

          <Pressable onPress={forgot} hitSlop={8} style={{ alignSelf: 'flex-start' }}>
            <Text style={styles.link}>Forgot password?</Text>
          </Pressable>
          <Text style={styles.testNote}>Test version: any username and a password of 6 or more characters work.</Text>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            onPress={logIn}
            disabled={!ok}
            style={({ pressed }) => [styles.next, !ok && styles.nextOff, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.nextText, !ok && styles.nextTextOff]}>Log in</Text>
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
    title: { color: colors.ink, fontSize: 40, lineHeight: 42, fontFamily: fonts.serif },
    italic: { fontFamily: fonts.serifItalic },
    help: { color: colors.muted, fontSize: 15, lineHeight: 21, marginTop: space.sm, marginBottom: space.xl, fontFamily: fonts.sans },
    field: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.edge, borderRadius: radius.md, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: 6, marginBottom: space.lg },
    fieldOn: { borderColor: colors.olive },
    label: { color: colors.muted, fontSize: 13, fontFamily: fonts.sans },
    passTop: { flexDirection: 'row', justifyContent: 'space-between' },
    showText: { color: colors.link, fontSize: 13, fontFamily: fonts.sansSemi },
    input: { color: colors.ink, fontSize: 18, paddingVertical: 4, fontFamily: fonts.sans },
    link: { color: colors.link, fontSize: 15, fontFamily: fonts.sansSemi },
    testNote: { color: colors.muted, fontSize: 13, marginTop: space.xl, fontFamily: fonts.sans },
    footer: { paddingHorizontal: space.xl, paddingBottom: space.lg, paddingTop: space.sm, gap: space.lg },
    next: { height: 54, borderRadius: radius.pill, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
    nextOff: { backgroundColor: colors.off },
    nextText: { color: colors.onBrand, fontSize: 15, fontFamily: fonts.sansSemi },
    nextTextOff: { color: colors.offText },
    switchText: { color: colors.muted, fontSize: 14, fontFamily: fonts.sans },
  }),
);
