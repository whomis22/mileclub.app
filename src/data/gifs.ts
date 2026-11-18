// GIFs for comments. Mile Club's own animated GIFs ship with the app; GIPHY search
// switches on once a free GIPHY key is added as EXPO_PUBLIC_GIPHY_KEY.
export const LOCAL_GIFS = {
  'lets-go': require('../../assets/gifs/lets-go.gif'),
  'im-in': require('../../assets/gifs/im-in.gif'),
  'new-pb': require('../../assets/gifs/new-pb.gif'),
  kudos: require('../../assets/gifs/kudos.gif'),
  'so-proud': require('../../assets/gifs/so-proud.gif'),
  wow: require('../../assets/gifs/wow.gif'),
  haha: require('../../assets/gifs/haha.gif'),
  'see-you': require('../../assets/gifs/see-you.gif'),
  'same-time': require('../../assets/gifs/same-time.gif'),
  sweaty: require('../../assets/gifs/sweaty.gif'),
  coffee: require('../../assets/gifs/coffee.gif'),
  'no-excuses': require('../../assets/gifs/no-excuses.gif'),
} as const;

export const GIPHY_KEY = process.env.EXPO_PUBLIC_GIPHY_KEY ?? '';

// A comment's gif is either one of ours (by name) or a GIPHY link.
export function gifSource(gif: string) {
  return gif.startsWith('http') ? { uri: gif } : LOCAL_GIFS[gif as keyof typeof LOCAL_GIFS];
}

export type GifResult = { id: string; preview: string; url: string };

export async function searchGiphy(q: string): Promise<GifResult[]> {
  if (!GIPHY_KEY) return [];
  const base = q.trim()
    ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(q.trim())}&`
    : 'https://api.giphy.com/v1/gifs/trending?';
  const res = await fetch(`${base}api_key=${GIPHY_KEY}&limit=24&rating=pg-13`);
  const json = await res.json();
  return (json.data ?? []).map((g: { id: string; images: Record<string, { url: string }> }) => ({
    id: g.id,
    preview: g.images.fixed_height_small?.url ?? g.images.fixed_height?.url,
    url: g.images.fixed_height?.url,
  }));
}
