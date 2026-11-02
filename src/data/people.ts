import type { Person } from './types';

// Sample Amsterdam members so the app has people to show before launch.
export const PEOPLE: Person[] = [
  {
    id: 'sanne', firstName: 'Sanne', color: '#F4A261', age: 27, neighborhood: 'De Pijp',
    activities: ['running', 'pilates'], level: 'Beginner', pace: '6:30/km', goals: ['Get more active', 'Meet new people'],
    availability: ['Weekday evenings', 'Weekend mornings'], groupSize: 'Small group (3–6)', social: 'Chatty',
    experience: 'Started running 3 months ago',
  },
  {
    id: 'daan', firstName: 'Daan', color: '#2A9D8F', age: 31, neighborhood: 'Oost',
    activities: ['running', 'cycling'], level: 'Intermediate', pace: '5:20/km', goals: ['Train for a race', 'Stay consistent'],
    availability: ['Weekday mornings', 'Weekend mornings'], groupSize: 'Small group (3–6)', social: 'Focused',
    experience: 'Ran the Amsterdam half last year', isCaptain: true, sessionsHosted: 24, rating: 4.9,
  },
  {
    id: 'amira', firstName: 'Amira', color: '#E76F51', age: 28, neighborhood: 'Oud-West',
    activities: ['yoga', 'pilates', 'running'], level: 'Beginner', goals: ['Have fun', 'Meet new people'],
    availability: ['Weekday evenings', 'Weekend afternoons'], groupSize: 'Small group (3–6)', social: 'A bit of both',
    experience: 'New to Amsterdam, moved in August',
  },
  {
    id: 'lucas', firstName: 'Lucas', color: '#264653', age: 22, neighborhood: 'Jordaan',
    activities: ['basketball', 'gym', 'strength'], level: 'Intermediate', goals: ['Get stronger', 'Have fun'],
    availability: ['Weekday evenings', 'Weekend afternoons'], groupSize: 'Bigger group (7+)', social: 'Chatty',
    experience: 'Plays pickup ball twice a week',
  },
  {
    id: 'femke', firstName: 'Femke', color: '#8AB17D', age: 33, neighborhood: 'Westerpark',
    activities: ['running', 'hiking', 'yoga'], level: 'Intermediate', pace: '5:50/km', goals: ['Stay consistent', 'Meet new people'],
    availability: ['Weekday evenings', 'Weekend mornings'], groupSize: 'Small group (3–6)', social: 'A bit of both',
    experience: 'Runs Westerpark loops most weeks', isCaptain: true, sessionsHosted: 11, rating: 4.8,
  },
  {
    id: 'noah', firstName: 'Noah', color: '#6D597A', age: 26, neighborhood: 'Oud-Zuid',
    activities: ['tennis', 'running', 'gym'], level: 'Advanced', pace: '4:45/km', goals: ['Train for a race', 'Get stronger'],
    availability: ['Weekday mornings', 'Weekday lunch'], groupSize: '1-on-1', social: 'Focused',
    experience: '3 marathons, chasing sub-3:15',
  },
  {
    id: 'yasmin', firstName: 'Yasmin', color: '#B56576', age: 24, neighborhood: 'De Baarsjes',
    activities: ['pilates', 'yoga', 'strength'], level: 'Beginner', goals: ['Get stronger', 'Stay consistent'],
    availability: ['Weekday mornings', 'Weekend mornings'], groupSize: 'Small group (3–6)', social: 'Chatty',
    experience: 'Doing reformer pilates since spring',
  },
  {
    id: 'tom', firstName: 'Tom', color: '#355070', age: 34, neighborhood: 'Noord',
    activities: ['cycling', 'hiking', 'running'], level: 'Intermediate', pace: '6:00/km', goals: ['Have fun', 'Get more active'],
    availability: ['Weekend mornings', 'Weekend afternoons'], groupSize: 'Bigger group (7+)', social: 'Chatty',
    experience: 'Weekend cyclist, getting into trail runs',
  },
  {
    id: 'lotte', firstName: 'Lotte', color: '#E9C46A', age: 29, neighborhood: 'Indische Buurt',
    activities: ['running', 'strength'], level: 'Beginner', pace: '7:00/km', goals: ['Get more active', 'Stay consistent'],
    availability: ['Weekday evenings', 'Weekday mornings'], groupSize: 'Small group (3–6)', social: 'A bit of both',
    experience: 'Couch to 5K graduate',
  },
  {
    id: 'mateo', firstName: 'Mateo', color: '#457B9D', age: 27, neighborhood: 'Centrum',
    activities: ['gym', 'basketball', 'tennis'], level: 'Intermediate', goals: ['Meet new people', 'Get stronger'],
    availability: ['Weekday lunch', 'Weekday evenings'], groupSize: 'Small group (3–6)', social: 'Chatty',
    experience: 'Lifting for 4 years', isCaptain: true, sessionsHosted: 7, rating: 4.7,
  },
];

export function findPerson(id: string) {
  return PEOPLE.find((p) => p.id === id);
}

// Demo: sample members who follow the user back. Calls need a mutual follow.
export const FOLLOWS_YOU = ['femke', 'daan', 'sanne', 'lotte'];
