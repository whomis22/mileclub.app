import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/theme';

// Step-by-step sign-up, one task per screen:
// account details -> verification code -> password -> photo -> username,
// then on to the Mile Club profile questions.
// There is no server yet, so nothing is really sent: any 6-digit code works.

const DIM = '#B9B0CC';
const EDGE = '#3A2D5C';
const STEPS = 5;

function ageFrom(day: number, month: number, year: number) {
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return null;
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day)) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

function Field({ label, counter, error, ...props }: TextInputProps & { label: string; counter?: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: space.lg }}>
      <View style={[styles.field, focused && { borderColor: colors.accent }, !!error && { borderColor: '#FF6B6B' }]}>
        <View style={styles.fieldTop}>
          <Text style={[styles.fieldLabel, focused && { color: colors.accent }]}>{label}</Text>
          {counter && focused ? <Text style={styles.fieldLabel}>{counter}</Text> : null}
        </View>
        <TextInput
          {...props}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor="#6E6585"
          style={styles.fieldInput}
          selectionColor={colors.accent}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function SignUp() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [usePhone, setUsePhone] = useState(false);
  const [contact, setContact] = useState('');
  const [dd, setDd] = useState('');
  const [mm, setMm] = useState('');
  const [yyyy, setYyyy] = useState('');
  const [code, setCode] = useState('');
  const [resent, setResent] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>();
  const suggested = useMemo(() => {
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 11) || 'runner';
    let n = 0;
    for (const ch of base) n = (n * 31 + ch.charCodeAt(0)) % 900;
    return `${base}${n + 100}`;
  }, [name]);
  const [username, setUsername] = useState('');

  const age = dd && mm && yyyy.length === 4 ? ageFrom(Number(dd), Number(mm), Number(yyyy)) : null;
  const contactOk = usePhone
    ? contact.replace(/[^0-9]/g, '').length >= 8
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  const tooYoung = age !== null && age < 18;
  const handle = (username || suggested).replace(/^@/, '');

  const canNext = [
    name.trim().length > 0 && contactOk && age !== null && !tooYoung,
    code.length === 6,
    password.length >= 8,
    true,
    /^[a-zA-Z0-9_]{3,15}$/.test(handle),
  ][step];

  function back() {
    if (step === 0) return router.back();
    setStep(step - 1);
  }

  function next() {
    if (!canNext) return;
    if (step < STEPS - 1) return setStep(step + 1);
    router.replace({
      pathname: '/onboarding',
      params: { firstName: name.trim().split(' ')[0], age: String(age), ...(photoUri ? { photoUri } : {}) },
    });
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  }

  const skippable = step === 3 || step === 4;
  const nextLabel = step === 0 ? 'Next' : step === STEPS - 1 ? 'Done' : 'Next';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={12} style={styles.headerSide}>
          <Text style={styles.headerIcon}>{step === 0 ? '✕' : '←'}</Text>
        </Pressable>
        <Image source={require('../../assets/images/logo-mark.png')} style={styles.headerLogo} contentFit="contain" />
        <View style={styles.headerSide} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              <Text style={styles.title}>Create your account</Text>
              <Field label="Name" value={name} onChangeText={(t) => setName(t.slice(0, 50))} counter={`${name.length} / 50`} autoCapitalize="words" autoFocus />
              <Field
                label={usePhone ? 'Phone' : 'Email'}
                value={contact}
                onChangeText={setContact}
                keyboardType={usePhone ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
                error={contact.length > 4 && !contactOk ? (usePhone ? 'Please enter a valid phone number.' : 'Please enter a valid email.') : undefined}
              />
              <Pressable
                onPress={() => {
                  setUsePhone(!usePhone);
                  setContact('');
                }}
                style={{ marginTop: -space.sm, marginBottom: space.lg }}>
                <Text style={styles.link}>{usePhone ? 'Use email instead' : 'Use phone instead'}</Text>
              </Pressable>
              <Text style={styles.label}>Date of birth</Text>
              <Text style={styles.help}>
                This won’t be shown publicly. Confirm your own age, even if this account is for a club or a coach.
              </Text>
              <View style={styles.dobRow}>
                <View style={{ flex: 1 }}>
                  <Field label="Day" value={dd} onChangeText={(t) => setDd(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} placeholder="DD" />
                </View>
                <View style={{ flex: 1 }}>
                  <Field label="Month" value={mm} onChangeText={(t) => setMm(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} placeholder="MM" />
                </View>
                <View style={{ flex: 1.4 }}>
                  <Field label="Year" value={yyyy} onChangeText={(t) => setYyyy(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={4} placeholder="YYYY" />
                </View>
              </View>
              {tooYoung ? <Text style={styles.error}>You need to be 18 or older to join Mile Club.</Text> : null}
              {dd && mm && yyyy.length === 4 && age === null ? <Text style={styles.error}>That date doesn’t look right.</Text> : null}
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>We sent you a code</Text>
              <Text style={styles.help}>Enter it below to verify {contact.trim()}.</Text>
              <Field label="Verification code" value={code} onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus />
              <Pressable onPress={() => setResent(true)}>
                <Text style={styles.link}>{resent ? 'New code sent.' : usePhone ? 'Didn’t receive a text?' : 'Didn’t receive an email?'}</Text>
              </Pressable>
              <Text style={styles.testNote}>Test version: any 6 numbers work for now.</Text>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>You’ll need a password</Text>
              <Text style={styles.help}>Make sure it’s 8 characters or more.</Text>
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoFocus />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.link}>{showPassword ? 'Hide password' : 'Show password'}</Text>
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>Pick a profile picture</Text>
              <Text style={styles.help}>Have a favourite photo? Add it now so your running buddies know who to look for.</Text>
              <Pressable onPress={pickPhoto} style={styles.photo}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImg} />
                ) : (
                  <Text style={styles.photoPlus}>📷</Text>
                )}
              </Pressable>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.title}>What should we call you?</Text>
              <Text style={styles.help}>Your @username is unique. You can always change it later.</Text>
              <Field
                label="Username"
                value={username ? `@${username}` : ''}
                placeholder={`@${suggested}`}
                onChangeText={(t) => setUsername(t.replace(/^@/, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 15))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {skippable ? (
            <>
              <Pressable
                onPress={next}
                disabled={!canNext}
                style={({ pressed }) => [styles.next, !canNext && styles.nextOff, pressed && { opacity: 0.8 }]}>
                <Text style={[styles.nextText, !canNext && styles.nextTextOff]}>{nextLabel}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (step === 3) setPhotoUri(undefined);
                  if (step === 4) setUsername('');
                  if (step < STEPS - 1) setStep(step + 1);
                  else next();
                }}
                style={({ pressed }) => [styles.skip, pressed && { opacity: 0.7 }]}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={next}
              disabled={!canNext}
              style={({ pressed }) => [styles.next, !canNext && styles.nextOff, pressed && { opacity: 0.8 }]}>
              <Text style={[styles.nextText, !canNext && styles.nextTextOff]}>{nextLabel}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.lg, height: 52 },
  headerSide: { width: 32 },
  headerIcon: { color: '#FFFFFF', fontSize: 22, fontWeight: '600' },
  headerLogo: { width: 34, height: 34 },
  body: { paddingHorizontal: space.xxl, paddingTop: space.lg, paddingBottom: space.xxl },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: space.md },
  help: { color: DIM, fontSize: 15, lineHeight: 21, marginBottom: space.lg },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginTop: space.sm, marginBottom: space.xs },
  field: { borderWidth: 1, borderColor: EDGE, borderRadius: 6, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: 6 },
  fieldTop: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: DIM, fontSize: 13 },
  fieldInput: { color: '#FFFFFF', fontSize: 18, paddingVertical: 4 },
  error: { color: '#FF6B6B', fontSize: 13, marginTop: 4 },
  dobRow: { flexDirection: 'row', gap: space.md },
  link: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  testNote: { color: '#6E6585', fontSize: 13, marginTop: space.xl },
  photo: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: EDGE,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: space.xl,
  },
  photoImg: { width: 160, height: 160 },
  photoPlus: { fontSize: 40 },
  footer: { paddingHorizontal: space.xxl, paddingBottom: space.lg, paddingTop: space.sm, gap: space.md, borderTopWidth: 1, borderTopColor: EDGE },
  next: { height: 52, borderRadius: radius.pill, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  nextOff: { backgroundColor: '#4A3F66' },
  nextText: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  nextTextOff: { color: '#8C83A3' },
  skip: { height: 52, borderRadius: radius.pill, borderWidth: 1, borderColor: '#6E6585', alignItems: 'center', justifyContent: 'center' },
  skipText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
