import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, space, themed, useTheme } from '@/theme';

// Back arrow + centred title, like Settings.
export function PageTop({ title }: { title: string }) {
  useTheme();
  return (
    <View style={styles.top}>
      <Pressable style={styles.back} onPress={() => router.back()} accessibilityLabel="Back">
        <Feather name="arrow-left" size={22} color={colors.ink} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.ink },
}));
