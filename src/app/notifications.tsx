import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Body, Screen } from '@/components/ui';
import { agoLabel } from '@/data/comments';
import { describeNotice } from '@/lib/notices';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

export default function Notifications() {
  useTheme();
  const { notices, activities, sessions, readNotices } = useStore();
  const list = notices ?? [];
  useEffect(() => {
    const t = setTimeout(readNotices, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen edges={['bottom']}>
      {list.length === 0 ? (
        <Body muted>Nothing yet. When you ask to join a run, you’ll hear here as soon as the host answers.</Body>
      ) : null}
      {list.map((n) => {
        const d = describeNotice(n, activities, sessions);
        return (
          <Pressable key={n.id} style={[styles.row, !n.read && styles.unread]} onPress={() => router.push(d.href as Href)}>
            <Text style={styles.icon}>{d.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{d.title}</Text>
              <Text style={styles.body}>{d.body}</Text>
            </View>
            <Text style={styles.time}>{agoLabel(n.at)}</Text>
          </Pressable>
        );
      })}
    </Screen>
  );
}

const styles = themed(() => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, marginBottom: space.sm },
  unread: { borderWidth: 1.5, borderColor: colors.olive },
  icon: { fontSize: 22 },
  title: { fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
  body: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 2 },
  time: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
}));
