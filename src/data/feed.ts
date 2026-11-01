import type { ActivityId } from './options';

export type FeedPost = {
  id: string;
  personId: string;
  type: ActivityId;
  title: string;
  hoursAgo: number;
  place: string;
  distanceKm?: number;
  minutes: number;
  pace?: string;
  withCount: number; // how many others joined
  note?: string;
  kudos: number;
  route: number; // which sample route shape to draw
};

// Sample finished workouts from members, so the feed has life before launch.
export const FEED: FeedPost[] = [
  {
    id: 'f1', personId: 'femke', type: 'running', title: 'Westerpark Sunrise Loop', hoursAgo: 2,
    place: 'Westerpark', distanceKm: 7.2, minutes: 42, pace: '5:50/km', withCount: 6,
    note: 'Fog on the canal and a new PB on the second loop 🌅', kudos: 18, route: 0,
  },
  {
    id: 'f2', personId: 'daan', type: 'running', title: 'Amstel Long Run', hoursAgo: 5,
    place: 'Centrum', distanceKm: 15.4, minutes: 81, pace: '5:15/km', withCount: 3,
    note: 'Marathon block week 4. Legs felt fresh.', kudos: 24, route: 1,
  },
  {
    id: 'f3', personId: 'amira', type: 'yoga', title: 'Sunset Yoga Flow', hoursAgo: 20,
    place: 'Oosterpark', minutes: 60, withCount: 11, kudos: 9, route: -1,
    note: 'So many new faces tonight!',
  },
  {
    id: 'f4', personId: 'tom', type: 'cycling', title: 'Noord Countryside Ride', hoursAgo: 26,
    place: 'Noord', distanceKm: 41.8, minutes: 118, pace: '21.3 km/h', withCount: 5, kudos: 14, route: 2,
    note: 'Apple pie in Marken was worth the headwind.',
  },
  {
    id: 'f5', personId: 'sanne', type: 'running', title: 'First 5K without stopping', hoursAgo: 30,
    place: 'Vondelpark', distanceKm: 5.0, minutes: 33, pace: '6:36/km', withCount: 4, kudos: 41, route: 3,
    note: 'Three months ago I could not run to the tram. Thank you Thursday crew 🥹',
  },
];
