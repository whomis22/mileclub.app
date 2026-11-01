import type { Role } from './roles';
import type {
  ActivityId,
  Goal,
  GroupSize,
  Level,
  Neighborhood,
  Slot,
  Social,
} from './options';

export type Profile = {
  role?: Role; // missing means 'member' (profiles made before roles existed)
  coachHeadline?: string;
  coachBio?: string;
  firstName: string;
  age: number;
  neighborhood: Neighborhood;
  activities: ActivityId[];
  level: Level;
  pace?: string;
  goals: Goal[];
  availability: Slot[];
  groupSize: GroupSize;
  social: Social;
  emergencyContact?: string;
  photoUri?: string;
};

export type Person = Profile & {
  id: string;
  color: string;
  experience: string;
  isCaptain?: boolean;
  sessionsHosted?: number;
  rating?: number;
};

export type Activity = {
  id: string;
  type: ActivityId;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  neighborhood: Neighborhood;
  distance?: string;
  pace?: string;
  level: Level;
  groupSize: number;
  participants: string[]; // person ids ("me" for the user)
  hostId: string;
  free: boolean;
  description: string;
  partner?: string;
  recurring?: string;
};
