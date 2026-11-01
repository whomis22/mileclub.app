import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useRef, useState, type ComponentRef, type Ref } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
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

import { COUNTRIES, defaultCountry, flagOf, type Country } from '@/data/countries';
import { colors, fonts, isDark, radius, space } from '@/theme';

// Step-by-step sign-up, one task per screen:
// account details -> verification code -> password -> photo -> username,
// then on to the Mile Club profile questions.
// There is no server yet, so nothing is really sent: any 6-digit code works.
// Coming from "Continue with Apple", Apple has already checked the email, so the
// code and password steps are skipped.

const EDGE = colors.edge;
const ERROR = '#B4432F';

function ageFrom(day: number, month: number, year: number) {
  const birth = new Date(year, month - 1, day);
  if (birth.getFullYear() !== year || birth.getMonth() !== month - 1 || birth.getDate() !== day) return null;
  const now = new Date();
  let age = now.getFullYear() - year;
  if (now.getMonth() < month - 1 || (now.getMonth() === month - 1 && now.getDate() < day)) age -= 1;
  return age >= 0 && age < 120 ? age : null;
}

function Field({
  label,
  counter,
  error,
  inputRef,
  ...props
}: TextInputProps & { label: string; counter?: string; error?: string; inputRef?: Ref<ComponentRef<typeof TextInput>> }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: space.lg }}>
      <View style={[styles.field, focused && { borderColor: colors.olive }, !!error && { borderColor: ERROR }]}>
        <View style={styles.fieldTop}>
          <Text style={[styles.fieldLabel, focused && { color: colors.link }]}>{label}</Text>
          {counter && focused ? <Text style={styles.fieldLabel}>{counter}</Text> : null}
        </View>
        <TextInput
          {...props}
          ref={inputRef}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor="#A39C8C"
          style={styles.fieldInput}
          selectionColor={colors.olive}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function CountryPicker({ visible, onPick, onClose }: { visible: boolean; onPick: (c: Country) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^\+/, '');
    if (!s) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(s) || c.dial.slice(1).startsWith(s) || c.code.toLowerCase() === s);
  }, [q]);
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.sheet} edges={['top', 'bottom']}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Country code</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={styles.link}>Close</Text>
          </Pressable>
        </View>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search country or code"
          placeholderTextColor="#A39C8C"
          style={styles.search}
          autoCorrect={false}
        />
        <FlatList
          data={list}
          keyExtractor={(c) => c.code}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onPick(item);
                setQ('');
              }}
              style={({ pressed }) => [styles.countryRow, pressed && { backgroundColor: colors.sand }]}>
              <Text style={styles.countryFlag}>{flagOf(item.code)}</Text>
              <Text style={styles.countryName}>{item.name}</Text>
              <Text style={styles.countryDial}>{item.dial}</Text>
            </Pressable>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

export default function SignUp() {
  const params = useLocalSearchParams<{ apple?: string; name?: string; email?: string }>();
  const viaApple = params.apple === '1';
  const flow = viaApple ? [0, 3, 4] : [0, 1, 2, 3, 4];
  const [pos, setPos] = useState(0);
  const step = flow[pos];
  const isLast = pos === flow.length - 1;
  const [name, setName] = useState(params.name ?? '');
  const [usePhone, setUsePhone] = useState(false);
  const [country, setCountry] = useState<Country>(() => defaultCountry());
  const [picking, setPicking] = useState(false);
  const [contact, setContact] = useState(params.email ?? '');
  const [dd, setDd] = useState('');
  const [mm, setMm] = useState('');
  const [yyyy, setYyyy] = useState('');
  const monthRef = useRef<ComponentRef<typeof TextInput>>(null);
  const yearRef = useRef<ComponentRef<typeof TextInput>>(null);
  const dayRef = useRef<ComponentRef<typeof TextInput>>(null);
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
  const digits = contact.replace(/[^0-9]/g, '');
  const contactOk = viaApple
    ? true
    : usePhone
    ? digits.length >= 6 && digits.length <= 14
    : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.trim());
  // Full number in international form, e.g. +44 7700900123 (a leading 0 is dropped).
  const fullPhone = `${country.dial} ${digits.replace(/^0+/, '')}`;
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
    if (pos === 0) return router.back();
    setPos(pos - 1);
  }

  function next() {
    if (!canNext) return;
    if (!isLast) return setPos(pos + 1);
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
  const nextLabel = isLast ? 'Done' : 'Next';

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.header}>
        <Pressable onPress={back} hitSlop={8} style={styles.backBtn} accessibilityLabel={pos === 0 ? 'Close' : 'Back'}>
          <Text style={styles.backIcon}>{pos === 0 ? '✕' : '‹'}</Text>
        </Pressable>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${((pos + 1) / flow.length) * 100}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.stepLabel}>
            STEP {pos + 1} OF {flow.length}
          </Text>
          {step === 0 && (
            <>
              <Text style={styles.title}>
                Create your <Text style={styles.titleItalic}>account</Text>
              </Text>
              <Field label="Name" value={name} onChangeText={(t) => setName(t.slice(0, 50))} counter={`${name.length} / 50`} autoCapitalize="words" autoFocus />
              {viaApple ? (
                <View style={styles.appleNote}>
                  <Text style={styles.appleNoteText}> Signed in with Apple{contact ? ` · ${contact}` : ''}</Text>
                </View>
              ) : (
                <>
                  {usePhone ? (
                    <View style={styles.phoneRow}>
                      <Pressable
                        onPress={() => setPicking(true)}
                        style={styles.countryBtn}
                        accessibilityLabel={`Country code ${country.name} ${country.dial}. Tap to change.`}>
                        <Text style={styles.fieldLabel}>Code</Text>
                        <Text style={styles.countryBtnText}>
                          {flagOf(country.code)} {country.dial} ▾
                        </Text>
                      </Pressable>
                      <View style={{ flex: 1 }}>
                        <Field
                          label="Phone"
                          value={contact}
                          onChangeText={(t) => setContact(t.replace(/[^0-9 ]/g, '').slice(0, 18))}
                          keyboardType="phone-pad"
                          autoCorrect={false}
                          error={contact.length > 4 && !contactOk ? 'Please enter a valid phone number.' : undefined}
                        />
                      </View>
                    </View>
                  ) : (
                    <Field
                      label="Email"
                      value={contact}
                      onChangeText={setContact}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={contact.length > 4 && !contactOk ? 'Please enter a valid email.' : undefined}
                    />
                  )}
                  <Pressable
                    onPress={() => {
                      setUsePhone(!usePhone);
                      setContact('');
                    }}
                    style={{ marginTop: -space.sm, marginBottom: space.lg }}>
                    <Text style={styles.link}>{usePhone ? 'Use email instead' : 'Use phone instead'}</Text>
                  </Pressable>
                </>
              )}
              <Text style={styles.label}>Date of birth</Text>
              <Text style={styles.help}>
                This won’t be shown publicly. Confirm your own age, even if this account is for a club or a coach.
              </Text>
              <View style={styles.dobRow}>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Day"
                    inputRef={dayRef}
                    value={dd}
                    onChangeText={(t) => {
                      let v = t.replace(/[^0-9]/g, '');
                      // A first digit of 4-9 can only be a one-digit day, so fill in the 0.
                      if (v.length === 1 && Number(v) > 3) v = `0${v}`;
                      setDd(v);
                      if (v.length === 2) monthRef.current?.focus();
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="DD"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field
                    label="Month"
                    inputRef={monthRef}
                    value={mm}
                    onChangeText={(t) => {
                      let v = t.replace(/[^0-9]/g, '');
                      if (v.length === 1 && Number(v) > 1) v = `0${v}`;
                      setMm(v);
                      if (v.length === 2) yearRef.current?.focus();
                    }}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && mm === '') dayRef.current?.focus();
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="MM"
                  />
                </View>
                <View style={{ flex: 1.4 }}>
                  <Field
                    label="Year"
                    inputRef={yearRef}
                    value={yyyy}
                    onChangeText={(t) => setYyyy(t.replace(/[^0-9]/g, ''))}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && yyyy === '') monthRef.current?.focus();
                    }}
                    keyboardType="number-pad"
                    maxLength={4}
                    placeholder="YYYY"
                  />
                </View>
              </View>
              {tooYoung ? <Text style={styles.error}>You need to be 18 or older to join Mile Club.</Text> : null}
              {dd && mm && yyyy.length === 4 && age === null ? <Text style={styles.error}>That date doesn’t look right.</Text> : null}
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.title}>
                We sent you a <Text style={styles.titleItalic}>code</Text>
              </Text>
              <Text style={styles.help}>Enter it below to verify {usePhone ? fullPhone : contact.trim()}.</Text>
              <Field label="Verification code" value={code} onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus />
              <Pressable onPress={() => setResent(true)}>
                <Text style={styles.link}>{resent ? 'New code sent.' : usePhone ? 'Didn’t receive a text?' : 'Didn’t receive an email?'}</Text>
              </Pressable>
              <Text style={styles.testNote}>Test version: any 6 numbers work for now.</Text>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.title}>
                You’ll need a <Text style={styles.titleItalic}>password</Text>
              </Text>
              <Text style={styles.help}>Make sure it’s 8 characters or more.</Text>
              <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoFocus />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.link}>{showPassword ? 'Hide password' : 'Show password'}</Text>
              </Pressable>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.title}>
                Pick a profile <Text style={styles.titleItalic}>picture</Text>
              </Text>
              <Text style={styles.help}>Have a favourite photo? Add it now so your running buddies know who to look for.</Text>
              <Pressable onPress={pickPhoto} style={styles.photo}>
                {photoUri ? <Image source={{ uri: photoUri }} style={styles.photoImg} /> : <Text style={styles.photoPlus}>+</Text>}
              </Pressable>
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.title}>
                What should we <Text style={styles.titleItalic}>call you?</Text>
              </Text>
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
          <Pressable
            onPress={next}
            disabled={!canNext}
            style={({ pressed }) => [styles.next, !canNext && styles.nextOff, pressed && { opacity: 0.85 }]}>
            <Text style={[styles.nextText, !canNext && styles.nextTextOff]}>{nextLabel}</Text>
          </Pressable>
          {skippable ? (
            <Pressable
              onPress={() => {
                if (step === 3) setPhotoUri(undefined);
                if (step === 4) setUsername('');
                if (!isLast) setPos(pos + 1);
                else next();
              }}
              style={({ pressed }) => [styles.skip, pressed && { opacity: 0.7 }]}>
              <Text style={styles.skipText}>Skip for now</Text>
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <CountryPicker
        visible={picking}
        onClose={() => setPicking(false)}
        onPick={(c) => {
          setCountry(c);
          setPicking(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: space.xl, paddingTop: space.sm },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: EDGE, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: colors.ink, fontSize: 22, lineHeight: 26, fontFamily: fonts.sansMedium },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: colors.track, overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2, backgroundColor: colors.olive },
  body: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxl },
  stepLabel: { color: colors.muted, fontSize: 10, letterSpacing: 2.5, fontFamily: fonts.sansSemi, marginBottom: space.sm },
  title: { color: colors.ink, fontSize: 38, lineHeight: 40, fontFamily: fonts.serif, marginBottom: space.lg },
  titleItalic: { fontFamily: fonts.serifItalic },
  help: { color: colors.muted, fontSize: 15, lineHeight: 21, marginBottom: space.lg, fontFamily: fonts.sans },
  label: { color: colors.ink, fontSize: 16, fontFamily: fonts.sansSemi, marginTop: space.sm, marginBottom: space.xs },
  field: { backgroundColor: colors.card, borderWidth: 1, borderColor: EDGE, borderRadius: radius.md, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: 6 },
  fieldTop: { flexDirection: 'row', justifyContent: 'space-between' },
  fieldLabel: { color: colors.muted, fontSize: 13, fontFamily: fonts.sans },
  fieldInput: { color: colors.ink, fontSize: 18, paddingVertical: 4, fontFamily: fonts.sans },
  error: { color: ERROR, fontSize: 13, marginTop: 4, fontFamily: fonts.sans },
  dobRow: { flexDirection: 'row', gap: space.md },
  phoneRow: { flexDirection: 'row', gap: space.sm },
  countryBtn: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: EDGE,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: 6,
    marginBottom: space.lg,
    minWidth: 104,
  },
  countryBtnText: { color: colors.ink, fontSize: 18, paddingVertical: 4, fontFamily: fonts.sans },
  appleNote: { backgroundColor: colors.card, borderWidth: 1, borderColor: EDGE, borderRadius: radius.md, padding: space.md, marginBottom: space.lg },
  appleNoteText: { color: colors.ink, fontSize: 15, fontFamily: fonts.sans },
  link: { color: colors.link, fontSize: 15, fontFamily: fonts.sansSemi },
  testNote: { color: colors.muted, fontSize: 13, marginTop: space.xl, fontFamily: fonts.sans },
  photo: {
    alignSelf: 'center',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.dashed,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: space.xl,
  },
  photoImg: { width: 160, height: 160 },
  photoPlus: { fontSize: 44, color: colors.link, fontFamily: fonts.sans },
  footer: { paddingHorizontal: space.xl, paddingBottom: space.lg, paddingTop: space.sm, gap: space.md },
  next: { height: 54, borderRadius: radius.pill, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  nextOff: { backgroundColor: colors.off },
  nextText: { color: colors.onBrand, fontSize: 15, fontFamily: fonts.sansSemi },
  nextTextOff: { color: colors.offText },
  skip: { height: 54, borderRadius: radius.pill, borderWidth: 1, borderColor: EDGE, alignItems: 'center', justifyContent: 'center' },
  skipText: { color: colors.ink, fontSize: 15, fontFamily: fonts.sansSemi },
  sheet: { flex: 1, backgroundColor: colors.bg },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.lg, paddingBottom: space.md },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.ink },
  search: {
    marginHorizontal: space.xl,
    marginBottom: space.sm,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.sand,
    paddingHorizontal: space.lg,
    fontSize: 15,
    color: colors.ink,
    fontFamily: fonts.sans,
  },
  countryRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.xl, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  countryFlag: { fontSize: 22 },
  countryName: { flex: 1, fontSize: 16, color: colors.ink, fontFamily: fonts.sans },
  countryDial: { fontSize: 15, color: colors.muted, fontFamily: fonts.sansMedium },
});
