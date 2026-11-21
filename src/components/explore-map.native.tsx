import Feather from '@expo/vector-icons/Feather';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { KINDS, type LatLng, type Place } from '@/data/places';
import { getThemeMode, useTheme } from '@/theme';

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0f1d1b' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8fa39b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#050d0c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1b2c29' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#081513' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

// The Explore map: you in the middle, a forest pin with a lime icon for every place.
export function ExploreMap({ centre, places, selected, onSelect }: { centre: LatLng; places: Place[]; selected?: string; onSelect: (p: Place) => void }) {
  useTheme();
  const map = useRef<MapView>(null);
  const sel = places.find((p) => p.id === selected);
  useEffect(() => {
    if (sel) map.current?.animateToRegion({ ...sel.at, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 350);
  }, [sel]);
  useEffect(() => {
    map.current?.animateToRegion({ ...centre, latitudeDelta: 0.055, longitudeDelta: 0.055 }, 350);
  }, [centre]);
  const dark = getThemeMode() === 'dark';
  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      showsUserLocation
      userInterfaceStyle={dark ? 'dark' : 'light'}
      customMapStyle={dark ? DARK_STYLE : []}
      initialRegion={{ ...centre, latitudeDelta: 0.055, longitudeDelta: 0.055 }}>
      {places.map((p) => {
        const on = p.id === selected;
        return (
          <Marker key={p.id} coordinate={p.at} onPress={() => onSelect(p)} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={[s.pin, on && s.pinOn]}>
              <Feather name={KINDS.find((k) => k.id === p.kind)!.icon} size={on ? 16 : 13} color={on ? '#102A27' : '#B9E769'} />
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const s = StyleSheet.create({
  pin: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#102A27', borderWidth: 2, borderColor: '#B9E769', alignItems: 'center', justifyContent: 'center' },
  pinOn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#B9E769', borderColor: '#102A27' },
});
