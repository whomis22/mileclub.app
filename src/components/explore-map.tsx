import Feather from '@expo/vector-icons/Feather';
import { Pressable, StyleSheet, View } from 'react-native';

import { KINDS, type LatLng, type Place } from '@/data/places';
import { getThemeMode, useTheme } from '@/theme';

// Web preview: a drawn map with the same pins (the real map runs on phones).
export function ExploreMap({ centre, places, selected, onSelect }: { centre: LatLng; places: Place[]; selected?: string; onSelect: (p: Place) => void }) {
  useTheme();
  const dark = getThemeMode() === 'dark';
  const span = 0.03;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? '#0F1D1B' : '#E7ECE3', overflow: 'hidden' }]}>
      {[18, 42, 66, 84].map((t, i) => (
        <View key={'h' + i} style={{ position: 'absolute', left: 0, right: 0, top: `${t}%`, height: i % 2 ? 6 : 3, backgroundColor: dark ? '#1B2C29' : '#FFFFFF' }} />
      ))}
      {[12, 37, 58, 80].map((l, i) => (
        <View key={'v' + i} style={{ position: 'absolute', top: 0, bottom: 0, left: `${l}%`, width: i % 2 ? 3 : 6, backgroundColor: dark ? '#1B2C29' : '#FFFFFF', transform: [{ rotate: '8deg' }] }} />
      ))}
      <View style={{ position: 'absolute', left: '62%', top: '48%', width: 120, height: 70, borderRadius: 40, backgroundColor: dark ? '#0A2420' : '#CFE6C0' }} />
      <View style={{ position: 'absolute', left: '50%', top: '50%', width: 16, height: 16, marginLeft: -8, marginTop: -8, borderRadius: 8, backgroundColor: '#3B82F6', borderWidth: 3, borderColor: '#fff' }} />
      {places.map((p) => {
        const x = 50 + ((p.at.longitude - centre.longitude) / span) * 50;
        const y = 50 - ((p.at.latitude - centre.latitude) / span) * 50 * 1.4;
        if (x < 3 || x > 97 || y < 3 || y > 97) return null;
        const on = p.id === selected;
        return (
          <Pressable key={p.id} onPress={() => onSelect(p)} style={[s.pin, on && s.pinOn, { left: `${x}%`, top: `${y}%` }]}>
            <Feather name={KINDS.find((k) => k.id === p.kind)!.icon} size={on ? 16 : 13} color={on ? '#102A27' : '#B9E769'} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  pin: { position: 'absolute', marginLeft: -15, marginTop: -15, width: 30, height: 30, borderRadius: 15, backgroundColor: '#102A27', borderWidth: 2, borderColor: '#B9E769', alignItems: 'center', justifyContent: 'center' },
  pinOn: { marginLeft: -20, marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: '#B9E769', borderColor: '#102A27' },
});
