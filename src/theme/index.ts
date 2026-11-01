import { Storage } from 'expo-sqlite/kv-store';
import { useSyncExternalStore } from 'react';

// Mile Club look: Rich Olive (brand, buttons), Warm Cream (backgrounds),
// Soft Peach (highlights, likes, social bits). Logo: olive m + peach c on cream.
// Dark mode is "True black" (picked by Yana 2026-11-01): pure black background,
// cream text, same olive and peach.
const light = {
  bg: '#F7F1E6', // warm cream
  card: '#FFFFFF',
  sand: '#EDE5D6', // slightly darker cream for fields and chat bubbles
  ink: '#262A1C',
  muted: '#6E6A5E',
  line: '#E0D7C6',
  edge: '#D8CFBE', // outlines of round buttons and fields
  track: '#E6DDCC', // empty part of progress bars
  dashed: '#B9AE98',
  off: '#CFC8B6', // disabled button
  offText: '#F3EDE2',
  inkBg: '#262A1C', // dark panels (earnings, coach dashboard)
  link: '#556B2F', // olive text and links
  olive: '#556B2F',
  oliveDark: '#2F3D29',
  oliveSoft: '#E3E6D3',
  peach: '#F6C6A8',
  peachDeep: '#F4B595',
  black: '#111111',
  onBrand: '#F7F1E6', // text on olive, photos and dark panels
  onPeach: '#262A1C', // text on peach
  overlay: 'rgba(38,42,28,0.55)',
  // Older names still used around the app, mapped onto the new palette.
  accent: '#556B2F',
  accentSoft: '#E3E6D3',
  green: '#556B2F',
  greenSoft: '#E3E6D3',
  purple: '#9A5B3C', // warm brown, used for the coach share in the 80/20 split
  danger: '#A1402A',
};

const dark: typeof light = {
  bg: '#000000',
  card: '#141414',
  sand: '#1C1C1C',
  ink: '#F7F1E6',
  muted: '#9A968C',
  line: '#262626',
  edge: '#333333',
  track: '#262626',
  dashed: '#555555',
  off: '#2A2A2A',
  offText: '#777777',
  inkBg: '#2F3D29',
  link: '#C5D49A',
  olive: '#556B2F',
  oliveDark: '#2F3D29',
  oliveSoft: '#1F2618',
  peach: '#F6C6A8',
  peachDeep: '#F4B595',
  black: '#111111',
  onBrand: '#F7F1E6',
  onPeach: '#262A1C',
  overlay: 'rgba(0,0,0,0.7)',
  accent: '#556B2F',
  accentSoft: '#1F2618',
  green: '#556B2F',
  greenSoft: '#1F2618',
  purple: '#C98B68',
  danger: '#E8956F',
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
  saveThemePref(next);
  listeners.forEach((fn) => fn());
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
  serif: 'InstrumentSerif_400Regular',
  serifItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemi: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
  logo: 'Outfit_800ExtraBold',
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;
