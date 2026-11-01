import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LocationCard } from '@/components/location-card';
import { Avatar, Logo } from '@/components/ui';
import { findThread, type ChatMessage } from '@/data/messages';
import { findPerson } from '@/data/people';
import { useGroupSettings } from '@/lib/group-settings';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

export default function Chat() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = findThread(id);
  const settings = useGroupSettings();
  const [messages, setMessages] = useState<ChatMessage[]>(thread?.messages ?? []);
  const [draft, setDraft] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
  const { profile, following, toggleFollow, block } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const insets = useSafeAreaInsets();
  if (!thread) return null;

  const isGroup = thread.kind === 'group';
  const person = thread.personId ? findPerson(thread.personId) : undefined;
  // Mock: you are a regular member, so when "Only admins can post" is on you can read and react, not send.
  const canSend = !isGroup || !settings.adminsOnly;
  // Calls and location sharing are only for people you follow.
  const follows = !!person && following.includes(person.id);

  // Calls and location need you to follow them first; offer to follow right there.
  function needsFollow(action: string, then: () => void) {
    if (follows) return then();
    Alert.alert(`Follow ${thread!.name} to ${action}`, 'You can call and share your location with people you follow.', [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Follow',
        onPress: () => {
          toggleFollow(person!.id);
          then();
        },
      },
    ]);
  }
  const call = (video = false) => needsFollow(video ? 'video call' : 'call', () => router.push(`/call/${person!.id}${video ? '?video=1' : ''}` as Href));
  const askLocation = () => needsFollow('share your location', shareLocation);

  function onBlock() {
    Alert.alert(`Block ${thread!.name}?`, "You won't see each other or each other's activities.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: () => {
          block(person!.id);
          router.back();
        },
      },
    ]);
  }

  function shareLocation() {
    Alert.alert(`Share your location with ${thread!.name}?`, 'They will see where you are for the next hour.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Share',
        onPress: () => setMessages((m) => [...m, { id: `${Date.now()}`, from: 'me', text: 'Shared location', location: true }]),
      },
    ]);
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { id: `${Date.now()}`, from: 'me', text }]);
    setDraft('');
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={styles.back}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        {isGroup ? (
          <View style={styles.groupIcon}>
            <Logo size={18} m={colors.bg} />
          </View>
        ) : (
          <Avatar name={thread.name} color={person?.color} size={42} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{thread.name}</Text>
          <Text style={styles.sub}>{isGroup ? 'Everyone who joins Mile Club' : 'Active now'}</Text>
        </View>
        {person ? (
          <>
            <Pressable onPress={() => call()} style={styles.call} accessibilityLabel={`Call ${thread.name}`}>
              <Text style={styles.callText}>📞</Text>
            </Pressable>
            <Pressable onPress={() => setMenuOpen(true)} style={styles.more} accessibilityLabel="More options">
              <Text style={styles.moreText}>•••</Text>
            </Pressable>
          </>
        ) : null}
        {isGroup ? (
          <Pressable onPress={() => router.push('/group-settings')} style={styles.info} accessibilityLabel="Group settings">
            <Text style={styles.infoText}>i</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.list}>
          {isGroup ? <Text style={styles.system}>You joined Mile Club Members</Text> : <Text style={styles.day}>TODAY</Text>}

          {messages.map((m) => {
            const mine = m.from === 'me';
            return (
              <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start' }}>
                {m.location ? (
                  <LocationCard mine={mine} place={mine ? profile?.neighborhood ?? 'Near you' : person?.neighborhood ?? 'Nearby'} />
                ) : (
                  <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                    {m.from === 'admin' ? <Text style={styles.admin}>Mile Club · Admin</Text> : null}
                    <Text style={[styles.text, mine && { color: colors.onBrand }]}>{m.text}</Text>
                  </View>
                )}
                {isGroup && settings.reactions ? (
                  <Pressable
                    onPress={() => setLiked((l) => (l.includes(m.id) ? l.filter((x) => x !== m.id) : [...l, m.id]))}
                    style={[styles.react, liked.includes(m.id) && styles.reactOn]}>
                    <Text style={[styles.reactText, liked.includes(m.id) && { color: colors.onPeach }]}>{liked.includes(m.id) ? '♥ Liked' : '♡ Like'}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </ScrollView>

        {canSend ? (
          <View style={styles.composer}>
            {person ? (
              <Pressable onPress={askLocation} style={styles.pinBtn} accessibilityLabel="Send location">
                <Text style={styles.pinText}>📍</Text>
              </Pressable>
            ) : null}
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={`Message ${thread.name}`}
              placeholderTextColor={colors.muted}
              style={styles.input}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <Pressable onPress={send} style={styles.send} accessibilityLabel="Send">
              <Text style={styles.sendText}>↑</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.locked}>
            <Text style={styles.lockedText}>Only admins can send messages. You can react.</Text>
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: insets.top + 64 }]}>
            {(
              [
                [follows ? '✓' : '＋', follows ? `Unfollow ${thread.name}` : `Follow ${thread.name}`, () => toggleFollow(person!.id)],
                ['📞', 'Call', () => call()],
                ['🎥', 'Video call', () => call(true)],
                ['📍', 'Send location', askLocation],
                ['⛔', `Block ${thread.name}`, onBlock],
              ] as [string, string, () => void][]
            ).map(([icon, label, fn], i) => (
              <Pressable
                key={label}
                style={({ pressed }) => [styles.menuRow, i > 0 && styles.menuLine, pressed && { backgroundColor: colors.sand }]}
                onPress={() => {
                  setMenuOpen(false);
                  setTimeout(fn, 250);
                }}>
                <Text style={styles.menuIcon}>{icon}</Text>
                <Text style={[styles.menuText, label.startsWith('Block') && { color: colors.danger }]}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, lineHeight: 30, color: colors.ink },
  groupIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink },
  sub: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.link },
  call: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.oliveSoft, alignItems: 'center', justifyContent: 'center' },
  callText: { fontSize: 18 },
  more: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  moreText: { fontFamily: fonts.sansBold, fontSize: 13, letterSpacing: 1, color: colors.ink },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  menu: { position: 'absolute', top: 100, right: 16, width: 240, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  menuLine: { borderTopWidth: 1, borderTopColor: colors.line },
  menuIcon: { fontSize: 18, width: 24, textAlign: 'center', color: colors.ink },
  menuText: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.ink },
  pinBtn: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  pinText: { fontSize: 20 },
  info: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontFamily: fonts.serifItalic, fontSize: 18, color: colors.ink },
  list: { padding: space.lg, gap: space.sm },
  day: { alignSelf: 'center', fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1, color: colors.muted },
  system: { alignSelf: 'center', fontFamily: fonts.sans, fontSize: 12, color: colors.muted, backgroundColor: colors.sand, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  bubble: { maxWidth: '80%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
  theirs: { backgroundColor: colors.sand, borderBottomLeftRadius: 6 },
  mine: { backgroundColor: colors.olive, borderBottomRightRadius: 6 },
  admin: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.link, marginBottom: 2 },
  text: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, color: colors.ink },
  react: { marginTop: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingVertical: 4, paddingHorizontal: 10 },
  reactOn: { backgroundColor: colors.peach, borderColor: colors.peach },
  reactText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.ink },
  composer: { flexDirection: 'row', gap: space.sm, padding: space.md, alignItems: 'center' },
  input: { flex: 1, height: 46, borderRadius: 23, borderWidth: 1, borderColor: colors.line, paddingHorizontal: space.lg, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  send: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.onBrand, fontSize: 22, fontFamily: fonts.sansBold },
  locked: { margin: space.md, minHeight: 50, borderRadius: 25, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  lockedText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center' },
}));
