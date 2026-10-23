import { LEVELS, distanceKm } from '@/data/options';
import type { Activity, Person, Profile } from '@/data/types';

function overlap<T>(a: readonly T[], b: readonly T[]) {
  if (a.length === 0 || b.length === 0) return 0;
  const shared = a.filter((x) => b.includes(x)).length;
  return shared / Math.min(a.length, b.length);
}

function levelFit(a: Profile['level'], b: Profile['level']) {
  const gap = Math.abs(LEVELS.indexOf(a) - LEVELS.indexOf(b));
  return gap === 0 ? 1 : gap === 1 ? 0.5 : 0;
}

function nearness(km: number) {
  // Full marks within 2 km, nothing beyond 8 km.
  return Math.max(0, Math.min(1, (8 - km) / 6));
}

// Weighted score following the PRD: activity, location, availability and level
// matter most; goals, group size and social style fine-tune it.
export function matchScore(me: Profile, other: Profile) {
  const km = distanceKm(me.neighborhood, other.neighborhood);
  const raw =
    0.28 * overlap(me.activities, other.activities) +
    0.22 * overlap(me.availability, other.availability) +
    0.18 * levelFit(me.level, other.level) +
    0.14 * nearness(km) +
    0.1 * overlap(me.goals, other.goals) +
    0.05 * (me.groupSize === other.groupSize ? 1 : 0) +
    0.03 * (me.social === other.social || me.social === 'A bit of both' || other.social === 'A bit of both' ? 1 : 0);
  return Math.round(40 + raw * 59);
}

export type Match = { person: Person; score: number; km: number; shared: Person['activities'] };

export function rankPeople(me: Profile, people: Person[]): Match[] {
  return people
    .map((person) => ({
      person,
      score: matchScore(me, person),
      km: distanceKm(me.neighborhood, person.neighborhood),
      shared: person.activities.filter((a) => me.activities.includes(a)),
    }))
    .sort((a, b) => b.score - a.score);
}

export function activityFit(me: Profile, activity: Activity) {
  let score = 0;
  if (me.activities.includes(activity.type)) score += 3;
  if (activity.level === me.level) score += 2;
  score += nearness(distanceKm(me.neighborhood, activity.neighborhood)) * 2;
  return score;
}

export function formatKm(km: number) {
  return `${km.toFixed(1)} km away`;
}
