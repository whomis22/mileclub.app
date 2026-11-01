import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

export default function NewPost() {
  useTheme();
  const { addPost } = useStore();
  const [uri, setUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

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
    addPost(uri ?? undefined, caption);
    router.back();
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📷</Text>
          <Text style={styles.emptyTitle}>Add a photo</Text>
          <Text style={styles.emptySub}>Or just write something below to post it as text.</Text>
          <View style={styles.row}>
            <Button title="Choose photo" onPress={fromLibrary} style={{ flex: 1 }} />
            <Button title="Take photo" variant="ghost" onPress={fromCamera} style={{ flex: 1 }} />
          </View>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder={uri ? 'Write a caption…' : 'What’s on your mind?'}
        placeholderTextColor={colors.muted}
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={280}
      />
      <Button title="Share to Explore" onPress={share} disabled={!uri && !caption.trim()} />
      <Text style={styles.note}>Everyone on Mile Club can see and comment on your post.</Text>
    </ScrollView>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  body: { padding: space.lg, gap: space.lg, paddingBottom: 60 },
  preview: { width: '100%', aspectRatio: 4 / 5, borderRadius: 24, backgroundColor: colors.sand },
  change: { position: 'absolute', right: 12, bottom: 12, backgroundColor: colors.overlay, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
  changeText: { fontFamily: fonts.sansSemi, fontSize: 13, color: '#fff' },
  empty: { borderRadius: 24, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.dashed, padding: space.xl, alignItems: 'center', gap: space.md },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.ink, textAlign: 'center' },
  emptySub: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: -6 },
  row: { flexDirection: 'row', gap: space.md, alignSelf: 'stretch', marginTop: space.sm },
  input: { minHeight: 90, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, padding: space.md, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, textAlignVertical: 'top' },
  note: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, textAlign: 'center' },
}));
