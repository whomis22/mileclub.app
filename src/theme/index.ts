// Mile Club look: Rich Olive (brand, buttons), Warm Cream (backgrounds),
// Soft Peach (highlights, likes, social bits). Logo: olive m + peach c on cream.
export const colors = {
  bg: '#F7F1E6', // warm cream
  card: '#FFFFFF',
  sand: '#EDE5D6', // slightly darker cream for fields and chat bubbles
  ink: '#262A1C',
  muted: '#6E6A5E',
  line: '#E0D7C6',
  olive: '#556B2F',
  oliveDark: '#2F3D29',
  oliveSoft: '#E3E6D3',
  peach: '#F6C6A8',
  peachDeep: '#F4B595',
  black: '#111111',
  // Older names still used around the app, mapped onto the new palette.
  accent: '#556B2F',
  accentSoft: '#E3E6D3',
  green: '#556B2F',
  greenSoft: '#E3E6D3',
  purple: '#9A5B3C', // warm brown, used for the coach share in the 80/20 split
  danger: '#A1402A',
} as const;

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
