import { Appearance } from 'react-native';
import { Storage } from 'expo-sqlite/kv-store';

// Mile Club look: Rich Olive (brand, buttons), Warm Cream (backgrounds),
// Soft Peach (highlights, likes, social bits). Logo: olive m + peach c on cream.
// Dark mode is "Olive night" (picked by Yana 2026-11-01): olive-black background,
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
  bg: '#15170F',
  card: '#1E2117',
  sand: '#262A1E',
  ink: '#F1EBDD',
  muted: '#A39E8C',
  line: '#2C3022',
  edge: '#3A3F2E',
  track: '#2C3022',
  dashed: '#5A5E4C',
  off: '#33382A',
  offText: '#7D7A6C',
  inkBg: '#2F3D29',
  link: '#C5D49A',
  olive: '#556B2F',
  oliveDark: '#2F3D29',
  oliveSoft: '#2A3320',
  peach: '#F6C6A8',
  peachDeep: '#F4B595',
  black: '#111111',
  onBrand: '#F7F1E6',
  onPeach: '#262A1C',
  overlay: 'rgba(0,0,0,0.6)',
  accent: '#556B2F',
  accentSoft: '#2A3320',
  green: '#556B2F',
  greenSoft: '#2A3320',
  purple: '#C98B68',
  danger: '#E8956F',
};

// Light, dark, or follow the phone. Saved on the phone; the app reloads to apply it.
export type ThemePref = 'system' | 'light' | 'dark';
const PREF_KEY = 'mileclub-theme-v1';

function readPref(): ThemePref {
  try {
    const v = Storage.getItemSync(PREF_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {}
  return 'system';
}

export const themePref: ThemePref = readPref();
export const isDark = themePref === 'dark' || (themePref === 'system' && Appearance.getColorScheme() === 'dark');
export const colors = isDark ? dark : light;

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
