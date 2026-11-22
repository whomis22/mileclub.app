import { cityOf, type City } from '@/data/options';
import type { Profile } from '@/data/types';

// Premium price by home city, in its own currency: about £10.99 a month everywhere
// (prices approved by Yana, 2026-11-22). Yearly = 10 months' price (save about 17%).
const PRICES: Record<City, { month: string; year: string }> = {
  Manchester: { month: '£10.99', year: '£109.99' },
  London: { month: '£10.99', year: '£109.99' },
  'New York': { month: '$13.99', year: '$139.99' },
  'San Francisco': { month: '$13.99', year: '$139.99' },
  'Los Angeles': { month: '$13.99', year: '$139.99' },
  Amsterdam: { month: '€12.99', year: '€129.99' },
  Oslo: { month: '149 kr', year: '1 490 kr' },
  Vancouver: { month: 'CA$19.99', year: 'CA$199.99' },
  Toronto: { month: 'CA$19.99', year: 'CA$199.99' },
  Melbourne: { month: 'A$21.99', year: 'A$219.99' },
};
const DEFAULT = { month: '£10.99', year: '£109.99' };

export function pricesFor(profile: Profile | null | undefined) {
  const city = profile ? profile.city ?? cityOf(profile.neighborhood) : undefined;
  return (city && PRICES[city]) || DEFAULT;
}

// How much paying yearly saves compared with 12 monthly payments, in the same currency,
// e.g. '£21.89' (Yana, 2026-11-22: yearly gets a discount, monthly pays full price).
export function yearlySaving(pr: { month: string; year: string }) {
  const num = (x: string) => Number(x.replace(/[^0-9.]/g, ''));
  const saved = num(pr.month) * 12 - num(pr.year);
  const whole = Number.isInteger(num(pr.month));
  const amount = whole ? String(Math.round(saved)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : saved.toFixed(2);
  return pr.month.replace(/[0-9][0-9 .]*[0-9]/, amount);
}
