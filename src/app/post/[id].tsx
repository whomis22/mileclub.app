import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authorName, useComments } from '@/components/comment-preview';
import { Avatar } from '@/components/ui';
import { agoLabel } from '@/data/comments';
import { FEED, TEXT_POSTS } from '@/data/feed';
import { findPerson } from '@/data/people';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// The full comment section for one Explore post.
export default function PostComments() {
  useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, myPosts, addComment, deleteComment } = useStore();
  const [text, setText] = useState('');
  const all = useComments(id);

  const sample = FEED.find((p) => p.id === id);
  const textPost = TEXT_POSTS.find((p) => p.id === id);
  const mine = myPosts.find((p) => p.id === id);
  const owner = findPerson(sample?.personId ?? textPost?.personId ?? '');
  const ownerName = mine ? profile?.firstName ?? 'You' : owner?.firstName ?? 'Member';
  const caption = mine ? mine.caption : textPost?.text ?? sample?.note ?? sample?.title;

  function send() {
    if (!text.trim()) return;
    addComment(id, text);
    setText('');
  }

  function remove(cid: string) {
    Alert.alert('Delete comment?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteComment(id, cid) },
    ]);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {caption ? (
            <View style={[styles.row, styles.captionRow]}>
              <Avatar name={ownerName} color={owner?.color} uri={mine ? profile?.photoUri : undefined} size={34} />
              <Text style={styles.text}>
                <Text style={styles.who}>{ownerName} </Text>
                {caption}
              </Text>
            </View>
          ) : null}

          {all.length === 0 ? <Text style={styles.empty}>No comments yet. Be the first!</Text> : null}

          {all.map((c) => {
            const person = c.authorId === 'me' ? null : findPerson(c.authorId);
            const isMe = c.authorId === 'me';
            return (
              <Pressable
                key={c.id}
                style={styles.row}
                onLongPress={isMe ? () => remove(c.id) : undefined}
                onPress={person ? () => router.push(`/person/${person.id}`) : undefined}>
                <Avatar name={authorName(c.authorId, profile?.firstName)} color={person?.color} uri={isMe ? profile?.photoUri : undefined} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.text}>
                    <Text style={styles.who}>{authorName(c.authorId, profile?.firstName)} </Text>
                    {c.text}
                  </Text>
                  <Text style={styles.time}>{agoLabel(c.at)}{isMe ? ' · hold to delete' : ''}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.bar}>
          <Avatar name={profile?.firstName ?? 'You'} uri={profile?.photoUri} size={32} />
          <TextInput
            style={styles.input}
            placeholder={`Comment as ${profile?.firstName ?? 'you'}…`}
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
            maxLength={300}
          />
          <Pressable onPress={send} disabled={!text.trim()}>
            <Text style={[styles.post, !text.trim() && { opacity: 0.35 }]}>Post</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: space.lg, gap: space.lg },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  captionRow: { paddingBottom: space.lg, borderBottomWidth: 1, borderBottomColor: colors.line },
  text: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.ink },
  who: { fontFamily: fonts.sansSemi },
  time: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3 },
  empty: { fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', marginTop: space.xl },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg, paddingVertical: space.md, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  input: { flex: 1, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingHorizontal: space.lg, paddingVertical: 10, fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  post: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.link },
}));
