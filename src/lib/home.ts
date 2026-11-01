import type { Href } from 'expo-router';

import type { Profile } from '@/data/types';

// Where someone lands after opening the app: coaches get their Studio, everyone else Home.
export function homeFor(profile: Profile | null | undefined): Href {
  if (!profile) return '/welcome';
  return (profile.role === 'coach' ? '/studio' : '/now') as Href;
}
