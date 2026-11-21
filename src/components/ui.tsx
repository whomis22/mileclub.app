import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, getThemeMode, fonts, radius, space, themed, useTheme } from '@/theme';

// Soft glow at the top of a screen: forest green in dark mode, a hint of lime in light.
export function BgGlow({ height = 360 }: { height?: number }) {
  useTheme();
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[colors.glow, 'transparent']}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}
    />
  );
}

// Every scrolling page can be pulled down to refresh. onRefresh returns how many
// new things arrived; with none, a small "No new feed" pill shows and the page
// stays as it was.
export function Screen({ children, scroll = true, edges = ['top'], onRefresh, nothingNew = 'No new feed', newLabel = 'new post' }: {
  children: ReactNode;
  scroll?: boolean;
  edges?: ('top' | 'bottom')[];
  onRefresh?: () => number;
  nothingNew?: string;
  newLabel?: string;
}) {
  useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  function refresh() {
    setRefreshing(true);
    setTimeout(() => {
      const n = onRefresh ? onRefresh() : 0;
      setRefreshing(false);
      setToast(n > 0 ? `${n} ${newLabel}${n > 1 ? 's' : ''}` : nothingNew);
      setTimeout(() => setToast(null), 2200);
    }, 900);
  }
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      <BgGlow />
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.olive} colors={[colors.olive]} />}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {toast ? (
        <View pointerEvents="none" style={[styles.toastWrap, { top: (edges.includes('top') ? insets.top : 0) + 10 }]}>
          <Text style={styles.toast}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  useTheme();
  return (
    <View style={{ marginBottom: space.lg }}>
      <Text style={styles.title}>{children}</Text>
      {sub ? <Text style={styles.sub}>{sub}</Text> : null}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  useTheme();
  return <Text style={styles.label}>{children}</Text>;
}

export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  useTheme();
  return <Text style={[styles.body, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export function Button({ title, onPress, variant = 'primary', disabled, style }: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'alt' | 'soft' | 'ghost' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  useTheme();
  // Lime pill for the main action, forest for the second one (2026-11-21 look).
  // alt = black in light mode, purple in dark mode (design board).
  const bg = { primary: colors.cta, secondary: colors.olive, alt: colors.violet, soft: colors.card, ghost: 'transparent', danger: 'transparent' }[variant];
  const fg = { primary: colors.onCta, secondary: colors.onBrand, alt: colors.onViolet, soft: colors.ink, ghost: colors.ink, danger: colors.danger }[variant];
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
  useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && { backgroundColor: colors.olive, borderColor: colors.olive }]}>
      <Text style={[styles.chipText, selected && { color: colors.onBrand }]}>{label}</Text>
    </Pressable>
  );
}

export function Chips({ children }: { children: ReactNode }) {
  useTheme();
  return <View style={styles.chips}>{children}</View>;
}

export function Card({ children, onPress, style }: { children: ReactNode; onPress?: () => void; style?: ViewStyle }) {
  useTheme();
  if (!onPress) return <View style={[styles.card, style]}>{children}</View>;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}>
      {children}
    </Pressable>
  );
}

export function Avatar({ name, color, uri, size = 48 }: { name: string; color?: string; uri?: string; size?: number }) {
  useTheme();
  const box = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={box} />;
  return (
    <View style={[box, { backgroundColor: color ?? colors.peach, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: color ? '#fff' : colors.onPeach, fontFamily: fonts.serif, fontSize: size * 0.44 }}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function Badge({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'green' | 'plain' }) {
  useTheme();
  const bg = { accent: colors.peach, green: colors.oliveSoft, plain: colors.sand }[tone];
  const fg = { accent: colors.onPeach, green: colors.link, plain: colors.muted }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: space.xl, paddingBottom: 48 },
  toastWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 50 },
  toast: { backgroundColor: colors.olive, color: colors.onBrand, fontFamily: fonts.sansSemi, fontSize: 13, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, overflow: 'hidden' },
  title: { fontSize: 30, fontFamily: fonts.serif, color: colors.ink, lineHeight: 40 },
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
}));

// The Mile Club mark: an olive "m" with a peach "c" tucked over its last leg.
export function Logo({ size = 40, m, c = colors.peachDeep }: { size?: number; m?: string; c?: string }) {
  useTheme();
  const mColor = m ?? (getThemeMode() === 'dark' ? '#FFFFFF' : colors.olive);
  return (
    <View style={{ flexDirection: 'row' }} accessibilityLabel="Mile Club" accessible>
      <Text style={{ fontFamily: fonts.logo, fontSize: size, lineHeight: size * 1.15, color: mColor }}>m</Text>
      <Text style={{ fontFamily: fonts.logo, fontSize: size, lineHeight: size * 1.15, color: c, marginLeft: -size * 0.3 }}>c</Text>
    </View>
  );
}

// Round outline button that opens the side menu.
export function MenuButton({ onPress }: { onPress: () => void }) {
  useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel="Open menu" style={({ pressed }) => [shared.iconBtn, pressed && { opacity: 0.6 }]}>
      <View style={{ gap: 4 }}>
        <View style={[shared.bar, { width: 18 }]} />
        <View style={[shared.bar, { width: 12 }]} />
        <View style={[shared.bar, { width: 18 }]} />
      </View>
    </Pressable>
  );
}

export function IconButton({ label, onPress, children, filled }: { label: string; onPress: () => void; children: ReactNode; filled?: boolean }) {
  useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      style={({ pressed }) => [shared.iconBtn, filled && { backgroundColor: colors.olive, borderColor: colors.olive }, pressed && { opacity: 0.6 }]}>
      {children}
    </Pressable>
  );
}

const shared = themed(() => ({
  iconBtn: {
    width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.line,
    alignItems: 'center', justifyContent: 'center',
  } as ViewStyle,
  bar: { height: 2, borderRadius: 1, backgroundColor: colors.ink } as ViewStyle,
}));

// The wordmark under the logo: heavy italic capitals.
export function Wordmark({ size = 34, color }: { size?: number; color: string }) {
  return <Text style={{ fontFamily: fonts.logo, fontSize: size, lineHeight: size * 0.98, color, textAlign: 'center', fontStyle: 'italic', letterSpacing: -0.5 }}>MILE{'\n'}CLUB</Text>;
}

