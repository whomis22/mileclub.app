import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { describeNotice } from '@/lib/notices';
import { useStore } from '@/state/store';
import { colors, fonts, themed, useTheme } from '@/theme';

// Drops down from the top when a host answers your request, wherever you are in the app.
export function NoticeBanner() {
  useTheme();
  const insets = useSafeAreaInsets();
  const { notices, activities, sessions } = useStore();
  const [since] = useState(() => Date.now());
  const latest = (notices ?? []).find((n) => n.at > since && !n.read);
  const [hidden, setHidden] = useState<string | null>(null);

  useEffect(() => {
    if (!latest) return;
    const id = latest.id;
    const t = setTimeout(() => setHidden(id), 7000);
    return () => clearTimeout(t);
  }, [latest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!latest || hidden === latest.id) return null;
  const d = describeNotice(latest, activities, sessions);
  return (
    <View style={[styles.wrap, { top: insets.top + 6 }]} pointerEvents="box-none">
      <Pressable
        style={[styles.card, latest.kind === 'declined' && styles.declined]}
        onPress={() => {
          setHidden(latest.id);
          router.push(d.href as Href);
        }}>
        <Text style={styles.icon}>{d.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{d.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{d.body}</Text>
        </View>
        <Pressable onPress={() => setHidden(latest.id)} hitSlop={10}>
          <Text style={styles.x}>✕</Text>
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.olive, borderRadius: 20, padding: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 8 },
  declined: { backgroundColor: colors.inkBg },
  icon: { fontSize: 24 },
  title: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.onBrand },
  body: { fontFamily: fonts.sans, fontSize: 13, color: colors.onBrand, opacity: 0.9, marginTop: 1 },
  x: { color: colors.onBrand, fontSize: 14, opacity: 0.8 },
}));
