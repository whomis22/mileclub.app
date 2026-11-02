import { findPerson } from '@/data/people';
import type { Activity, Person, Profile } from '@/data/types';

// Does this person fit who the user wants to meet?
export function fitsMeet(profile: Profile, person: Pick<Person, 'gender'>) {
  if (profile.meet === 'women') return person.gender === 'Woman';
  if (profile.meet === 'men') return person.gender === 'Man';
  return true;
}

// Should this run show up for the user? Their own runs and runs they're in always do.
export function canSeeRun(profile: Profile | null, a: Activity) {
  if (!profile || a.hostId === 'me' || a.participants.includes('me')) return true;
  if (a.womenOnly && profile.gender !== 'Woman') return false;
  const host = findPerson(a.hostId);
  if (!host) return true;
  return fitsMeet(profile, host);
}
