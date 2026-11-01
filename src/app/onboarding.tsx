import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Body, Button, Chip, Chips, Label } from '@/components/ui';
import {
  ACTIVITIES,
  AVAILABILITY,
  GOALS,
  GROUP_SIZES,
  LEVELS,
  NEIGHBORHOOD_NAMES,
  SOCIAL,
} from '@/data/options';
import type { Profile } from '@/data/types';
import { ROLES, type Role } from '@/data/roles';
import { useStore } from '@/state/store';
import { colors, fonts, isDark, palettes, radius, restartApp, saveThemePref, space, type ThemePref } from '@/theme';

type Draft = Partial<Profile> & { activities: Profile['activities']; goals: Profile['goals']; availability: Profile['availability'] };

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

const STEPS = ['Join as', 'You', 'Where', 'Move', 'Goals', 'When', 'Vibe', 'Look', 'Safety'] as const;

// A small drawing of the Home screen in light or dark, for the "Light or dark?" step.
function LookPreview({ mode, selected, onPress }: { mode: ThemePref; selected: boolean; onPress: () => void }) {
  const p = palettes[mode];
  return (
    <Pressable
      onPress={onPress}
      style={styles.lookCol}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={mode === 'dark' ? 'Dark mode' : 'Light mode'}>
      <Text style={[styles.lookLabel, selected && { color: colors.link }]}>{mode === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
      <View style={[styles.phone, { backgroundColor: p.bg, borderColor: selected ? colors.olive : colors.edge }, selected && { borderWidth: 3 }]}>
        <View style={styles.phoneTop}>
          <View style={[styles.phoneDot, { borderColor: p.edge }]} />
          <View style={[styles.phoneAvatar, { backgroundColor: p.peach }]} />
          <View style={{ gap: 3 }}>
            <View style={[styles.phoneLine, { width: 28, backgroundColor: p.muted }]} />
            <View style={[styles.phoneLine, { width: 20, backgroundColor: p.ink }]} />
          </View>
        </View>
        <Text style={[styles.phoneTitle, { color: p.ink }]}>Your week at{'\n'}Mile Club</Text>
        <View style={styles.phoneCard}>
          <Text style={styles.phoneCardText}>Riverside</Text>
          <View style={styles.phoneJoin} />
        </View>
        <View style={styles.phoneNav}>
          <View style={styles.phoneNavOn} />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.phoneNavDot} />
          ))}
        </View>
      </View>
      <View style={[styles.lookTick, selected && styles.tickOn]}>{selected ? <Text style={styles.tickMark}>✓</Text> : null}</View>
    </Pressable>
  );
}

export default function Onboarding() {
  const { saveProfile } = useStore();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
  const [look, setLook] = useState<ThemePref>(isDark ? 'dark' : 'light');
  const params = useLocalSearchParams<{ firstName?: string; age?: string; photoUri?: string }>();
  const [d, setD] = useState<Draft>({
    activities: [],
    goals: [],
    availability: [],
    firstName: params.firstName,
    age: params.age ? Number(params.age) : undefined,
    photoUri: params.photoUri,
  });
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const valid = [
    !!d.role,
    !!d.firstName?.trim() && !!d.age && d.age >= 18 && d.age <= 99,
    !!d.neighborhood,
    d.activities.length > 0 && !!d.level,
    d.goals.length > 0,
    d.availability.length > 0,
    !!d.groupSize && !!d.social,
    true,
    agreed,
  ][step];

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
    });
    if (!result.canceled) set({ photoUri: result.assets[0].uri });
  }

  function next() {
    if (step < STEPS.length - 1) return setStep(step + 1);
    saveProfile({ ...(d as Profile), firstName: d.firstName!.trim() });
    const changeLook = (look === 'dark') !== isDark;
    saveThemePref(look);
    router.replace('/now');
    // Colours are set when the app starts, so restart it once the profile is saved.
    if (changeLook) setTimeout(() => restartApp(), 400);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable
            onPress={() => (step === 0 ? router.back() : setStep(step - 1))}
            hitSlop={8}
            style={styles.backBtn}
            accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.count}>
            STEP {step + 1} OF {STEPS.length}
          </Text>
          {step === 0 && (
            <>
              <Text style={styles.q}>How will you use Mile Club?</Text>
              <Body muted>You can switch later in your profile.</Body>
              <View style={{ height: space.lg }} />
              {(Object.keys(ROLES) as Role[]).map((r) => {
                const on = d.role === r;
                return (
                  <Pressable key={r} onPress={() => set({ role: r })} style={[styles.role, on && styles.roleOn]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleName, on && { color: colors.onBrand }]}>
                        {r === 'member' ? 'I want to run' : 'I’m a coach'}
                      </Text>
                      <Text style={[styles.rolePitch, on && { color: colors.oliveSoft }]}>{ROLES[r].pitch}</Text>
                    </View>
                    <View style={[styles.tick, on && styles.tickOn]}>
                      {on ? <Text style={styles.tickMark}>✓</Text> : null}
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          {step === 1 && (
            <>
              <Text style={styles.q}>Let’s start with you</Text>
              <Pressable onPress={pickPhoto} style={styles.photoRow}>
                {d.photoUri ? (
                  <Avatar name={d.firstName || '?'} uri={d.photoUri} size={72} />
                ) : (
                  <View style={styles.photoEmpty}>
                    <Text style={{ fontSize: 26 }}>📷</Text>
                  </View>
                )}
                <Text style={styles.photoText}>{d.photoUri ? 'Change photo' : 'Add a profile photo'}</Text>
              </Pressable>
              <Label>First name</Label>
              <TextInput
                value={d.firstName ?? ''}
                onChangeText={(firstName) => set({ firstName })}
                placeholder="Your first name"
                placeholderTextColor={colors.muted}
                style={styles.input}
                autoCapitalize="words"
              />
              <Label>Age</Label>
              <TextInput
                value={d.age ? String(d.age) : ''}
                onChangeText={(t) => {
                  const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
                  set({ age: Number.isNaN(n) ? undefined : n });
                }}
                placeholder="Your age"
                placeholderTextColor={colors.muted}
                style={styles.input}
                keyboardType="number-pad"
                maxLength={2}
              />
              {d.age !== undefined && d.age < 18 ? (
                <Body muted>You need to be 18 or older to join Mile Club.</Body>
              ) : null}
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.q}>Which neighbourhood are you in?</Text>
              <Body muted>We use this to find people and activities close by.</Body>
              <View style={{ height: space.lg }} />
              <Chips>
                {NEIGHBORHOOD_NAMES.map((n) => (
                  <Chip key={n} label={n} selected={d.neighborhood === n} onPress={() => set({ neighborhood: n })} />
                ))}
              </Chips>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.q}>How do you like to move?</Text>
              <Label>Pick any</Label>
              <Chips>
                {ACTIVITIES.map((a) => (
                  <Chip
                    key={a.id}
                    label={`${a.emoji} ${a.label}`}
                    selected={d.activities.includes(a.id)}
                    onPress={() => set({ activities: toggle(d.activities, a.id) })}
                  />
                ))}
              </Chips>
              <Label>Fitness level</Label>
              <Chips>
                {LEVELS.map((l) => (
                  <Chip key={l} label={l} selected={d.level === l} onPress={() => set({ level: l })} />
                ))}
              </Chips>
              {d.activities.includes('running') && (
                <>
                  <Label>Running pace (optional)</Label>
                  <TextInput
                    value={d.pace ?? ''}
                    onChangeText={(pace) => set({ pace })}
                    placeholder="e.g. 6:00/km"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </>
              )}
            </>
          )}

          {step === 4 && (
            <>
              <Text style={styles.q}>What are you hoping for?</Text>
              <Label>Pick any</Label>
              <Chips>
                {GOALS.map((g) => (
                  <Chip key={g} label={g} selected={d.goals.includes(g)} onPress={() => set({ goals: toggle(d.goals, g) })} />
                ))}
              </Chips>
            </>
          )}

          {step === 5 && (
            <>
              <Text style={styles.q}>When are you usually free?</Text>
              <Label>Pick any</Label>
              <Chips>
                {AVAILABILITY.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={d.availability.includes(s)}
                    onPress={() => set({ availability: toggle(d.availability, s) })}
                  />
                ))}
              </Chips>
            </>
          )}

          {step === 6 && (
            <>
              <Text style={styles.q}>What’s your vibe?</Text>
              <Label>Group size</Label>
              <Chips>
                {GROUP_SIZES.map((g) => (
                  <Chip key={g} label={g} selected={d.groupSize === g} onPress={() => set({ groupSize: g })} />
                ))}
              </Chips>
              <Label>While moving, I’m…</Label>
              <Chips>
                {SOCIAL.map((s) => (
                  <Chip key={s} label={s} selected={d.social === s} onPress={() => set({ social: s })} />
                ))}
              </Chips>
            </>
          )}

          {step === 7 && (
            <>
              <Text style={styles.q}>Light or dark?</Text>
              <Body muted>Pick how Mile Club looks. You can switch any time in the side menu.</Body>
              <View style={styles.lookRow}>
                <LookPreview mode="light" selected={look === 'light'} onPress={() => setLook('light')} />
                <LookPreview mode="dark" selected={look === 'dark'} onPress={() => setLook('dark')} />
              </View>
            </>
          )}

          {step === 8 && (
            <>
              <Text style={styles.q}>Staying safe</Text>
              <Body muted>
                You’ll be meeting people in real life. Meet in public places, tell a friend where you’re going, and
                report anyone who makes you uncomfortable.
              </Body>
              <Label>Emergency contact (optional)</Label>
              <TextInput
                value={d.emergencyContact ?? ''}
                onChangeText={(emergencyContact) => set({ emergencyContact })}
                placeholder="Name and phone number"
                placeholderTextColor={colors.muted}
                style={styles.input}
              />
              <Pressable onPress={() => setAgreed(!agreed)} style={styles.agree}>
                <View style={[styles.box, agreed && { backgroundColor: colors.olive, borderColor: colors.olive }]}>
                  {agreed && <Text style={{ color: colors.onBrand, fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={styles.agreeText}>
                  I agree to the community guidelines: be kind, show up, respect everyone’s pace.
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Button title={step === STEPS.length - 1 ? 'Find my people' : 'Next'} onPress={next} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: space.xl, paddingTop: space.sm },
  backBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.edge, alignItems: 'center', justifyContent: 'center' },
  back: { fontSize: 24, lineHeight: 28, color: colors.ink, fontFamily: fonts.sansMedium },
  bar: { flex: 1, height: 3, backgroundColor: colors.track, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: 3, backgroundColor: colors.olive, borderRadius: 2 },
  body: { flex: 1, padding: space.xl },
  count: { fontSize: 10, letterSpacing: 2.5, color: colors.muted, fontFamily: fonts.sansSemi, marginBottom: space.sm },
  q: { fontSize: 38, lineHeight: 40, color: colors.ink, fontFamily: fonts.serif, marginBottom: space.sm },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.edge, borderRadius: radius.md,
    paddingHorizontal: space.lg, paddingVertical: 14, fontSize: 17, color: colors.ink, fontFamily: fonts.sans,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.lg },
  photoEmpty: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 1.5, borderColor: colors.dashed, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  photoText: { fontSize: 16, color: colors.link, fontFamily: fonts.sansSemi },
  agree: { flexDirection: 'row', gap: space.md, marginTop: space.xl, alignItems: 'flex-start' },
  box: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.dashed,
    alignItems: 'center', justifyContent: 'center',
  },
  agreeText: { flex: 1, fontSize: 15, color: colors.ink, lineHeight: 21, fontFamily: fonts.sans },
  role: {
    flexDirection: 'row', gap: space.lg, alignItems: 'center', padding: 22, borderRadius: 26,
    borderWidth: 1, borderColor: colors.edge, marginBottom: space.md,
  },
  roleOn: { backgroundColor: colors.olive, borderColor: colors.olive },
  roleName: { fontSize: 26, lineHeight: 28, color: colors.ink, fontFamily: fonts.serif },
  rolePitch: { fontSize: 13, color: colors.muted, marginTop: 6, lineHeight: 18, fontFamily: fonts.sans },
  tick: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: colors.peach, borderColor: colors.peach },
  tickMark: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  lookRow: { flexDirection: 'row', gap: space.lg, marginTop: space.xl, justifyContent: 'center' },
  lookCol: { flex: 1, alignItems: 'center', gap: space.sm },
  lookLabel: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  phone: { width: '100%', maxWidth: 160, aspectRatio: 0.52, borderRadius: 24, borderWidth: 1.5, padding: 10, overflow: 'hidden' },
  phoneTop: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  phoneDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  phoneAvatar: { width: 14, height: 14, borderRadius: 7 },
  phoneLine: { height: 3, borderRadius: 2 },
  phoneTitle: { fontFamily: fonts.serif, fontSize: 15, lineHeight: 16, marginTop: 10 },
  phoneCard: { flex: 1, marginTop: 8, borderRadius: 14, backgroundColor: '#2F3D29', padding: 8, justifyContent: 'flex-end' },
  phoneCardText: { fontFamily: fonts.serifItalic, fontSize: 14, color: '#F7F1E6' },
  phoneJoin: { width: 34, height: 10, borderRadius: 5, backgroundColor: '#F7F1E6', marginTop: 5 },
  phoneNav: { height: 18, borderRadius: 9, backgroundColor: '#556B2F', marginTop: 8, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3, gap: 5 },
  phoneNavOn: { width: 26, height: 12, borderRadius: 6, backgroundColor: '#F7F1E6' },
  phoneNavDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D9DDC4' },
  lookTick: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, borderColor: colors.dashed, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: space.xl, paddingTop: space.sm },
});
