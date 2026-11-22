import { router } from 'expo-router';
import type { StyleProp, TextStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/ui';
import { faceFor } from '@/data/faces';
import { PEOPLE } from '@/data/people';
import type { Profile } from '@/data/types';
import { colors, fonts, themed, useTheme } from '@/theme';

// @mentions (Yana, 2026-11-22): everyone has an @username, people can @tag each other
// in posts, comments and chats (suggestions pop up while typing), and an @ in the text
// opens that person's profile. The side menu search finds people by @username or name.
export const HANDLES: Record<string, string> = {
  sanne: 'sannefit',
  daan: 'daan.rides',
  amira: 'amira.flow',
  lucas: 'lucas.lifts',
  femke: 'femke.outdoors',
  noah: 'noah.serves',
  yasmin: 'yasmin.tries',
  tom: 'tom.sunrise',
  lotte: 'lotte.runs',
  mateo: 'mateo.padel',
};

export type Found = { id: string; name: string; handle: string; photo?: string; color?: string; me?: boolean };

export function handleOf(id: string) {
  return HANDLES[id] ?? id;
}

function everyone(me?: Profile | null): Found[] {
  const others = PEOPLE.map((p) => ({ id: p.id, name: p.firstName, handle: handleOf(p.id), photo: faceFor(p.id)?.photo, color: p.color }));
  return me?.username ? [{ id: 'me', name: me.firstName, handle: me.username, photo: me.photoUri, me: true }, ...others] : others;
}

export function findByHandle(handle: string, me?: Profile | null) {
  const h = handle.toLowerCase();
  return everyone(me).find((p) => p.handle === h);
}

// People whose @username or name starts with (or contains) the search.
export function searchPeople(q: string, me?: Profile | null, withMe = true): Found[] {
  const s = q.trim().toLowerCase().replace(/^@/, '');
  const list = everyone(me).filter((p) => withMe || !p.me);
  if (!s) return list;
  const starts = list.filter((p) => p.handle.startsWith(s) || p.name.toLowerCase().startsWith(s));
  const has = list.filter((p) => !starts.includes(p) && (p.handle.includes(s) || p.name.toLowerCase().includes(s)));
  return [...starts, ...has];
}

export function openPerson(p: Found) {
  router.push(p.me ? '/profile' : `/person/${p.id}`);
}

// Text where every known @username is bold and tappable.
export function MentionText({ text, style, me, linkColor, numberOfLines, onOpen }: {
  text: string; style?: StyleProp<TextStyle>; me?: Profile | null; linkColor?: string; numberOfLines?: number; onOpen?: () => void;
}) {
  useTheme();
  const parts = text.split(/(@[a-zA-Z0-9._]*[a-zA-Z0-9_])/g);
  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) => {
        const who = part.startsWith('@') ? findByHandle(part.slice(1), me) : undefined;
        if (!who) return part;
        return (
          <Text
            key={i}
            style={[styles.mention, linkColor ? { color: linkColor } : null]}
            onPress={() => { onOpen?.(); openPerson(who); }}
            accessibilityRole="link">
            {part}
          </Text>
        );
      })}
    </Text>
  );
}

// The @word being typed at the end of the text, if any.
function typingMention(value: string) {
  const m = /(^|\s)@([a-zA-Z0-9._]*)$/.exec(value);
  return m ? m[2] : null;
}

// Suggestions while typing "@": tap one to fill in the @username.
export function MentionSuggestions({ value, onChange, me, style }: {
  value: string; onChange: (v: string) => void; me?: Profile | null; style?: object;
}) {
  useTheme();
  const q = typingMention(value);
  if (q === null) return null;
  const list = searchPeople(q, me, false).slice(0, 4);
  if (!list.length) return null;
  return (
    <View style={[styles.box, style]}>
      {list.map((p) => (
        <Pressable
          key={p.id}
          onPress={() => onChange(value.replace(/@([a-zA-Z0-9._]*)$/, `@${p.handle} `))}
          style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]}
          accessibilityLabel={`Mention ${p.name}`}>
          <Avatar name={p.name} uri={p.photo} color={p.color} size={30} />
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.handle}>@{p.handle}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  mention: { fontFamily: fonts.sansBold, color: colors.link },
  box: { backgroundColor: colors.card, borderRadius: 16, paddingVertical: 4, borderWidth: 1, borderColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 7 },
  name: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  handle: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
}));
