import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Logo } from '@/components/ui';
import { findThread, type ChatMessage } from '@/data/messages';
import { findPerson } from '@/data/people';
import { useGroupSettings } from '@/lib/group-settings';
import { colors, fonts, radius, space } from '@/theme';

export default function Chat() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const thread = findThread(id);
  const settings = useGroupSettings();
  const [messages, setMessages] = useState<ChatMessage[]>(thread?.messages ?? []);
  const [draft, setDraft] = useState('');
  const [liked, setLiked] = useState<string[]>([]);
  if (!thread) return null;

  const isGroup = thread.kind === 'group';
  const person = thread.personId ? findPerson(thread.personId) : undefined;
  // Mock: you are a regular member, so when "Only admins can post" is on you can read and react, not send.
  const canSend = !isGroup || !settings.adminsOnly;

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
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  {m.from === 'admin' ? <Text style={styles.admin}>Mile Club · Admin</Text> : null}
                  <Text style={[styles.text, mine && { color: colors.onBrand }]}>{m.text}</Text>
                </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderBottomWidth: 1, borderBottomColor: colors.line },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, lineHeight: 30, color: colors.ink },
  groupIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.serif, fontSize: 22, color: colors.ink },
  sub: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.link },
  info: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontFamily: fonts.serifItalic, fontSize: 20, color: colors.ink },
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
});
