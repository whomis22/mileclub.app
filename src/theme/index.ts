import { Storage } from 'expo-sqlite/kv-store';
import { Appearance } from 'react-native';
import { useSyncExternalStore } from 'react';

// Mile Club colours (Yana, 2026-11-21): Midnight Forest #102A27 (main brand),
// Fresh Lime #B9E769 (signature accent), Cloud White #F7F7F2 (light background),
// Slate Grey #777F79 (secondary text). Dark mode is a near-black forest with a green glow,
// lime buttons (Dribbble fitness look Yana sent). Older names (olive, peach) are kept
// so every screen picks the new colours up: olive = forest, peach = lime.
const light = {
  bg: '#F7F7F2', // Cloud White
  card: '#FFFFFF',
  sand: '#ECEEE7', // fields and chat bubbles
  ink: '#102A27', // Midnight Forest text
  muted: '#777F79', // Slate Grey
  line: '#E3E6DF',
  edge: '#D6DAD3', // outlines of round buttons and fields
  track: '#E6E9E2', // empty part of progress bars
  dashed: '#AEB4AF',
  off: '#D3D7D2', // disabled button
  offText: '#F7F7F2',
  inkBg: '#102A27', // dark panels (earnings, coach dashboard)
  link: '#102A27',
  olive: '#102A27', // main brand: Midnight Forest
  oliveDark: '#0A1D1B',
  oliveSoft: '#E6F4D2', // pale lime tint
  peach: '#B9E769', // Fresh Lime accent
  peachDeep: '#A5D951',
  black: '#0A1D1B',
  onBrand: '#FFFFFF', // text on forest, photos and dark panels
  onPeach: '#102A27', // text on lime
  cta: '#B9E769', // main action buttons: lime pill with forest text
  onCta: '#102A27',
  glow: 'rgba(185,231,105,0.16)', // soft lime glow at the top of screens
  overlay: 'rgba(5,15,13,0.55)',
  // Older names still used around the app, mapped onto the new palette.
  accent: '#102A27',
  accentSoft: '#E6F4D2',
  green: '#102A27',
  greenSoft: '#E6F4D2',
  purple: '#5E8C7A', // coach share in the 80/20 split
  danger: '#B4442E',
};

const dark: typeof light = {
  bg: '#050D0C', // near-black forest
  card: '#0F1D1B',
  sand: '#152523',
  ink: '#F7F7F2',
  muted: '#9AA29C',
  line: '#1B2C29',
  edge: '#253B37',
  track: '#1B2C29',
  dashed: '#41544F',
  off: '#1B2C29',
  offText: '#6B7A75',
  inkBg: '#12332E',
  link: '#B9E769',
  olive: '#1F4F47', // forest, lifted so it shows on black
  oliveDark: '#102A27',
  oliveSoft: '#16302B',
  peach: '#B9E769',
  peachDeep: '#A5D951',
  black: '#050D0C',
  onBrand: '#FFFFFF',
  onPeach: '#102A27',
  cta: '#B9E769',
  onCta: '#102A27',
  glow: 'rgba(46,110,86,0.55)', // forest-green glow like the Dribbble screens
  overlay: 'rgba(0,0,0,0.7)',
  accent: '#1F4F47',
  accentSoft: '#16302B',
  green: '#1F4F47',
  greenSoft: '#16302B',
  purple: '#8FB8A8',
  danger: '#F08A6E',
};

// Light or dark, switched from the side menu. The app always starts in light
// mode until someone turns dark mode on (Yana, 2026-11-01). Saved on the phone;
// the app reloads to apply it.
export type ThemePref = 'light' | 'dark';
const PREF_KEY = 'mileclub-theme-v1';

function readPref(): ThemePref {
  try {
    const v = Storage.getItemSync(PREF_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {}
  return 'light';
}

let mode: ThemePref = readPref();
// Native parts (keyboard, alerts, switches, sheets) follow the app's choice too.
function applyNative(m: ThemePref) {
  try {
    Appearance.setColorScheme(m);
  } catch {}
}
applyNative(mode);

// One shared colour object. Switching light/dark swaps its values in place and
// tells every screen to redraw, so the change is instant (no restart).
export const colors = { ...(mode === 'dark' ? dark : light) };
export const palettes = { light, dark };

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export function getThemeMode() {
  return mode;
}

export function setThemeMode(next: ThemePref) {
  if (next === mode) return;
  mode = next;
  Object.assign(colors, palettes[next]);
  applyNative(next);
  listeners.forEach((fn) => fn());
  saveThemePref(next);
}

// Screens call this so they redraw when the theme changes.
export function useTheme() {
  const m = useSyncExternalStore(subscribe, getThemeMode, getThemeMode);
  return { mode: m, isDark: m === 'dark', setMode: setThemeMode };
}

// Wraps a StyleSheet so it is rebuilt with the current colours (one copy per theme).
export function themed<T extends object>(make: () => T): T {
  const cache: Partial<Record<ThemePref, T>> = {};
  return new Proxy({} as T, {
    get(_, key) {
      const sheet = cache[mode] ?? (cache[mode] = make());
      return sheet[key as keyof T];
    },
  });
}

export function saveThemePref(pref: ThemePref) {
  try {
    Storage.setItemSync(PREF_KEY, pref);
  } catch {}
}

export const fonts = {
  // Blend look (Yana, 2026-11-13): Sora headings + Plus Jakarta Sans text.
  serif: 'Sora_700Bold',
  serifItalic: 'Sora_600SemiBold',
  sans: 'PlusJakartaSans_400Regular',
  sansMedium: 'PlusJakartaSans_500Medium',
  sansSemi: 'PlusJakartaSans_600SemiBold',
  sansBold: 'PlusJakartaSans_700Bold',
  logo: 'Outfit_800ExtraBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
