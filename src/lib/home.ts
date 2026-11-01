import type { Href } from 'expo-router';

import type { Profile } from '@/data/types';

// Where someone lands after opening the app: the Explore feed, for everyone (Yana, 2026-11-01).
export function homeFor(profile: Profile | null | undefined): Href {
  if (!profile) return '/welcome';
  return '/feed';
}
