import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import type { LatLng } from '@/lib/route';

// The map on the directions screen: you, the pin, and the walking route between.
export function RouteMap({ from, dest, path }: { from: LatLng | null; dest: LatLng; path: LatLng[] }) {
  const map = useRef<MapView>(null);
  useEffect(() => {
    const pts = path.length ? path : from ? [from, dest] : [dest];
    if (pts.length > 1) {
      map.current?.fitToCoordinates(pts, { edgePadding: { top: 80, right: 60, bottom: 80, left: 60 }, animated: true });
    }
  }, [from, dest, path]);
  return (
    <MapView
      ref={map}
      style={StyleSheet.absoluteFill}
      showsUserLocation
      initialRegion={{ ...dest, latitudeDelta: 0.03, longitudeDelta: 0.03 }}>
      <Marker coordinate={dest} pinColor="#E8956F" />
      {path.length > 1 ? <Polyline coordinates={path} strokeColor="#556B2F" strokeWidth={5} /> : null}
    </MapView>
  );
}
