import Feather from '@expo/vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageTop } from '@/components/page-top';
import { Avatar, Screen } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed, useTheme } from '@/theme';

// Edit profile (Yana, 2026-11-22): opened by tapping the profile picture or "Edit Profile".
// Picture, @username, name, phone number, bio, and the person's own profile link to share.
// Phone stays private. Sports and preferences still live in the onboarding steps.
const BIO_MAX = 150;
const LINK_BASE = 'mileclub.co/@';
const WEEK = 7 * 24 * 60 * 60 * 1000;

const clean = (u: string) => u.toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '').slice(0, 24);

function profileLink(username?: string) {
  return username ? `https://${LINK_BASE}${username}` : undefined;
}

export default function EditProfile() {
  useTheme();
  const { profile, saveProfile } = useStore();
  const [photo, setPhoto] = useState(profile?.photoUri);
  const [username, setUsername] = useState(profile?.username ?? clean(profile?.firstName ?? ''));
  const [first, setFirst] = useState(profile?.firstName ?? '');
  const [last, setLast] = useState(profile?.lastName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  // Username can change once every 7 days (Yana, 2026-11-22).
  const [now] = useState(() => Date.now());
  const nextChange = profile?.username && profile.usernameChangedAt ? profile.usernameChangedAt + WEEK : 0;
  const locked = nextChange > now;
  const nextDate = new Date(nextChange).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  if (!profile) return null;

  async function pick(camera: boolean) {
    if (camera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Camera is off', 'Allow camera access in your phone settings to take a photo.');
        return;
      }
    }
    const opts = { allowsEditing: true, aspect: [1, 1] as [number, number], quality: 0.7 };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync({ ...opts, mediaTypes: ['images'] });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  }

  function changePhoto() {
    if (Platform.OS === 'web') return pick(false);
    Alert.alert('Profile picture', undefined, [
      { text: 'Choose from library', onPress: () => pick(false) },
      { text: 'Take a photo', onPress: () => pick(true) },
      ...(photo ? [{ text: 'Remove picture', style: 'destructive' as const, onPress: () => setPhoto(undefined) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  const link = profileLink(username);
  async function shareLink() {
    if (!link) return;
    try {
      await Share.share({ message: `Join me on Mile Club! ${link}`, url: link });
    } catch {}
  }

  const ok = first.trim().length > 0 && username.length >= 3;
  function save() {
    if (!profile) return;
    if (!ok) {
      Alert.alert('Almost there', username.length < 3 ? 'Your username needs at least 3 letters.' : 'Please add your name.');
      return;
    }
    const changed = username !== profile.username;
    if (changed && profile.username && !locked && Platform.OS !== 'web') {
      // Ask first: after this they have to wait a week.
      return Alert.alert(`Change to @${username}?`, 'You can only change your username once every 7 days.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Change it', onPress: () => commit(true) },
      ]);
    }
    commit(changed && !!profile.username);
  }

  function commit(stamp: boolean) {
    if (!profile) return;
    saveProfile({ ...profile, ...(stamp ? { usernameChangedAt: Date.now() } : null), photoUri: photo, username, firstName: first.trim(), lastName: last.trim() || undefined, phone: phone.trim() || undefined, bio: bio.trim() || undefined });
    router.back();
  }

  return (
    <Screen>
      <PageTop title="Edit profile" />

      <Pressable style={styles.photoWrap} onPress={changePhoto} accessibilityLabel="Change profile picture">
        <View style={styles.ring}>
          <Avatar name={first || profile.firstName} uri={photo} size={100} />
        </View>
        <View style={styles.cam}><Feather name="camera" size={15} color="#000" /></View>
        <Text style={styles.change}>Change picture</Text>
      </Pressable>

      <Field label="Username" hint={locked ? `You can change it again on ${nextDate}` : 'You can change it once every 7 days'}>
        <View style={[styles.inputRow, locked && { opacity: 0.55 }]}>
          <Text style={styles.at}>@</Text>
          {locked ? <Feather name="lock" size={14} color={colors.muted} style={{ position: 'absolute', right: 14 }} /> : null}
          <TextInput editable={!locked} value={username} onChangeText={(t) => setUsername(clean(t))} autoCapitalize="none" autoCorrect={false} placeholder="yourname" placeholderTextColor={colors.muted} style={[styles.input, { flex: 1 }]} />
        </View>
      </Field>
      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Field label="First name">
            <TextInput value={first} onChangeText={setFirst} placeholder="First name" placeholderTextColor={colors.muted} style={[styles.input, styles.box]} />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Last name">
            <TextInput value={last} onChangeText={setLast} placeholder="Optional" placeholderTextColor={colors.muted} style={[styles.input, styles.box]} />
          </Field>
        </View>
      </View>
      <Field label="Phone number" hint="Private. Only you can see this.">
        <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" textContentType="telephoneNumber" placeholder="+44 7700 900000" placeholderTextColor={colors.muted} style={[styles.input, styles.box]} />
      </Field>
      <Field label="Bio" hint={`${bio.length}/${BIO_MAX}`}>
        <TextInput value={bio} onChangeText={(t) => setBio(t.slice(0, BIO_MAX))} multiline placeholder="A few words about you: what you love doing, who you want to meet" placeholderTextColor={colors.muted} style={[styles.input, styles.box, styles.bioBox]} />
      </Field>

      <Text style={styles.label}>Your profile link</Text>
      <View style={styles.linkCard}>
        <View style={styles.linkIcon}><Feather name="link" size={18} color="#000" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkUser}>@{username || 'yourname'}</Text>
          <Text style={styles.linkText} numberOfLines={1}>{LINK_BASE}{username || 'yourname'}</Text>
        </View>
        <Pressable onPress={shareLink} disabled={!link} style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.8 }, !link && { opacity: 0.4 }]} accessibilityLabel="Share my profile link">
          <Feather name="share" size={15} color={colors.ink} />
          <Text style={styles.shareText}>Share</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => router.push({ pathname: '/onboarding', params: { edit: '1' } } as Href)} style={styles.more}>
        <Feather name="sliders" size={18} color={colors.ink} />
        <Text style={styles.moreText}>Sports, level & who you want to meet</Text>
        <Feather name="chevron-right" size={18} color={colors.muted} />
      </Pressable>

      <Pressable onPress={save} style={({ pressed }) => [styles.save, !ok && { opacity: 0.5 }, pressed && { opacity: 0.85 }]} accessibilityLabel="Save profile">
        <Text style={styles.saveText}>Save</Text>
      </Pressable>
    </Screen>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  useTheme();
  return (
    <View style={{ marginTop: space.md }}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { marginTop: 0 }]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const LIME = '#B9E769';

const styles = themed(() => StyleSheet.create({
  photoWrap: { alignItems: 'center', marginTop: space.sm },
  ring: { borderWidth: 3, borderColor: colors.cta, borderRadius: 60, padding: 4 },
  cam: { position: 'absolute', top: 80, right: '36%', width: 32, height: 32, borderRadius: 16, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.bg },
  change: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.link, marginTop: 10 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { fontFamily: fonts.sansSemi, fontSize: 12.5, color: colors.muted, marginTop: space.lg, marginBottom: 6 },
  hint: { fontFamily: fonts.sans, fontSize: 11.5, color: colors.muted },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, height: 50 },
  at: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.muted, marginRight: 2 },
  input: { fontFamily: fonts.sans, fontSize: 15.5, color: colors.ink },
  box: { backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, height: 50 },
  bioBox: { height: 96, paddingTop: 14, textAlignVertical: 'top' },
  twoCol: { flexDirection: 'row', gap: 10 },
  linkCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 12 },
  linkIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center' },
  linkUser: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  linkText: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.sand },
  shareText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  more: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 18, padding: 16, marginTop: space.md },
  moreText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14.5, color: colors.ink },
  save: { height: 52, borderRadius: 26, backgroundColor: LIME, alignItems: 'center', justifyContent: 'center', marginTop: space.xl, marginBottom: space.lg },
  saveText: { fontFamily: fonts.sansBold, fontSize: 16, color: '#000' },
}));
