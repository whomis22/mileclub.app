import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { GIPHY_KEY, LOCAL_GIFS, gifSource, searchGiphy, type GifResult } from '@/data/gifs';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Tap a GIF to send it as a comment straight away.
export function GifPicker({ onPick }: { onPick: (gif: string) => void }) {
  useTheme();
  const [q, setQ] = useState('');
  const [results, setResults] = useState<GifResult[]>([]);
  useEffect(() => {
    if (!GIPHY_KEY) return;
    const t = setTimeout(() => {
      searchGiphy(q).then(setResults).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <View style={styles.wrap}>
      {GIPHY_KEY ? (
        <View style={styles.search}>
          <Feather name="search" size={15} color={colors.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search GIFs"
            placeholderTextColor={colors.muted}
            style={styles.input}
            returnKeyType="search"
            inputMode="search"
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.row}>
        {q.trim()
          ? null
          : Object.keys(LOCAL_GIFS).map((k) => (
              <Pressable key={k} onPress={() => onPick(k)} accessibilityLabel={`Send ${k} GIF`}>
                <Image source={gifSource(k)} style={styles.gif} contentFit="cover" autoplay />
              </Pressable>
            ))}
        {results.map((r) => (
          <Pressable key={r.id} onPress={() => onPick(r.url)}>
            <Image source={{ uri: r.preview }} style={styles.gif} contentFit="cover" autoplay />
          </Pressable>
        ))}
      </ScrollView>
      {GIPHY_KEY ? <Text style={styles.credit}>Powered by GIPHY</Text> : null}
    </View>
  );
}

const styles = themed(() =>
  StyleSheet.create({
    wrap: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: space.sm, gap: space.sm },
    search: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: space.lg, backgroundColor: colors.sand, borderRadius: radius.pill, paddingHorizontal: 14 },
    input: { flex: 1, paddingVertical: 9, fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
    row: { gap: 8, paddingHorizontal: space.lg },
    gif: { width: 112, height: 84, borderRadius: 12, backgroundColor: colors.sand },
    credit: { fontFamily: fonts.sans, fontSize: 10, color: colors.muted, textAlign: 'right', marginRight: space.lg },
  }),
);
