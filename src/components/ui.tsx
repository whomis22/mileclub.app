import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, space } from '@/theme';

export function Screen({ children, scroll = true, edges = ['top'] }: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[styles.body, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export function Button({ title, onPress, variant = 'primary', disabled, style }: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = { primary: colors.ink, secondary: colors.accent, ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: '#fff', secondary: '#fff', ghost: colors.ink, danger: colors.danger }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { borderWidth: 1.5, borderColor: colors.ink },
        style,
      ]}>
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && { backgroundColor: colors.ink, borderColor: colors.ink }]}>
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  return <View style={styles.chips}>{children}</View>;
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

export function Avatar({ name, color, uri, size = 48 }: { name: string; color?: string; uri?: string; size?: number }) {
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={box} />;
  return (
    <View style={[box, { backgroundColor: color ?? colors.accent, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.42 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'green' | 'plain' }) {
  const bg = { accent: colors.accentSoft, green: colors.greenSoft, plain: colors.bg }[tone];
  const fg = { accent: colors.accent, green: colors.green, plain: colors.muted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.xl, paddingBottom: 48 },
  title: { fontSize: 32, fontWeight: '900', color: colors.ink, letterSpacing: -0.5 },
  sub: { fontSize: 16, color: colors.muted, marginTop: space.xs, lineHeight: 22 },
  label: {
    fontSize: 13, fontWeight: '800', color: colors.muted, letterSpacing: 1, textTransform: 'uppercase',
    marginTop: space.xl, marginBottom: space.sm,
  },
  body: { fontSize: 16, color: colors.ink, lineHeight: 23 },
  button: { borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, borderRadius: radius.pill,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  chipText: { fontSize: 15, fontWeight: '600', color: colors.ink },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md,
    borderWidth: 1, borderColor: colors.line,
  },
  badge: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  badgeText: { fontSize: 13, fontWeight: '800' },
});
