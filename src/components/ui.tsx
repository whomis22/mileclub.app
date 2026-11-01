import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, space } from '@/theme';

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
  const bg = { primary: colors.olive, secondary: colors.peach, ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: colors.bg, secondary: colors.ink, ghost: colors.ink, danger: colors.danger }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.35 : pressed ? 0.8 : 1 },
        variant === 'ghost' && { borderWidth: 1, borderColor: colors.line },
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
      style={[styles.chip, selected && { backgroundColor: colors.olive, borderColor: colors.olive }]}>
      <Text style={[styles.chipText, selected && { color: colors.bg }]}>{label}</Text>
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
    <View style={[box, { backgroundColor: color ?? colors.peach, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: color ? '#fff' : colors.ink, fontFamily: fonts.serif, fontSize: size * 0.44 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'green' | 'plain' }) {
  const bg = { accent: colors.peach, green: colors.oliveSoft, plain: colors.sand }[tone];
  const fg = { accent: colors.ink, green: colors.olive, plain: colors.muted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.xl, paddingBottom: 48 },
  title: { fontSize: 38, fontFamily: fonts.serif, color: colors.ink, lineHeight: 40 },
  sub: { fontSize: 15, fontFamily: fonts.sans, color: colors.muted, marginTop: space.xs, lineHeight: 22 },
  label: {
    fontSize: 11, fontFamily: fonts.sansSemi, color: colors.muted, letterSpacing: 2, textTransform: 'uppercase',
    marginTop: space.xl, marginBottom: space.sm,
  },
  body: { fontSize: 15, fontFamily: fonts.sans, color: colors.ink, lineHeight: 22 },
  button: { borderRadius: radius.pill, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center' },
  buttonText: { fontSize: 15, fontFamily: fonts.sansSemi },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  chip: {
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, borderRadius: radius.pill,
    paddingVertical: 9, paddingHorizontal: 14,
  },
  chipText: { fontSize: 14, fontFamily: fonts.sansMedium, color: colors.ink },
  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, marginBottom: space.md,
  },
  badge: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start' },
  badgeText: { fontSize: 12, fontFamily: fonts.sansSemi },
});

// The Mile Club mark: an olive "m" with a peach "c" tucked over its last leg.
export function Logo({ size = 40, m = colors.olive, c = colors.peachDeep }: { size?: number; m?: string; c?: string }) {
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel="Mile Club" accessible>
      <Text style={{ fontFamily: fonts.logo, fontSize: size, lineHeight: size * 1.15, color: m }}>m</Text>
      <Text style={{ fontFamily: fonts.logo, fontSize: size, lineHeight: size * 1.15, color: c, marginLeft: -size * 0.3 }}>c</Text>
    </View>
  );
}

// Round outline button that opens the side menu.
export function MenuButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityLabel="Open menu" style={({ pressed }) => [iconBtn, pressed && { opacity: 0.6 }]}>
      <View style={{ gap: 4 }}>
        <View style={[bar, { width: 18 }]} />
        <View style={[bar, { width: 12 }]} />
        <View style={[bar, { width: 18 }]} />
      </View>
    </Pressable>
  );
}

export function IconButton({ label, onPress, children, filled }: { label: string; onPress: () => void; children: ReactNode; filled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [iconBtn, filled && { backgroundColor: colors.olive, borderColor: colors.olive }, pressed && { opacity: 0.6 }]}>
      {children}
    </Pressable>
  );
}

const iconBtn: ViewStyle = {
  width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line,
  alignItems: 'center', justifyContent: 'center',
};
const bar: ViewStyle = { height: 2, borderRadius: 1, backgroundColor: colors.ink };
