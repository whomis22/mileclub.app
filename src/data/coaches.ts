import type { ActivityId, Neighborhood } from './options';

export type Coach = {
  id: string;
  name: string;
  color: string;
  headline: string;
  bio: string;
  specialties: string[];
  neighborhood: Neighborhood;
  followers: number;
  rating: number;
  sessionsRun: number;
};

export const SESSION_KINDS = ['Group training', 'Marathon prep', 'Speed & track', 'Strength for runners', 'Beginner coaching', '1-on-1'] as const;
export type SessionKind = (typeof SESSION_KINDS)[number];

export type CoachSession = {
  id: string;
  coachId: string; // "me" when the user hosts it
  kind: SessionKind;
  type: ActivityId;
  title: string;
  date: string;
  time: string;
  location: string;
  neighborhood: Neighborhood;
  price: number; // euros per person
  spots: number;
  booked: number; // other people who booked (sample)
  description: string;
  weeks?: number; // for multi-week programmes
};

// Sample coaches. Made-up people, so nothing here is a real person's brand.
export const COACHES: Coach[] = [
  {
    id: 'c-jesse', name: 'Jesse de Vries', color: '#A855F7', headline: 'Marathon coach · 2:31 marathoner',
    bio: 'I’ve coached 300+ runners to their first marathon. Structured plans, honest feedback, lots of laughs.',
    specialties: ['Marathon prep', 'Half marathon', 'Pacing'], neighborhood: 'Oud-Zuid', followers: 1240, rating: 4.9, sessionsRun: 186,
  },
  {
    id: 'c-noor', name: 'Noor Bakker', color: '#FF4D8D', headline: 'Strength coach for runners',
    bio: 'Stronger legs, fewer injuries. Short sessions that fit around your running week.',
    specialties: ['Strength', 'Mobility', 'Injury prevention'], neighborhood: 'De Pijp', followers: 860, rating: 4.8, sessionsRun: 112,
  },
  {
    id: 'c-ruben', name: 'Ruben Smit', color: '#FFB057', headline: 'Track & speed sessions',
    bio: 'Former 800m athlete. Intervals that are hard, fun and actually make you faster.',
    specialties: ['Intervals', '5K & 10K', 'Track'], neighborhood: 'Oost', followers: 540, rating: 4.7, sessionsRun: 74,
  },
  {
    id: 'c-elif', name: 'Elif Yilmaz', color: '#1F8A5B', headline: 'Couch to 5K coach',
    bio: 'Never run before? Perfect. Small groups, walk breaks allowed, zero judgement.',
    specialties: ['Beginners', 'Couch to 5K', 'Confidence'], neighborhood: 'Westerpark', followers: 410, rating: 5.0, sessionsRun: 58,
  },
];

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function sampleSessions(): CoachSession[] {
  return [
    {
      id: 'cs1', coachId: 'c-jesse', kind: 'Marathon prep', type: 'running', title: 'Amsterdam Marathon Prep: 12-week squad',
      date: inDays(3), time: '08:00', location: 'Olympic Stadium, main entrance', neighborhood: 'Oud-Zuid',
      price: 40, spots: 30, booked: 22, weeks: 12,
      description: 'Weekly long run with Jesse plus a personal plan in the app. Ends race-ready in October.',
    },
    {
      id: 'cs2', coachId: 'c-jesse', kind: 'Group training', type: 'running', title: 'Long Run Clinic',
      date: inDays(6), time: '09:00', location: 'Vondelpark, Blauwe Theehuis', neighborhood: 'Oud-Zuid',
      price: 15, spots: 20, booked: 9, description: 'Fuelling, pacing and form on an easy 14 km. All paces welcome.',
    },
    {
      id: 'cs3', coachId: 'c-noor', kind: 'Strength for runners', type: 'strength', title: 'Bulletproof Legs',
      date: inDays(2), time: '19:00', location: 'Sarphatipark, north lawn', neighborhood: 'De Pijp',
      price: 12, spots: 14, booked: 10, description: '45 minutes of bodyweight strength. Bring a mat.',
    },
    {
      id: 'cs4', coachId: 'c-ruben', kind: 'Speed & track', type: 'running', title: 'Tuesday Track Night',
      date: inDays(1), time: '19:30', location: 'Middenmeer track', neighborhood: 'Watergraafsmeer',
      price: 10, spots: 25, booked: 18, description: 'Warm-up, drills, then a set built for your 5K or 10K pace.',
    },
    {
      id: 'cs5', coachId: 'c-elif', kind: 'Beginner coaching', type: 'running', title: 'Couch to 5K (6 weeks)',
      date: inDays(4), time: '18:30', location: 'Westergasfabriek, by the fountain', neighborhood: 'Westerpark',
      price: 25, spots: 12, booked: 7, weeks: 6, description: 'Three short runs a week, one with the group. You’ll run 5K by week six.',
    },
  ];
}

export function findCoach(id: string) {
  return COACHES.find((c) => c.id === id);
}
