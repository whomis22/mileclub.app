import { Storage } from '@/lib/kv';
import { Appearance } from 'react-native';
import { useSyncExternalStore } from 'react';

// Mile Club colours (Yana, 2026-11-21): Midnight Forest #102A27 (main brand),
// Fresh Lime #B9E769 (signature accent), Cloud White #F7F7F2 (light background),
// Slate Grey #777F79 (secondary text). Dark mode is a near-black forest with a green glow,
// lime buttons (Dribbble fitness look Yana sent). Older names (olive, peach) are kept
// so every screen picks the new colours up: olive = forest, peach = lime.
const light = {
  // Design board, light version (Yana, 2026-11-21): white pages, soft grey cards,
  // lime buttons with black text, black secondary buttons, lime chat bubbles.
  bg: '#FFFFFF',
  card: '#F4F4F7',
  sand: '#F0F0F4', // fields and chat bubbles
  ink: '#0A0A0A',
  muted: '#86868B',
  line: '#ECECF0',
  edge: '#E2E2E8', // outlines of round buttons and fields
  track: '#ECECF0', // empty part of progress bars
  dashed: '#B5B5BA',
  off: '#DCDCE0', // disabled button
  offText: '#FFFFFF',
  inkBg: '#0A0A0A', // dark panels (earnings, coach dashboard)
  link: '#4E7D12', // dark lime, readable on white
  olive: '#B9E769', // main buttons: Fresh Lime
  oliveDark: '#102A27',
  oliveSoft: '#EEF8DC',
  peach: '#B9E769',
  peachDeep: '#A5D951',
  black: '#0A0A0A',
  onBrand: '#000000', // text on lime
  onPeach: '#000000',
  cta: '#B9E769',
  onCta: '#000000',
  violet: '#0A0A0A', // light board uses black for the second button colour
  onViolet: '#FFFFFF',
  mine: '#B9E769', // my chat bubbles
  onMine: '#000000',
  glow: 'rgba(0,0,0,0)',
  overlay: 'rgba(0,0,0,0.5)',
  // Older names still used around the app, mapped onto the new palette.
  accent: '#B9E769',
  accentSoft: '#EEF8DC',
  green: '#4E7D12',
  greenSoft: '#EEF8DC',
  purple: '#6C4CF1', // coach share in the 80/20 split
  danger: '#E5484D',
};

const dark: typeof light = {
  // Design board (Yana, 2026-11-21): true black, near-black cards, lime buttons, purple accents.
  bg: '#000000',
  card: '#141414',
  sand: '#1C1C1E',
  ink: '#FFFFFF',
  muted: '#9A9A9E',
  line: '#232325',
  edge: '#2C2C2E',
  track: '#232325',
  dashed: '#48484A',
  off: '#232325',
  offText: '#6E6E73',
  inkBg: '#1C1C1E',
  link: '#B9E769',
  olive: '#B9E769', // main buttons are lime on black
  oliveDark: '#102A27',
  oliveSoft: '#1E2615',
  peach: '#B9E769',
  peachDeep: '#A5D951',
  black: '#000000',
  onBrand: '#000000', // text on lime
  onPeach: '#000000',
  cta: '#B9E769',
  onCta: '#000000',
  violet: '#6C4CF1',
  onViolet: '#FFFFFF',
  mine: '#6C4CF1', // my chat bubbles: purple on black
  onMine: '#FFFFFF',
  glow: 'rgba(0,0,0,0)', // no glow: flat black like the board
  overlay: 'rgba(0,0,0,0.7)',
  accent: '#B9E769',
  accentSoft: '#1E2615',
  green: '#B9E769',
  greenSoft: '#1E2615',
  purple: '#6C4CF1',
  danger: '#FF5A5F',
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
  return 'dark'; // everyone starts in dark mode, light is a switch away (Yana, 2026-11-22)
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
