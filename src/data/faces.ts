// Sample portrait photos and a "what I do" line for the sample members,
// used on the For You cards until people upload their own photos.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=1000&fit=crop&q=70`;

export const FACES: Record<string, { photo: string; work: string }> = {
  sanne: { photo: u('1494790108377-be9c29b29330'), work: 'Product designer · New to running' },
  daan: { photo: u('1500648767791-00dcc994a43e'), work: 'Engineer · Half-marathon runner' },
  amira: { photo: u('1531123897727-8f129e1688ce'), work: 'Founder · Yoga & pilates' },
  lucas: { photo: u('1500048993953-d23a436266cf'), work: 'Student · Cycling & 5-a-side' },
  femke: { photo: u('1438761681033-6461ffad8d80'), work: 'Doctor · Sauna Sundays' },
  noah: { photo: u('1506794778202-cad84cf45f1d'), work: 'Lawyer · Padel after work' },
  yasmin: { photo: u('1488426862026-3ee34a7d66df'), work: 'Content creator · Trying new things' },
  tom: { photo: u('1507003211169-0a1dd7228f2d'), work: 'Chef · Strength & coffee' },
  lotte: { photo: u('1544005313-94ddf0286df2'), work: 'Teacher · Sunset runs' },
  mateo: { photo: u('1539571696357-5a69c17a67c6'), work: 'Musician · Padel & climbing' },
};

export function faceFor(id: string) {
  return FACES[id];
}
