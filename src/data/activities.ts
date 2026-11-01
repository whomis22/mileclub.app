import type { Activity } from './types';

function inDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A start time a few hours from now (rounded to 15 min), for last-minute sessions.
function soon(hours: number) {
  const d = new Date(Date.now() + hours * 3600000);
  d.setMinutes(Math.ceil(d.getMinutes() / 15) * 15, 0, 0);
  const pad = (x: number) => String(x).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

// Sample activities, always placed in the coming days so the list never looks stale.
export function sampleActivities(): Activity[] {
  return [
    {
      id: 's1', type: 'running', title: 'Canal Ring 6K', ...soon(1),
      location: 'Westerkerk steps', neighborhood: 'Jordaan', distance: '6 km', pace: '6:00/km',
      level: 'Beginner', groupSize: 8, participants: ['femke', 'tom', 'sanne'], hostId: 'femke', free: true,
      description: 'A quick loop along Prinsengracht and Keizersgracht. Two spots just opened up.',
    },
    {
      id: 's2', type: 'running', title: 'Tempo Tuesday Intervals', ...soon(2),
      location: 'Olympic Stadium track', neighborhood: 'Oud-Zuid', distance: '8 km', pace: '4:50/km',
      level: 'Advanced', groupSize: 10, participants: ['noah', 'daan', 'lucas'], hostId: 'noah', free: true,
      description: '6 x 800m with 90s rest. Warm-up jog from the stadium together.',
    },
    {
      id: 's3', type: 'yoga', title: 'Rooftop Stretch & Breathe', ...soon(3),
      location: 'NDSM Wharf, rooftop terrace', neighborhood: 'Noord', level: 'Beginner', groupSize: 12,
      participants: ['amira', 'yasmin'], hostId: 'amira', free: true,
      description: '40 minutes of easy stretching with a view over the IJ. Perfect after work.',
    },
    {
      id: 's4', type: 'cycling', title: 'Amstel Spin', ...soon(4),
      location: 'Amstelpark, main gate', neighborhood: 'Zuidas', distance: '25 km', level: 'Intermediate',
      groupSize: 6, participants: ['tom'], hostId: 'tom', free: true,
      description: 'Easy ride south along the Amstel to Ouderkerk and back. Lights on bikes please.',
    },
    {
      id: 's5', type: 'running', title: 'Oosterpark Social 5K', ...soon(5),
      location: 'Oosterpark, by the pond', neighborhood: 'Oost', distance: '5 km', pace: '6:45/km',
      level: 'Beginner', groupSize: 12, participants: ['lotte', 'amira', 'sanne', 'daan'], hostId: 'lotte', free: true,
      description: 'Chatty pace, two laps. Drinks at the park café after.',
    },
    {
      id: 'a1', type: 'running', title: 'Vondelpark Easy 5K', date: inDays(1), time: '18:30',
      location: 'Vondelpark, main entrance (Stadhouderskade)', neighborhood: 'Oud-Zuid', distance: '5 km', pace: '6:30/km',
      level: 'Beginner', groupSize: 8, participants: ['sanne', 'amira', 'lotte', 'femke', 'daan'], hostId: 'daan', free: true,
      description: 'Relaxed conversational pace, nobody gets left behind. Coffee after for whoever wants.',
      recurring: 'Every Thursday',
    },
    {
      id: 'a2', type: 'running', title: 'Westerpark Sunrise Loop', date: inDays(2), time: '07:30',
      location: 'Westergasfabriek, by the fountain', neighborhood: 'Westerpark', distance: '7 km', pace: '5:50/km',
      level: 'Intermediate', groupSize: 10, participants: ['femke', 'tom', 'daan'], hostId: 'femke', free: true,
      description: 'Two loops of the park and along the canal. Steady pace, good chat.',
    },
    {
      id: 'a3', type: 'pilates', title: 'Mat Pilates in the Park', date: inDays(3), time: '10:00',
      location: 'Sarphatipark, south lawn', neighborhood: 'De Pijp', level: 'Beginner', groupSize: 12,
      participants: ['yasmin', 'sanne', 'amira'], hostId: 'yasmin', free: true,
      description: 'Bring a mat and water. 45 minutes of beginner-friendly mat pilates.',
    },
    {
      id: 'a4', type: 'basketball', title: 'Pickup Basketball', date: inDays(2), time: '19:00',
      location: 'Museumplein courts', neighborhood: 'Oud-Zuid', level: 'Intermediate', groupSize: 10,
      participants: ['lucas', 'mateo', 'tom', 'noah'], hostId: 'lucas', free: true,
      description: 'Friendly 5v5 runs. All genders welcome, we rotate teams every game.',
    },
    {
      id: 'a5', type: 'strength', title: 'Beginner Strength Session', date: inDays(4), time: '12:15',
      location: 'Partner gym, Zuidas', neighborhood: 'Zuidas', level: 'Beginner', groupSize: 6,
      participants: ['mateo', 'lotte'], hostId: 'mateo', free: false, partner: 'Partner gym (free first visit)',
      description: 'Learn the basic lifts with a small group. Mateo will show you good form.',
    },
    {
      id: 'a6', type: 'running', title: 'Amstel Long Run', date: inDays(5), time: '08:00',
      location: 'Amstel, by Magere Brug', neighborhood: 'Centrum', distance: '15 km', pace: '5:15/km',
      level: 'Advanced', groupSize: 6, participants: ['noah', 'daan'], hostId: 'daan', free: true,
      description: 'Out-and-back along the Amstel. Training for spring races.',
    },
    {
      id: 'a7', type: 'cycling', title: 'Noord Countryside Ride', date: inDays(6), time: '09:30',
      location: 'Noorderpark ferry exit', neighborhood: 'Noord', distance: '40 km', level: 'Intermediate',
      groupSize: 8, participants: ['tom'], hostId: 'tom', free: true,
      description: 'Out to Durgerdam and Marken past the dikes. Stop for apple pie.',
    },
    {
      id: 'a8', type: 'yoga', title: 'Sunset Yoga Flow', date: inDays(1), time: '19:30',
      location: 'Oosterpark, by the pond', neighborhood: 'Oost', level: 'Beginner', groupSize: 15,
      participants: ['amira', 'femke', 'yasmin', 'sanne'], hostId: 'amira', free: true,
      description: 'Gentle 60-minute flow outdoors. Mats available if you forget yours.',
    },
  ];
}
