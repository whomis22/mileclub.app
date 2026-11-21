import { Storage } from 'expo-sqlite/kv-store';
import { useState } from 'react';

// Free swipes per day, plus pretend Premium (Yana, 2026-11-15). Saved on the
// phone only: real limits and payments need the server and a payment provider.
export const FREE_PER_DAY = 10;
const KEY = 'mileclub-swipes-v1';

type SwipeState = { day: string; used: number; bonus: number; plus: boolean };

const today = () => new Date().toDateString();

// Premium right now, read fresh (e.g. after coming back from the Premium page).
export function hasPremium() {
  return read().plus;
}

function read(): SwipeState {
  try {
    const raw = Storage.getItemSync(KEY);
    if (raw) {
      const s = JSON.parse(raw) as SwipeState;
      // A new day resets the free swipes (Premium stays).
      return s.day === today() ? s : { ...s, day: today(), used: 0, bonus: 0 };
    }
  } catch {}
  return { day: today(), used: 0, bonus: 0, plus: false };
}

export function useSwipes() {
  const [s, setS] = useState<SwipeState>(read);
  const save = (next: SwipeState) => {
    setS(next);
    try {
      Storage.setItemSync(KEY, JSON.stringify(next));
    } catch {}
  };
  const limit = FREE_PER_DAY + s.bonus;
  const left = s.plus ? Infinity : Math.max(0, limit - s.used);
  return {
    plus: s.plus,
    left,
    limit,
    outOfSwipes: !s.plus && left <= 0,
    use: () => save({ ...read(), used: read().used + 1 }),
    addBonus: (n: number) => save({ ...read(), bonus: read().bonus + n }),
    buyPlus: () => save({ ...read(), plus: true }),
  };
}

// Time until midnight, when free swipes come back. e.g. "7h 12m".
export function untilReset() {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  const mins = Math.max(1, Math.round((mid.getTime() - now.getTime()) / 60000));
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
