import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar, Logo, MenuButton, Screen } from '@/components/ui';
import { THREADS } from '@/data/messages';
import { findPerson } from '@/data/people';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

export default function Messages() {
  useTheme();
  const { blocked } = useStore();
  const [query, setQuery] = useState('');
  const list = THREADS.filter((t) => !t.personId || !blocked.includes(t.personId)).filter((t) =>
    t.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Screen>
      <View style={styles.head}>
        <MenuButton onPress={() => router.push('/menu')} />
        <Text style={styles.title}>Messages</Text>
      </View>
      <View style={styles.search}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages"
          placeholderTextColor={colors.muted}
          style={styles.searchInput}
        />
      </View>
      <Text style={styles.section}>CHATS</Text>
      {list.map((t, i) => {
        const last = t.messages[t.messages.length - 1];
        const person = t.personId ? findPerson(t.personId) : undefined;
        return (
          <Pressable
            key={t.id}
            onPress={() => router.push(`/chat/${t.id}`)}
            style={({ pressed }) => [styles.row, i < list.length - 1 && styles.rowLine, pressed && { opacity: 0.6 }]}>
            {t.kind === 'group' ? (
              <View style={styles.groupIcon}>
                <Logo size={22} m={colors.bg} />
              </View>
            ) : (
              <Avatar name={t.name} color={person?.color} size={50} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={[styles.last, t.unread && styles.lastUnread]} numberOfLines={1}>
                {last.from === 'me' ? 'You: ' : t.kind === 'group' ? 'Mile Club: ' : ''}
                {last.text}
              </Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.time}>{t.time}</Text>
              {t.unread ? <View style={styles.dot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.ink },
  search: { marginTop: space.lg, height: 44, borderRadius: radius.pill, backgroundColor: colors.sand, paddingHorizontal: space.lg, justifyContent: 'center' },
  searchInput: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  section: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, marginTop: space.xl, marginBottom: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  rowLine: { borderBottomWidth: 1, borderBottomColor: colors.line },
  groupIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: colors.olive, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  last: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 3 },
  lastUnread: { fontFamily: fonts.sansMedium, color: colors.ink },
  right: { alignItems: 'flex-end', gap: 6, alignSelf: 'flex-start', paddingTop: 4 },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.olive },
}));
