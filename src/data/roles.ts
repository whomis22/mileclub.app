// The two kinds of accounts. Change the names here and they update across the app.
export const ROLES = {
  member: { name: 'Crew', one: 'Crew member', emoji: '🙌', pitch: 'Join runs and workouts, meet people, book coaching.' },
  coach: { name: 'Captain', one: 'Captain', emoji: '⭐', pitch: 'You’re a coach. Host paid sessions and get paid.' },
} as const;

export type Role = keyof typeof ROLES;

// Mile Club keeps 20% of every paid booking, the coach keeps 80%.
export const PLATFORM_FEE = 0.2;

export function split(amount: number) {
  const fee = Math.round(amount * PLATFORM_FEE * 100) / 100;
  return { gross: amount, fee, coach: Math.round((amount - fee) * 100) / 100 };
}

export function euro(n: number) {
  return `€${Number.isInteger(n) ? n : n.toFixed(2)}`;
}
