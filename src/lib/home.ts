import type { Href } from 'expo-router';

import type { Profile } from '@/data/types';

// Where someone lands after opening the app: Home (the swipe screen), for everyone (Yana, 2026-11-02).
export function homeFor(profile: Profile | null | undefined): Href {
  if (!profile) return '/welcome';
  return '/now';
}
