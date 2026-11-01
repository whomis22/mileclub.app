import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sampleComments } from '@/data/comments';
import { findPerson } from '@/data/people';
import { useStore } from '@/state/store';
import { colors, fonts, space, themed } from '@/theme';

export function useComments(postId: string) {
  const { comments } = useStore();
  return [...sampleComments(postId), ...(comments[postId] ?? [])];
}

export function authorName(authorId: string, myName?: string) {
  return authorId === 'me' ? myName ?? 'You' : findPerson(authorId)?.firstName ?? 'Member';
}

// Under each Explore post: the last two comments and a way into the full comment section.
export function CommentPreview({ postId }: { postId: string }) {
  const { profile } = useStore();
  const all = useComments(postId);
  const open = () => router.push(`/post/${postId}` as Href);
  return (
    <View style={styles.wrap}>
      {all.length > 2 ? (
        <Pressable onPress={open}>
          <Text style={styles.more}>View all {all.length} comments</Text>
        </Pressable>
      ) : null}
      {all.slice(-2).map((c) => (
        <Text key={c.id} style={styles.line} numberOfLines={2} onPress={open}>
          <Text style={styles.who}>{authorName(c.authorId, profile?.firstName)} </Text>
          {c.text}
        </Text>
      ))}
      <Pressable onPress={open} style={styles.add}>
        <Text style={styles.addText}>Add a comment…</Text>
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { marginTop: space.sm, gap: 4 },
  more: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  line: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.ink },
  who: { fontFamily: fonts.sansSemi },
  add: { marginTop: 4 },
  addText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
}));
