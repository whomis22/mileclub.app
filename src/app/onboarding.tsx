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
import { colors, radius, space } from '@/theme';

type Draft = Partial<Profile> & { activities: Profile['activities']; goals: Profile['goals']; availability: Profile['availability'] };

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

const STEPS = ['Join as', 'You', 'Where', 'Move', 'Goals', 'When', 'Vibe', 'Safety'] as const;

export default function Onboarding() {
  const { saveProfile } = useStore();
  const [step, setStep] = useState(0);
  const [agreed, setAgreed] = useState(false);
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
    router.replace('/feed');
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => (step === 0 ? router.back() : setStep(step - 1))} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
          <Text style={styles.count}>
            {step + 1} / {STEPS.length}
          </Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${((step + 1) / STEPS.length) * 100}%` }]} />
        </View>

        <View style={styles.body}>
          {step === 0 && (
            <>
              <Text style={styles.q}>How will you use Mile Club?</Text>
              <Body muted>You can switch later in your profile.</Body>
              <View style={{ height: space.lg }} />
              {(Object.keys(ROLES) as Role[]).map((r) => {
                const on = d.role === r;
                return (
                  <Pressable key={r} onPress={() => set({ role: r })} style={[styles.role, on && styles.roleOn]}>
                    <Text style={{ fontSize: 34 }}>{ROLES[r].emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleName, on && { color: '#fff' }]}>
                        {r === 'member' ? `I want to move: join the ${ROLES.member.name}` : `I’m a coach: become a ${ROLES.coach.name}`}
                      </Text>
                      <Text style={[styles.rolePitch, on && { color: '#fff', opacity: 0.85 }]}>{ROLES[r].pitch}</Text>
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
                <View style={[styles.box, agreed && { backgroundColor: colors.ink }]}>
                  {agreed && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
                </View>
                <Text style={styles.agreeText}>
                  I agree to the community guidelines: be kind, show up, respect everyone’s pace.
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.footer}>
          <Button title={step === STEPS.length - 1 ? 'FIND MY PEOPLE' : 'NEXT'} onPress={next} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: space.xl, paddingTop: space.md },
  back: { fontSize: 17, fontWeight: '700', color: colors.ink },
  count: { fontSize: 15, fontWeight: '700', color: colors.muted },
  bar: { height: 4, backgroundColor: colors.line, marginHorizontal: space.xl, marginTop: space.md, borderRadius: 2 },
  barFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
  body: { flex: 1, padding: space.xl },
  q: { fontSize: 30, fontWeight: '900', color: colors.ink, letterSpacing: -0.5, marginBottom: space.sm },
  input: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md,
    paddingHorizontal: space.lg, paddingVertical: 14, fontSize: 17, color: colors.ink,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: space.lg, marginTop: space.lg },
  photoEmpty: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: colors.line, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  photoText: { fontSize: 16, fontWeight: '700', color: colors.accent },
  agree: { flexDirection: 'row', gap: space.md, marginTop: space.xl, alignItems: 'flex-start' },
  box: {
    width: 26, height: 26, borderRadius: 7, borderWidth: 2, borderColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  agreeText: { flex: 1, fontSize: 15, color: colors.ink, lineHeight: 21 },
  role: {
    flexDirection: 'row', gap: space.lg, alignItems: 'center', padding: space.lg, borderRadius: radius.lg,
    borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, marginBottom: space.md,
  },
  roleOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  roleName: { fontSize: 18, fontWeight: '900', color: colors.ink },
  rolePitch: { fontSize: 14, color: colors.muted, marginTop: 4, lineHeight: 20 },
  footer: { padding: space.xl, paddingTop: space.sm },
});
