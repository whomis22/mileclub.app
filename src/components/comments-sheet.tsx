import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { authorName, openComments, useComments, useOpenComments } from '@/components/comment-preview';
import { Avatar } from '@/components/ui';
import { agoLabel } from '@/data/comments';
import { FEED, TEXT_POSTS } from '@/data/feed';
import { findPerson } from '@/data/people';
import { PHOTOS } from '@/data/photos';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// TikTok-style comments: a sheet over the bottom of the screen while the post
// stays visible above it, even with the keyboard open.
export function CommentsSheet() {
  const id = useOpenComments();
  return (
    <Modal visible={!!id} transparent animationType="slide" onRequestClose={() => openComments(null)}>
      {id ? <Sheet id={id} /> : null}
    </Modal>
  );
}

function Sheet({ id }: { id: string }) {
  useTheme();
  const insets = useSafeAreaInsets();
  const { profile, myPosts, addComment, deleteComment } = useStore();
  const all = useComments(id);
  const [text, setText] = useState('');

  const feedIdx = FEED.findIndex((p) => p.id === id);
  const sample = feedIdx >= 0 ? FEED[feedIdx] : undefined;
  const tweet = TEXT_POSTS.find((p) => p.id === id);
  const mine = myPosts.find((p) => p.id === id);
  const owner = findPerson(sample?.personId ?? tweet?.personId ?? '');
  const ownerName = mine ? profile?.firstName ?? 'You' : owner?.firstName ?? 'Member';
  const photo = mine?.uri ? { uri: mine.uri } : sample ? PHOTOS[feedIdx % PHOTOS.length] : null;
  const caption = mine ? mine.caption : tweet?.text ?? sample?.note ?? sample?.title ?? '';
  const close = () => openComments(null);

  function send() {
    if (!text.trim()) return;
    addComment(id, text);
    setText('');
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* The post, still on screen above the comments */}
      <Pressable style={[styles.post, { paddingTop: insets.top }]} onPress={close} accessibilityLabel="Close comments">
        {photo ? (
          <>
            <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.postShade} />
            <View style={styles.postInfo}>
              <Text style={styles.postName}>{ownerName}</Text>
              {caption ? <Text style={styles.postCaption} numberOfLines={2}>{caption}</Text> : null}
            </View>
          </>
        ) : (
          <View style={styles.tweetWrap}>
            <Text style={styles.postName}>{ownerName}</Text>
            <Text style={styles.tweetText} numberOfLines={5}>{caption}</Text>
          </View>
        )}
      </Pressable>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Text style={styles.title}>{all.length} {all.length === 1 ? 'comment' : 'comments'}</Text>
          <Pressable onPress={close} hitSlop={12} style={styles.x} accessibilityLabel="Close">
            <Text style={styles.xText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {all.length === 0 ? <Text style={styles.empty}>No comments yet. Be the first!</Text> : null}
          {all.map((c) => {
            const person = c.authorId === 'me' ? null : findPerson(c.authorId);
            const isMe = c.authorId === 'me';
            const name = authorName(c.authorId, profile?.firstName);
            return (
              <Pressable
                key={c.id}
                style={styles.row}
                onLongPress={
                  isMe
                    ? () =>
                        Alert.alert('Delete comment?', undefined, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deleteComment(id, c.id) },
                        ])
                    : undefined
                }
                onPress={
                  person
                    ? () => {
                        close();
                        router.push(`/person/${person.id}`);
                      }
                    : undefined
                }>
                <Avatar name={name} color={person?.color} uri={isMe ? profile?.photoUri : undefined} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.who}>{name}</Text>
                  <Text style={styles.text}>{c.text}</Text>
                  <Text style={styles.time}>{agoLabel(c.at)}{isMe ? ' · hold to delete' : ''}</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.bar}>
          <Avatar name={profile?.firstName ?? 'You'} uri={profile?.photoUri} size={30} />
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
            placeholderTextColor={colors.muted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
            maxLength={300}
          />
          <Pressable onPress={send} disabled={!text.trim()} style={[styles.send, !text.trim() && { opacity: 0.35 }]} accessibilityLabel="Send comment">
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  post: { flexGrow: 1, minHeight: 150, justifyContent: 'flex-end', overflow: 'hidden' },
  postShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 120, backgroundColor: 'rgba(0,0,0,0.35)' },
  postInfo: { padding: space.lg, paddingBottom: space.xl, gap: 2 },
  postName: { fontFamily: fonts.sansBold, fontSize: 15, color: '#fff' },
  postCaption: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 19, color: '#fff' },
  tweetWrap: { flex: 1, justifyContent: 'center', padding: space.xl, gap: space.sm, backgroundColor: colors.oliveDark },
  tweetText: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 30, color: '#fff' },
  sheet: { height: 470, flexShrink: 1, minHeight: 230, backgroundColor: colors.bg, borderTopLeftRadius: 22, borderTopRightRadius: 22, marginTop: -18 },
  grab: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: colors.line, marginTop: 8 },
  head: { alignItems: 'center', paddingVertical: 10 },
  title: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  x: { position: 'absolute', right: 16, top: 8 },
  xText: { fontSize: 16, color: colors.muted },
  list: { paddingHorizontal: space.lg, paddingBottom: space.md, gap: space.lg },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  who: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.muted },
  text: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 20, color: colors.ink, marginTop: 1 },
  time: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3 },
  empty: { fontFamily: fonts.sans, color: colors.muted, textAlign: 'center', marginTop: space.xl },
  bar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1, borderRadius: radius.pill, backgroundColor: colors.sand, paddingHorizontal: space.lg, paddingVertical: 10, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  send: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.onBrand, fontSize: 18, fontFamily: fonts.sansBold },
}));
