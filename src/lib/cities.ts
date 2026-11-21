import * as Location from 'expo-location';
import { Storage } from 'expo-sqlite/kv-store';
import { Alert } from 'react-native';
import { useSyncExternalStore } from 'react';

import { CITIES, type City } from '@/data/options';

// City-locked Explore (Yana, 2026-11-21). Every city is Live or Locked (admin switch).
// Feed works everywhere; Explore only works in Live cities. Locked cities show a waitlist.
//
// DEMO ONLY: this lives on the phone. Real waitlists, referral counts, the admin switch
// and push notifications need the server (Supabase) so everyone sees the same numbers.

export const WAITLIST_GOAL = 1000;

// Sample numbers so the waitlist bars and leaderboard have life before real sign-ups.
const SAMPLE: Record<City, { users: number; waitlist: number; referrers: { name: string; count: number }[] }> = {
  Amsterdam: { users: 1840, waitlist: 0, referrers: [{ name: 'Sanne', count: 41 }, { name: 'Daan', count: 27 }, { name: 'Amira', count: 19 }] },
  London: { users: 96, waitlist: 742, referrers: [{ name: 'Priya', count: 58 }, { name: 'Jack', count: 33 }, { name: 'Ellie', count: 21 }] },
  'New York': { users: 61, waitlist: 618, referrers: [{ name: 'Maya', count: 49 }, { name: 'Chris', count: 30 }, { name: 'Dani', count: 12 }] },
  Dubai: { users: 44, waitlist: 455, referrers: [{ name: 'Omar', count: 37 }, { name: 'Lina', count: 22 }, { name: 'Sara', count: 9 }] },
  Stockholm: { users: 23, waitlist: 342, referrers: [{ name: 'Elsa', count: 26 }, { name: 'Viktor', count: 14 }, { name: 'Maja', count: 8 }] },
  Oslo: { users: 19, waitlist: 297, referrers: [{ name: 'Ingrid', count: 24 }, { name: 'Jonas', count: 11 }, { name: 'Nora', count: 7 }] },
  'San Francisco': { users: 15, waitlist: 263, referrers: [{ name: 'Alex', count: 18 }, { name: 'Sam', count: 10 }, { name: 'Taylor', count: 6 }] },
  Doha: { users: 12, waitlist: 188, referrers: [{ name: 'Fatima', count: 15 }, { name: 'Khalid', count: 9 }, { name: 'Noor', count: 4 }] },
};

export type CityState = {
  live: Record<string, boolean>; // admin switch; missing = only Amsterdam is live
  waitlist: string[]; // cities this user joined the waitlist for
  invited: Record<string, number>; // demo: friends who signed up with this user's link, by city
};

const KEY = 'mileclub-cities-v1';

function read(): CityState {
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw) return { live: {}, waitlist: [], invited: {}, ...JSON.parse(raw) };
  } catch {}
  return { live: {}, waitlist: [], invited: {} };
}

let state = read();
const listeners = new Set<() => void>();

function save(next: CityState) {
  state = next;
  try {
    Storage.setItemSync(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

// Pass the value from useCities() so screens update when it changes.
export function isLive(city: City | undefined, st: CityState = state) {
  if (!city) return true;
  return st.live[city] ?? city === 'Amsterdam';
}

export function cityStats(city: City, st: CityState = state) {
  const s = SAMPLE[city];
  const joined = st.waitlist.includes(city);
  const mine = st.invited[city] ?? 0;
  return {
    city,
    label: CITIES.find((c) => c.id === city)?.label ?? city,
    live: isLive(city, st),
    users: s.users,
    waitlist: s.waitlist + (joined ? 1 : 0) + mine,
    joined,
    referrers: [...s.referrers, ...(mine ? [{ name: 'You', count: mine }] : [])].sort((a, b) => b.count - a.count),
  };
}

export function allCities(st: CityState = state) {
  return CITIES.map((c) => cityStats(c.id, st)).sort((a, b) => b.waitlist - a.waitlist);
}

export function joinWaitlist(city: City) {
  if (state.waitlist.includes(city)) return;
  save({ ...state, waitlist: [...state.waitlist, city] });
}

// Demo: pretend a friend signed up with the user's link.
export function demoReferral(city: City) {
  save({ ...state, invited: { ...state.invited, [city]: (state.invited[city] ?? 0) + 1 } });
}

// Admin switch. Turning a city on tells everyone on its waitlist (demo: this phone only).
export function setLive(city: City, live: boolean) {
  save({ ...state, live: { ...state.live, [city]: live } });
  if (live && state.waitlist.includes(city)) {
    Alert.alert(`${CITIES.find((c) => c.id === city)?.label ?? city} is live! 🎉`, 'Explore is open. Go find your people.');
  }
}

export function referralLink(name: string | undefined, city: City) {
  const code = `${(name ?? 'friend').toLowerCase().replace(/[^a-z]/g, '').slice(0, 10) || 'friend'}${city.length}${city.charCodeAt(0)}`;
  return `https://mileclub.co/join?ref=${code}&city=${encodeURIComponent(city)}`;
}

export function useCities() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}

// Onboarding: find the user's city from their location. Returns a Mile Club city,
// or the place name if it isn't one of our cities yet.
export async function detectCity(): Promise<{ city?: City; place?: string; denied?: boolean }> {
  try {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return { denied: true };
    const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    if (!pos) return {};
    const [p] = await Location.reverseGeocodeAsync(pos.coords);
    const names = [p?.city, p?.subregion, p?.region].filter(Boolean).map((x) => x!.toLowerCase());
    const hit = CITIES.find((c) => names.some((n) => n.includes(c.id.toLowerCase()) || c.id.toLowerCase().includes(n)));
    return { city: hit?.id, place: p?.city ?? p?.region ?? undefined };
  } catch {
    return {};
  }
}
