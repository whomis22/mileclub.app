import type { ActivityId } from './options';

// One person asking for one (or two) people to join them. Sample data until
// there's a server (Yana, 2026-11-15: "not all has to be groups").
export type Invite = {
  id: string;
  personId: string;
  type: ActivityId;
  what: string; // in their own words
  day: 'Today' | 'Tomorrow' | 'Sat' | 'Sun';
  time: string;
  place: string;
  spots: number;
};

export const INVITES: Invite[] = [
  { id: 'inv-1', personId: 'sanne', type: 'tennis', what: 'Need a padel partner, I booked a court', day: 'Today', time: '18:30', place: 'De Pijp', spots: 1 },
  { id: 'inv-2', personId: 'daan', type: 'spa', what: 'Sauna and cold plunge after work, anyone?', day: 'Today', time: '19:00', place: 'Oost', spots: 1 },
  { id: 'inv-3', personId: 'amira', type: 'coffee', what: 'Coffee walk by the canals, new in town', day: 'Tomorrow', time: '11:00', place: 'Oud-West', spots: 2 },
  { id: 'inv-4', personId: 'lucas', type: 'strength', what: 'Looking for a gym buddy to push me', day: 'Tomorrow', time: '07:00', place: 'Jordaan', spots: 1 },
  { id: 'inv-5', personId: 'femke', type: 'running', what: 'Easy 5k, then breakfast on me', day: 'Sat', time: '09:00', place: 'Westerpark', spots: 1 },
  { id: 'inv-6', personId: 'noah', type: 'networking', what: 'Founder here, lunch and a walk with someone in tech?', day: 'Sat', time: '12:30', place: 'Oud-Zuid', spots: 1 },
  { id: 'inv-7', personId: 'yasmin', type: 'yoga', what: 'Trying a hot yoga class for the first time, come with me', day: 'Sun', time: '10:00', place: 'De Baarsjes', spots: 1 },
];
