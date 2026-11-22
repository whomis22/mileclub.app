export const ACTIVITIES = [
  { id: 'running', label: 'Running', emoji: '🏃' },
  { id: 'gym', label: 'Gym', emoji: '🏋️' },
  { id: 'pilates', label: 'Pilates', emoji: '🧘‍♀️' },
  { id: 'yoga', label: 'Yoga', emoji: '🪷' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾' },
  { id: 'spa', label: 'Spa & wellness', emoji: '🧖' },
  { id: 'coffee', label: 'Coffee & chats', emoji: '☕' },
  { id: 'networking', label: 'Meet people in my field', emoji: '💼' },
  { id: 'new', label: 'Try something new', emoji: '🌟' },
  { id: 'strength', label: 'Strength training', emoji: '💪' },
  { id: 'other', label: 'Other', emoji: '✨' },
] as const;

export type ActivityId = (typeof ACTIVITIES)[number]['id'];

export function activityInfo(id: ActivityId) {
  return ACTIVITIES.find((a) => a.id === id) ?? ACTIVITIES[ACTIVITIES.length - 1];
}

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export type Level = (typeof LEVELS)[number];


export const GOALS = [
  'Get more active',
  'Meet new people',
  'Meet people in my field',
  'Try new things',
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
  // London
  Shoreditch: { lat: 51.5265, lng: -0.0786 },
  Soho: { lat: 51.5136, lng: -0.1365 },
  Camden: { lat: 51.539, lng: -0.1426 },
  Brixton: { lat: 51.4613, lng: -0.1156 },
  'Notting Hill': { lat: 51.5094, lng: -0.1963 },
  'Canary Wharf': { lat: 51.5054, lng: -0.0235 },
  // New York
  Williamsburg: { lat: 40.7081, lng: -73.9571 },
  'West Village': { lat: 40.7358, lng: -74.0036 },
  'Lower East Side': { lat: 40.715, lng: -73.9843 },
  'Upper East Side': { lat: 40.7736, lng: -73.9566 },
  Harlem: { lat: 40.8116, lng: -73.9465 },
  DUMBO: { lat: 40.7033, lng: -73.9881 },
  // San Francisco
  Mission: { lat: 37.7599, lng: -122.4148 },
  Marina: { lat: 37.8037, lng: -122.4368 },
  SoMa: { lat: 37.7785, lng: -122.4056 },
  'Hayes Valley': { lat: 37.7759, lng: -122.4245 },
  'Noe Valley': { lat: 37.7502, lng: -122.4337 },
  // Dubai (no longer a Mile Club city, kept so older profiles still work)
  'Dubai Marina': { lat: 25.0805, lng: 55.1403 },
  'Downtown Dubai': { lat: 25.1972, lng: 55.2744 },
  'Business Bay': { lat: 25.185, lng: 55.265 },
  Jumeirah: { lat: 25.2048, lng: 55.242 },
  JLT: { lat: 25.0693, lng: 55.1413 },
  // Doha (no longer a Mile Club city, kept so older profiles still work)
  'West Bay': { lat: 25.3238, lng: 51.5283 },
  'The Pearl': { lat: 25.3686, lng: 51.551 },
  Msheireb: { lat: 25.2867, lng: 51.5262 },
  Lusail: { lat: 25.418, lng: 51.49 },
  'Al Sadd': { lat: 25.2836, lng: 51.4995 },
  // Oslo
  'Grünerløkka': { lat: 59.9233, lng: 10.759 },
  Frogner: { lat: 59.9206, lng: 10.7062 },
  Majorstuen: { lat: 59.9295, lng: 10.7155 },
  Sentrum: { lat: 59.9127, lng: 10.7461 },
  'Gamle Oslo': { lat: 59.9056, lng: 10.774 },
  'Aker Brygge': { lat: 59.911, lng: 10.727 },
  // Manchester
  'Northern Quarter': { lat: 53.4839, lng: -2.2365 },
  Ancoats: { lat: 53.4848, lng: -2.2268 },
  'Spinningfields': { lat: 53.4808, lng: -2.2522 },
  Chorlton: { lat: 53.4419, lng: -2.2775 },
  Didsbury: { lat: 53.4166, lng: -2.2306 },
  Salford: { lat: 53.4875, lng: -2.2901 },
  'Castlefield': { lat: 53.4747, lng: -2.2556 },
  // Vancouver
  Kitsilano: { lat: 49.2684, lng: -123.1683 },
  Gastown: { lat: 49.2838, lng: -123.1087 },
  'Mount Pleasant': { lat: 49.2633, lng: -123.1007 },
  Yaletown: { lat: 49.2754, lng: -123.1216 },
  'West End': { lat: 49.2847, lng: -123.1345 },
  'Commercial Drive': { lat: 49.2734, lng: -123.0694 },
  // Los Angeles
  'Santa Monica': { lat: 34.0195, lng: -118.4912 },
  'Silver Lake': { lat: 34.0869, lng: -118.2702 },
  Venice: { lat: 33.985, lng: -118.4695 },
  'West Hollywood': { lat: 34.09, lng: -118.3617 },
  'Downtown LA': { lat: 34.0407, lng: -118.2468 },
  'Echo Park': { lat: 34.0782, lng: -118.2606 },
  // Toronto
  'Queen West': { lat: 43.6465, lng: -79.4111 },
  'The Annex': { lat: 43.6705, lng: -79.4068 },
  'Liberty Village': { lat: 43.6383, lng: -79.4201 },
  Leslieville: { lat: 43.6627, lng: -79.3326 },
  'Kensington Market': { lat: 43.6547, lng: -79.4005 },
  Yorkville: { lat: 43.6709, lng: -79.3932 },
  // Melbourne
  Fitzroy: { lat: -37.7983, lng: 144.9787 },
  'St Kilda': { lat: -37.8676, lng: 144.9809 },
  Richmond: { lat: -37.8182, lng: 145.0018 },
  'South Yarra': { lat: -37.8389, lng: 144.9926 },
  Brunswick: { lat: -37.7667, lng: 144.9603 },
  'Melbourne CBD': { lat: -37.8136, lng: 144.9631 },
  // Stockholm (no longer a Mile Club city, kept so older profiles still work)
  'Södermalm': { lat: 59.315, lng: 18.071 },
  'Östermalm': { lat: 59.338, lng: 18.085 },
  Vasastan: { lat: 59.345, lng: 18.048 },
  Kungsholmen: { lat: 59.331, lng: 18.03 },
  Norrmalm: { lat: 59.335, lng: 18.063 },
} as const;
export type Neighborhood = keyof typeof NEIGHBORHOODS;
export const NEIGHBORHOOD_NAMES = Object.keys(NEIGHBORHOODS) as Neighborhood[];

// Cities Mile Club is opening in (Yana, 2026-11-22), each with its neighbourhoods.
export const CITIES = [
  { id: 'Manchester', label: 'Manchester', hoods: ['Northern Quarter', 'Ancoats', 'Spinningfields', 'Castlefield', 'Chorlton', 'Didsbury', 'Salford'] },
  { id: 'London', label: 'London', hoods: ['Shoreditch', 'Soho', 'Camden', 'Brixton', 'Notting Hill', 'Canary Wharf'] },
  { id: 'New York', label: 'New York', hoods: ['Williamsburg', 'West Village', 'Lower East Side', 'Upper East Side', 'Harlem', 'DUMBO'] },
  { id: 'Amsterdam', label: 'Amsterdam', hoods: ['Centrum', 'Jordaan', 'De Pijp', 'Oud-West', 'Oud-Zuid', 'Oost', 'Indische Buurt', 'Westerpark', 'De Baarsjes', 'Noord', 'Watergraafsmeer', 'Zuidas'] },
  { id: 'San Francisco', label: 'San Francisco', hoods: ['Mission', 'Marina', 'SoMa', 'Hayes Valley', 'Noe Valley'] },
  { id: 'Vancouver', label: 'Vancouver', hoods: ['Kitsilano', 'Gastown', 'Mount Pleasant', 'Yaletown', 'West End', 'Commercial Drive'] },
  { id: 'Oslo', label: 'Oslo', hoods: ['Grünerløkka', 'Frogner', 'Majorstuen', 'Sentrum', 'Gamle Oslo', 'Aker Brygge'] },
  { id: 'Toronto', label: 'Toronto', hoods: ['Queen West', 'The Annex', 'Liberty Village', 'Leslieville', 'Kensington Market', 'Yorkville'] },
  { id: 'Melbourne', label: 'Melbourne', hoods: ['Fitzroy', 'St Kilda', 'Richmond', 'South Yarra', 'Brunswick', 'Melbourne CBD'] },
  { id: 'Los Angeles', label: 'Los Angeles', hoods: ['Santa Monica', 'Silver Lake', 'Venice', 'West Hollywood', 'Downtown LA', 'Echo Park'] },
] as const satisfies readonly { id: string; label: string; hoods: readonly Neighborhood[] }[];
export type City = (typeof CITIES)[number]['id'];

export function cityOf(n: Neighborhood): City | undefined {
  return CITIES.find((c) => (c.hoods as readonly Neighborhood[]).includes(n))?.id;
}

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

// Who you are, and who you'd like to meet up with. Used to filter runs and people.
export const GENDERS = ['Woman', 'Man', 'Non-binary'] as const;
export type Gender = (typeof GENDERS)[number];
export const MEET = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'women', label: 'Women only' },
  { id: 'men', label: 'Men only' },
] as const;
export type Meet = (typeof MEET)[number]['id'];
