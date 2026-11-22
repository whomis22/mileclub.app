import { cityOf, type City } from '@/data/options';
import type { Profile } from '@/data/types';

// Premium price by home city, in its own currency (Yana, 2026-11-22):
// UK £10.99, US $14.99 (2026-11-22 city list: Manchester, London, New York, Amsterdam, San Francisco, Vancouver, Oslo, Los Angeles). The rest are Claude's picks for Yana to adjust.
// Yearly = 10 months' price (save about 17%).
const PRICES: Record<City, { month: string; year: string }> = {
  Manchester: { month: '£10.99', year: '£109.99' },
  London: { month: '£10.99', year: '£109.99' },
  'Los Angeles': { month: '$14.99', year: '$149.99' },
  Vancouver: { month: 'CA$19.99', year: 'CA$199.99' },
  'New York': { month: '$14.99', year: '$149.99' },
  'San Francisco': { month: '$14.99', year: '$149.99' },
  Amsterdam: { month: '€12.99', year: '€129.99' },
  Oslo: { month: '149 kr', year: '1 490 kr' },
};
const DEFAULT = { month: '$14.99', year: '$149.99' };

export function pricesFor(profile: Profile | null | undefined) {
  const city = profile ? profile.city ?? cityOf(profile.neighborhood) : undefined;
  return (city && PRICES[city]) || DEFAULT;
}
