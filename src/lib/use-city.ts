import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

// The city you're in right now, shown at the top of Home (Yana, 2026-11-21).
// Only after you allow location: until then it's null and Home shows "Turn on location".
let cached: string | null = null;

async function lookUp(): Promise<string | null> {
  const pos = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
  if (!pos) return null;
  const [place] = await Location.reverseGeocodeAsync(pos.coords);
  return place?.city ?? place?.subregion ?? place?.region ?? null;
}

export function useCity() {
  const [city, setCity] = useState<string | null>(cached);
  const [allowed, setAllowed] = useState<boolean | null>(cached ? true : null);

  useEffect(() => {
    if (cached) return;
    let live = true;
    Location.getForegroundPermissionsAsync()
      .then(async (p) => {
        if (!live) return;
        setAllowed(p.granted);
        if (!p.granted) return;
        const c = await lookUp();
        if (live && c) setCity((cached = c));
      })
      .catch(() => setAllowed(false));
    return () => {
      live = false;
    };
  }, []);

  async function ask() {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      setAllowed(p.granted);
      if (!p.granted) return;
      const c = await lookUp();
      if (c) setCity((cached = c));
    } catch {}
  }

  return { city, allowed, ask };
}
