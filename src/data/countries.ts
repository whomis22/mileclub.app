import { getLocales } from 'expo-localization';

// Country calling codes for the phone sign-up. The list covers the places we
// expect people to sign up from first; more can be added any time.
export type Country = { code: string; name: string; dial: string };

export const COUNTRIES: Country[] = [
  { code: 'NL', name: 'Netherlands', dial: '+31' },
  { code: 'GB', name: 'United Kingdom', dial: '+44' },
  { code: 'US', name: 'United States', dial: '+1' },
  { code: 'CA', name: 'Canada', dial: '+1' },
  { code: 'IE', name: 'Ireland', dial: '+353' },
  { code: 'BE', name: 'Belgium', dial: '+32' },
  { code: 'DE', name: 'Germany', dial: '+49' },
  { code: 'FR', name: 'France', dial: '+33' },
  { code: 'ES', name: 'Spain', dial: '+34' },
  { code: 'PT', name: 'Portugal', dial: '+351' },
  { code: 'IT', name: 'Italy', dial: '+39' },
  { code: 'CH', name: 'Switzerland', dial: '+41' },
  { code: 'AT', name: 'Austria', dial: '+43' },
  { code: 'LU', name: 'Luxembourg', dial: '+352' },
  { code: 'DK', name: 'Denmark', dial: '+45' },
  { code: 'SE', name: 'Sweden', dial: '+46' },
  { code: 'NO', name: 'Norway', dial: '+47' },
  { code: 'FI', name: 'Finland', dial: '+358' },
  { code: 'IS', name: 'Iceland', dial: '+354' },
  { code: 'PL', name: 'Poland', dial: '+48' },
  { code: 'CZ', name: 'Czechia', dial: '+420' },
  { code: 'HU', name: 'Hungary', dial: '+36' },
  { code: 'RO', name: 'Romania', dial: '+40' },
  { code: 'GR', name: 'Greece', dial: '+30' },
  { code: 'TR', name: 'Türkiye', dial: '+90' },
  { code: 'UA', name: 'Ukraine', dial: '+380' },
  { code: 'IL', name: 'Israel', dial: '+972' },
  { code: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { code: 'EG', name: 'Egypt', dial: '+20' },
  { code: 'MA', name: 'Morocco', dial: '+212' },
  { code: 'NG', name: 'Nigeria', dial: '+234' },
  { code: 'GH', name: 'Ghana', dial: '+233' },
  { code: 'KE', name: 'Kenya', dial: '+254' },
  { code: 'ZA', name: 'South Africa', dial: '+27' },
  { code: 'IN', name: 'India', dial: '+91' },
  { code: 'PK', name: 'Pakistan', dial: '+92' },
  { code: 'SG', name: 'Singapore', dial: '+65' },
  { code: 'MY', name: 'Malaysia', dial: '+60' },
  { code: 'ID', name: 'Indonesia', dial: '+62' },
  { code: 'PH', name: 'Philippines', dial: '+63' },
  { code: 'TH', name: 'Thailand', dial: '+66' },
  { code: 'VN', name: 'Vietnam', dial: '+84' },
  { code: 'CN', name: 'China', dial: '+86' },
  { code: 'HK', name: 'Hong Kong', dial: '+852' },
  { code: 'JP', name: 'Japan', dial: '+81' },
  { code: 'KR', name: 'South Korea', dial: '+82' },
  { code: 'AU', name: 'Australia', dial: '+61' },
  { code: 'NZ', name: 'New Zealand', dial: '+64' },
  { code: 'MX', name: 'Mexico', dial: '+52' },
  { code: 'BR', name: 'Brazil', dial: '+55' },
  { code: 'AR', name: 'Argentina', dial: '+54' },
  { code: 'CL', name: 'Chile', dial: '+56' },
  { code: 'CO', name: 'Colombia', dial: '+57' },
  { code: 'PE', name: 'Peru', dial: '+51' },
  { code: 'SR', name: 'Suriname', dial: '+597' },
  { code: 'CW', name: 'Curaçao', dial: '+599' },
  { code: 'AW', name: 'Aruba', dial: '+297' },
  { code: 'JM', name: 'Jamaica', dial: '+1' },
];

export function flagOf(code: string) {
  return String.fromCodePoint(...[...code.toUpperCase()].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

// The phone's own region setting decides the starting country: a phone set to
// the UK starts on +44, one set to the US on +1. People can still change it.
export function defaultCountry(): Country {
  let region: string | null | undefined;
  try {
    region = getLocales()[0]?.regionCode;
  } catch {
    region = undefined;
  }
  return COUNTRIES.find((c) => c.code === region?.toUpperCase()) ?? COUNTRIES[0];
}
