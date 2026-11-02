export type LatLng = { latitude: number; longitude: number };
export type Step = { text: string; meters: number };
export type Route = { path: LatLng[]; meters: number; seconds: number; steps: Step[] };

// Straight-line distance in metres.
export function metersBetween(a: LatLng, b: LatLng) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.asin(Math.sqrt(h));
}

type OsrmStep = { distance: number; name: string; maneuver: { type: string; modifier?: string } };

function stepText(s: OsrmStep) {
  const road = s.name ? ` onto ${s.name}` : '';
  const m = s.maneuver;
  if (m.type === 'depart') return `Head off${s.name ? ` on ${s.name}` : ''}`;
  if (m.type === 'arrive') return 'You’ve arrived 📍';
  if (m.modifier === 'left' || m.modifier === 'sharp left') return `Turn left${road}`;
  if (m.modifier === 'right' || m.modifier === 'sharp right') return `Turn right${road}`;
  if (m.modifier === 'slight left') return `Bear left${road}`;
  if (m.modifier === 'slight right') return `Bear right${road}`;
  if (m.modifier === 'uturn') return 'Turn around';
  return `Continue${s.name ? ` on ${s.name}` : ''}`;
}

// Walking route from OpenStreetMap's free routing service (demo; a paid maps
// provider would replace this at launch). Falls back to a straight line.
export async function walkingRoute(from: LatLng, to: LatLng): Promise<Route> {
  try {
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const json = await res.json();
    const r = json.routes?.[0];
    if (!r) throw new Error('no route');
    const steps: Step[] = (r.legs?.[0]?.steps ?? []).map((s: OsrmStep) => ({ text: stepText(s), meters: Math.round(s.distance) }));
    return {
      path: r.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })),
      meters: r.distance,
      seconds: r.distance / 1.35, // walking pace, about 5 km/h
      steps,
    };
  } catch {
    const meters = metersBetween(from, to);
    return { path: [from, to], meters, seconds: meters / 1.35, steps: [{ text: 'Head towards the pin', meters: Math.round(meters) }] };
  }
}

export function formatMeters(m: number) {
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}
