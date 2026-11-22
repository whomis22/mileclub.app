import { cityOf, type City } from '@/data/options';
import type { Profile } from '@/data/types';

// Premium price by home city, in its own currency (Yana, 2026-11-22):
// UK £10.99, US $14.99. The rest are Claude's picks for Yana to adjust.
// Yearly = 10 months' price (save about 17%).
const PRICES: Record<City, { month: string; year: string }> = {
  London: { month: '£10.99', year: '£109.99' },
  'New York': { month: '$14.99', year: '$149.99' },
  'San Francisco': { month: '$14.99', year: '$149.99' },
  Amsterdam: { month: '€12.99', year: '€129.99' },
  Oslo: { month: '149 kr', year: '1 490 kr' },
  Stockholm: { month: '149 kr', year: '1 490 kr' },
  Dubai: { month: 'AED 54.99', year: 'AED 549.99' },
  Doha: { month: 'QAR 54.99', year: 'QAR 549.99' },
};
const DEFAULT = { month: '$14.99', year: '$149.99' };

export function pricesFor(profile: Profile | null | undefined) {
  const city = profile ? profile.city ?? cityOf(profile.neighborhood) : undefined;
  return (city && PRICES[city]) || DEFAULT;
}
