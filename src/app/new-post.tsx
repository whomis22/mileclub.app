import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import Feather from '@expo/vector-icons/Feather';
import { MentionSuggestions } from '@/components/mentions';

import { Avatar, Button } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

export default function NewPost() {
  useTheme();
  const { addPost, editPost, myPosts, profile } = useStore();
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit ? myPosts.find((p) => p.id === edit) : undefined;
  const [uri, setUri] = useState<string | null>(editing?.uri ?? null);
  const [caption, setCaption] = useState(editing?.caption ?? '');

  async function fromLibrary() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.7 });
    if (!r.canceled) setUri(r.assets[0].uri);
  }

  async function fromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Camera is off', 'Allow camera access in your phone settings to take a photo.');
      return;
    }
    const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 5], quality: 0.7 });
    if (!r.canceled) setUri(r.assets[0].uri);
  }

  function share() {
    if (!uri && !caption.trim()) return;
    if (editing) editPost(editing.id, caption, uri ?? undefined);
    else addPost(uri ?? undefined, caption);
    router.back();
  }

  const left = 500 - caption.length;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {/* Text first, like a tweet: say anything (Yana, 2026-11-21). A photo is optional. */}
      <View style={styles.compose}>
        <Avatar name={profile?.firstName ?? 'You'} uri={profile?.photoUri} size={42} />
        <TextInput
          style={styles.input}
          placeholder={uri ? 'Write a caption…' : 'What’s on your mind?'}
          placeholderTextColor={colors.muted}
          value={caption}
          onChangeText={setCaption}
          multiline
          autoFocus={!editing}
          maxLength={500}
        />
      </View>
      <MentionSuggestions value={caption} onChange={setCaption} me={profile} style={{ marginTop: 8 }} />

      {!uri && !caption ? (
        <View style={styles.prompts}>
          {PROMPTS.map((p) => (
            <Pressable key={p} style={styles.prompt} onPress={() => setCaption(p)}>
              <Text style={styles.promptText}>{p}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {uri ? (
        <View>
          <Image source={{ uri }} style={styles.preview} contentFit="cover" />
          <Pressable style={styles.change} onPress={fromLibrary}>
            <Text style={styles.changeText}>Change photo</Text>
          </Pressable>
          <Pressable style={[styles.change, { right: undefined, left: 12 }]} onPress={() => setUri(null)}>
            <Text style={styles.changeText}>Remove</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.tools}>
        <Pressable style={styles.tool} onPress={fromLibrary} accessibilityLabel="Add a photo">
          <Feather name="image" size={20} color={colors.ink} />
        </Pressable>
        <Pressable style={styles.tool} onPress={fromCamera} accessibilityLabel="Take a photo">
          <Feather name="camera" size={20} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Text style={[styles.count, left < 40 && { color: colors.danger }]}>{left}</Text>
      </View>

      <Button title={editing ? 'Save changes' : 'Post'} onPress={share} disabled={!uri && !caption.trim()} />
      <Text style={styles.note}>Share a thought, a question, a win, anything. Everyone on Mile Club can see and reply.</Text>
    </ScrollView>
  );
}

const PROMPTS = ['Anyone else ', 'Hot take: ', 'Small win today: ', 'Question for you all: ', 'Looking for '];

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  preview: { width: '100%', aspectRatio: 4 / 5, borderRadius: 24, backgroundColor: colors.sand },
  change: { position: 'absolute', right: 12, bottom: 12, backgroundColor: colors.overlay, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  changeText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#fff' },
  compose: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  input: { flex: 1, minHeight: 120, paddingTop: 10, fontFamily: fonts.sansMedium, fontSize: 18, lineHeight: 25, color: colors.ink, textAlignVertical: 'top' },
  prompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prompt: { backgroundColor: colors.card, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  promptText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  tool: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
  note: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center' },
}));
