import Feather from '@expo/vector-icons/Feather';

import { COACHES } from './coaches';
import { NEIGHBORHOODS, activityInfo } from './options';
import type { Activity } from './types';

// Explore (Yana, 2026-11-21): places to move near you. Sample places are placed
// around wherever you are until real venues come from a places service.
export type PlaceKind = 'gym' | 'studio' | 'padel' | 'run' | 'pool' | 'class' | 'coach' | 'group';

export const KINDS: { id: PlaceKind; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'gym', label: 'Gyms', icon: 'activity' },
  { id: 'studio', label: 'Pilates & yoga', icon: 'sun' },
  { id: 'padel', label: 'Padel', icon: 'target' },
  { id: 'run', label: 'Running clubs', icon: 'wind' },
  { id: 'pool', label: 'Pools', icon: 'droplet' },
  { id: 'class', label: 'Classes', icon: 'zap' },
  { id: 'coach', label: 'Coaches & PTs', icon: 'award' },
  { id: 'group', label: 'Group activities', icon: 'users' },
];

export type LatLng = { latitude: number; longitude: number };

export type Place = {
  id: string;
  kind: PlaceKind;
  name: string;
  detail: string; // one line: what it is / what's on
  rating: number;
  at: LatLng;
  open?: string; // "Open till 22:00"
  price?: string;
  href: string; // where tapping goes
  action: string; // button text
};

const SAMPLE: Record<Exclude<PlaceKind, 'coach' | 'group'>, { name: string; detail: string; open: string; price: string }[]> = {
  gym: [
    { name: 'Ironworks Gym', detail: 'Free weights, squat racks, sauna', open: 'Open 24/7', price: 'Day pass €15' },
    { name: 'Northside Strength', detail: 'Powerlifting and functional floor', open: 'Open till 23:00', price: 'Day pass €12' },
    { name: 'The Loft Fitness', detail: 'Boutique gym with rooftop terrace', open: 'Open till 22:00', price: 'Day pass €20' },
  ],
  studio: [
    { name: 'Still Point Yoga', detail: 'Vinyasa, yin and hot yoga', open: 'Next class 18:30', price: 'Drop-in €18' },
    { name: 'Core Reformer Club', detail: 'Reformer pilates, small groups', open: 'Next class 19:00', price: 'Drop-in €28' },
    { name: 'Flow House', detail: 'Mat pilates and breathwork', open: 'Next class 17:45', price: 'Drop-in €16' },
  ],
  padel: [
    { name: 'Rooftop Padel', detail: '4 covered courts, rackets to rent', open: 'Courts free from 19:30', price: '€32 / court hour' },
    { name: 'Padel Yard', detail: '6 indoor courts and a bar', open: 'Courts free from 20:00', price: '€28 / court hour' },
  ],
  run: [
    { name: 'Sunrise Run Crew', detail: 'Tue & Thu 06:45, all paces', open: 'Next run tomorrow 06:45', price: 'Free' },
    { name: 'Canal Runners', detail: 'Social 5k + coffee on Saturdays', open: 'Next run Sat 09:00', price: 'Free' },
    { name: 'Night Miles', detail: 'Evening 8k, 5:30–6:30/km', open: 'Next run Wed 19:30', price: 'Free' },
  ],
  pool: [
    { name: 'City Lido', detail: 'Heated 50 m outdoor pool', open: 'Open till 21:00', price: '€7 a swim' },
    { name: 'Parkside Baths', detail: '25 m pool, lane swimming', open: 'Lanes free from 18:00', price: '€5 a swim' },
  ],
  class: [
    { name: 'Spin Society', detail: 'Rhythm cycling, 45 min', open: 'Next class 18:15', price: '€19' },
    { name: 'HIIT Lab', detail: 'Bootcamp and boxing classes', open: 'Next class 19:15', price: '€17' },
    { name: 'Dance Cardio Club', detail: 'Fun, sweaty, no experience needed', open: 'Next class 20:00', price: '€15' },
  ],
};

// Same spot every time for the same place: a small offset around the centre (about 0.3–2.8 km).
function spot(centre: LatLng, seed: number): LatLng {
  const angle = (seed * 137.5 * Math.PI) / 180;
  const km = 0.3 + ((seed * 7) % 10) * 0.27;
  return {
    latitude: centre.latitude + (km / 111) * Math.cos(angle),
    longitude: centre.longitude + (km / (111 * Math.cos((centre.latitude * Math.PI) / 180))) * Math.sin(angle),
  };
}

export function placesAround(centre: LatLng, activities: Activity[]): Place[] {
  const out: Place[] = [];
  let seed = 1;
  (Object.keys(SAMPLE) as (keyof typeof SAMPLE)[]).forEach((kind) => {
    SAMPLE[kind].forEach((p, i) => {
      out.push({
        id: `${kind}-${i}`,
        kind,
        name: p.name,
        detail: p.detail,
        open: p.open,
        price: p.price,
        rating: 4.3 + ((seed * 3) % 7) / 10,
        at: spot(centre, seed++),
        href: '/create-activity',
        action: kind === 'run' ? 'Join a run' : kind === 'padel' ? 'Find a 4th' : 'Go with someone',
      });
    });
  });
  COACHES.slice(0, 4).forEach((c) => {
    out.push({
      id: `coach-${c.id}`,
      kind: 'coach',
      name: c.name,
      detail: c.headline,
      rating: c.rating,
      at: spot(centre, seed++),
      open: `${c.sessionsRun} sessions run`,
      href: `/coach/${c.id}`,
      action: 'See sessions',
    });
  });
  activities
    .filter((a) => !a.solo && a.participants.length < a.groupSize)
    .slice(0, 8)
    .forEach((a) => {
      const hood = NEIGHBORHOODS[a.neighborhood];
      const near = Math.abs(hood.lat - centre.latitude) < 0.3 && Math.abs(hood.lng - centre.longitude) < 0.3;
      out.push({
        id: `group-${a.id}`,
        kind: 'group',
        name: a.title,
        detail: `${activityInfo(a.type).label} · ${a.participants.length}/${a.groupSize} going`,
        rating: 4.8,
        at: near ? spot({ latitude: hood.lat, longitude: hood.lng }, seed++) : spot(centre, seed++),
        open: `${a.date.slice(5).split('-').reverse().join('/')} at ${a.time}`,
        href: `/activity/${a.id}`,
        action: 'Join',
      });
    });
  return out;
}

export function kmBetween(a: LatLng, b: LatLng) {
  const r = (d: number) => (d * Math.PI) / 180;
  const h = Math.sin(r(b.latitude - a.latitude) / 2) ** 2 + Math.cos(r(a.latitude)) * Math.cos(r(b.latitude)) * Math.sin(r(b.longitude - a.longitude) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
