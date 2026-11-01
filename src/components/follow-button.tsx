import { Pressable, StyleSheet, Text } from 'react-native';

import { useStore } from '@/state/store';
import { colors, fonts, radius, themed } from '@/theme';

// Follow / Following pill. Who you follow is private: nobody else sees it, and
// there are no public follower counts.
export function FollowButton({ id, name }: { id: string; name: string }) {
  const { following, toggleFollow } = useStore();
  const on = following.includes(id);
  return (
    <Pressable
      onPress={() => toggleFollow(id)}
      style={({ pressed }) => [styles.btn, on && styles.on, pressed && { opacity: 0.8 }]}
      accessibilityRole="button"
      accessibilityLabel={on ? `Unfollow ${name}` : `Follow ${name}`}>
      <Text style={[styles.text, on && { color: colors.ink }]}>{on ? 'Following' : 'Follow'}</Text>
    </Pressable>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    btn: { borderRadius: radius.pill, backgroundColor: colors.peach, paddingVertical: 9, paddingHorizontal: 22, alignSelf: 'center' },
    on: { backgroundColor: colors.sand },
    text: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.onPeach },
  }),
);
