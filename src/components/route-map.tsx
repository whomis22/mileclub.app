import { StyleSheet, Text, View } from 'react-native';

import type { LatLng } from '@/lib/route';

// Web fallback: the real map only runs on phones.
export function RouteMap({ dest }: { from: LatLng | null; dest: LatLng; path: LatLng[] }) {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#DCE3CF', alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ color: '#3A4A1F' }}>
        Map shows on your phone · {dest.latitude.toFixed(4)}, {dest.longitude.toFixed(4)}
      </Text>
    </View>
  );
}
