export const ACTIVITIES = [
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'gym', label: 'Gym', emoji: '🏋️' },
  { id: 'pilates', label: 'Pilates', emoji: '🧘‍♀️' },
  { id: 'yoga', label: 'Yoga', emoji: '🪷' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾' },
  { id: 'strength', label: 'Strength training', emoji: '💪' },
  { id: 'other', label: 'Other', emoji: '✨' },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]['id'];

export function activityInfo(id: ActivityId) {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[ACTIVITIES.length - 1];
}

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export type Level = (typeof LEVELS)[number];

export const AGE_RANGES = ['18–24', '25–29', '30–35', '36+'] as const;
export type AgeRange = (typeof AGE_RANGES)[number];

export const GOALS = [
  'Get more active',
  'Meet new people',
  'Train for a race',
  'Stay consistent',
  'Get stronger',
  'Have fun',
] as const;
export type Goal = (typeof GOALS)[number];

export const AVAILABILITY = [
  'Weekday mornings',
  'Weekday lunch',
  'Weekday evenings',
  'Weekend mornings',
  'Weekend afternoons',
] as const;
export type Slot = (typeof AVAILABILITY)[number];

export const GROUP_SIZES = ['1-on-1', 'Small group (3–6)', 'Bigger group (7+)'] as const;
export type GroupSize = (typeof GROUP_SIZES)[number];

export const SOCIAL = ['Chatty', 'Focused', 'A bit of both'] as const;
export type Social = (typeof SOCIAL)[number];

// Rough centre point of each neighbourhood, used to estimate distance.
export const NEIGHBORHOODS = {
  Centrum: { lat: 52.3731, lng: 4.8922 },
  Jordaan: { lat: 52.3747, lng: 4.8805 },
  'De Pijp': { lat: 52.3533, lng: 4.8936 },
  'Oud-West': { lat: 52.3648, lng: 4.8681 },
  'Oud-Zuid': { lat: 52.3546, lng: 4.8686 },
  Oost: { lat: 52.3606, lng: 4.9260 },
  'Indische Buurt': { lat: 52.3633, lng: 4.9408 },
  Westerpark: { lat: 52.3864, lng: 4.8757 },
  'De Baarsjes': { lat: 52.3680, lng: 4.8540 },
  Noord: { lat: 52.3945, lng: 4.9180 },
  Watergraafsmeer: { lat: 52.3510, lng: 4.9420 },
  Zuidas: { lat: 52.3389, lng: 4.8730 },
} as const;
export type Neighborhood = keyof typeof NEIGHBORHOODS;
export const NEIGHBORHOOD_NAMES = Object.keys(NEIGHBORHOODS) as Neighborhood[];

export function distanceKm(a: Neighborhood, b: Neighborhood) {
  const p = NEIGHBORHOODS[a];
  const q = NEIGHBORHOODS[b];
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(q.lat - p.lat);
  const dLng = toRad(q.lng - p.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(p.lat)) * Math.cos(toRad(q.lat)) * Math.sin(dLng / 2) ** 2;
  // Same neighbourhood still means a short walk, never zero.
  return Math.max(0.6, 2 * 6371 * Math.asin(Math.sqrt(h)));
}
