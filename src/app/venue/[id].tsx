import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, fonts, radius, space, themed, useTheme } from '@/theme';

// Partner gym / venue page (design board, 2026-11-21). Sample venues only for now.
const un = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=700&fit=crop&q=70`;
const PHOTO: Record<string, string | number> = {
  gym: un('1534438327276-14e5300c3a48'),
  studio: un('1544367567-0f2fcb009e0b'),
  padel: require('../../../assets/images/photos/padel.jpg'),
  run: require('../../../assets/images/photos/run-london.jpg'),
  pool: un('1530549387789-4c1017266635'),
  class: un('1599058917212-d750089bc07e'),
};

const AMENITIES: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }[]> = {
  gym: [{ icon: 'activity', label: 'Free weights' }, { icon: 'thermometer', label: 'Sauna' }, { icon: 'lock', label: 'Lockers' }, { icon: 'droplet', label: 'Showers' }],
  studio: [{ icon: 'sun', label: 'Mats provided' }, { icon: 'users', label: 'Small groups' }, { icon: 'droplet', label: 'Showers' }, { icon: 'coffee', label: 'Tea bar' }],
  padel: [{ icon: 'target', label: 'Racket hire' }, { icon: 'umbrella', label: 'Covered courts' }, { icon: 'coffee', label: 'Bar' }, { icon: 'lock', label: 'Lockers' }],
  run: [{ icon: 'wind', label: 'All paces' }, { icon: 'coffee', label: 'Coffee after' }, { icon: 'map', label: 'Set routes' }, { icon: 'users', label: 'Friendly crew' }],
  pool: [{ icon: 'droplet', label: 'Lane swimming' }, { icon: 'thermometer', label: 'Heated' }, { icon: 'lock', label: 'Lockers' }, { icon: 'sun', label: 'Sun deck' }],
  class: [{ icon: 'zap', label: 'All levels' }, { icon: 'music', label: 'Live DJ' }, { icon: 'droplet', label: 'Showers' }, { icon: 'lock', label: 'Lockers' }],
};

const SLOTS = ['07:00', '09:30', '12:00', '17:30', '18:30', '20:00'];
const REVIEWS = [
  { name: 'Sanne', stars: 5, text: 'Great vibe and really friendly staff. Went with someone I met on Mile Club!' },
  { name: 'Daan', stars: 5, text: 'Clean, never too busy in the evening.' },
  { name: 'Amira', stars: 4, text: 'Love it, just wish it was open a bit later on Sundays.' },
];

export default function Venue() {
  useTheme();
  const insets = useSafeAreaInsets();
  const q = useLocalSearchParams<{ id: string; name?: string; detail?: string; open?: string; price?: string; kind?: string; rating?: string }>();
  const kind = q.kind && PHOTO[q.kind] ? q.kind : 'gym';
  const [show, setShow] = useState<'none' | 'slots' | 'reviews'>('none');
  const [slot, setSlot] = useState<string | null>(null);
  const photo = PHOTO[kind]!;
  const seed = (q.name ?? 'x').length;
  const reviews = 120 + seed * 23;
  const km = (0.4 + (seed % 9) * 0.2).toFixed(1);

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xl }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Image source={typeof photo === 'string' ? { uri: photo } : photo} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent']} locations={[0, 0.4]} style={StyleSheet.absoluteFill} />
          <Pressable style={[styles.back, { top: insets.top + 8 }]} onPress={() => router.back()} accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{q.name ?? 'Partner gym'}</Text>
            <Ionicons name="star" size={20} color={colors.purple} />
          </View>
          <Text style={styles.rating}>
            <Text style={{ color: '#F5B301' }}>★ </Text>
            <Text style={styles.ratingNum}>{q.rating ?? '4.8'}</Text> ({reviews} reviews)
          </Text>
          <View style={styles.facts}>
            <Feather name="clock" size={13} color={colors.muted} />
            <Text style={styles.fact}>{q.open ?? 'Open today'}</Text>
            {q.price ? <Text style={styles.fact}>· {q.price}</Text> : null}
            <Feather name="map-pin" size={13} color={colors.muted} style={{ marginLeft: 6 }} />
            <Text style={styles.fact}>{km} km</Text>
          </View>
          <Text style={styles.detail}>{q.detail}. A Mile Club partner: members get 10% off.</Text>

          <View style={styles.amenities}>
            {(AMENITIES[kind] ?? AMENITIES.gym!).map((a) => (
              <View key={a.label} style={styles.amenity}>
                <View style={styles.amenityIcon}>
                  <Feather name={a.icon} size={18} color={colors.ink} />
                </View>
                <Text style={styles.amenityText}>{a.label}</Text>
              </View>
            ))}
          </View>

          <Button title="View Availability" variant="alt" onPress={() => setShow(show === 'slots' ? 'none' : 'slots')} />
          {show === 'slots' ? (
            <View style={styles.slots}>
              {SLOTS.map((t) => (
                <Pressable key={t} style={[styles.slot, slot === t && styles.slotOn]} onPress={() => setSlot(t)}>
                  <Text style={[styles.slotText, slot === t && { color: colors.onCta }]}>Today {t}</Text>
                </Pressable>
              ))}
              {slot ? (
                <Button
                  title={`Book ${slot}`}
                  style={{ width: '100%', marginTop: space.sm }}
                  onPress={() => Alert.alert('Booked (demo)', `${q.name} at ${slot}. Nothing is charged yet.`)}
                />
              ) : null}
            </View>
          ) : null}

          <View style={{ height: space.sm }} />
          <Button title="See Reviews" variant="soft" onPress={() => setShow(show === 'reviews' ? 'none' : 'reviews')} />
          {show === 'reviews'
            ? REVIEWS.map((r) => (
                <View key={r.name} style={styles.review}>
                  <Text style={styles.reviewName}>{r.name} <Text style={styles.stars}>{'★'.repeat(r.stars)}</Text></Text>
                  <Text style={styles.reviewText}>{r.text}</Text>
                </View>
              ))
            : null}

          <Pressable style={styles.buddy} onPress={() => router.push('/create-activity' as Href)}>
            <Feather name="users" size={18} color={colors.ink} />
            <Text style={styles.buddyText}>Find someone to go with</Text>
            <Feather name="chevron-right" size={18} color={colors.muted} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = themed(() => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { height: 280 },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  heroText: { padding: space.lg },
  partner: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#B9E769', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8 },
  partnerText: { fontFamily: fonts.sansSemi, fontSize: 12, color: '#000' },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.ink, flex: 1 },
  rating: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 6 },
  ratingNum: { fontFamily: fonts.sansBold, color: colors.ink },
  facts: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8, marginBottom: 12 },
  fact: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },
  body: { padding: space.lg },
  detail: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, color: colors.muted },
  price: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.link, marginTop: 6 },
  amenities: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: space.xl },
  amenity: { alignItems: 'center', width: '24%' },
  amenityIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  amenityText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.muted, marginTop: 6, textAlign: 'center' },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: space.md },
  slot: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  slotOn: { backgroundColor: colors.cta },
  slotText: { fontFamily: fonts.sansSemi, fontSize: 13, color: colors.ink },
  review: { backgroundColor: colors.card, borderRadius: 18, padding: space.md, marginTop: space.sm },
  reviewName: { fontFamily: fonts.sansSemi, fontSize: 14, color: colors.ink },
  stars: { color: colors.link },
  reviewText: { fontFamily: fonts.sans, fontSize: 14, color: colors.muted, marginTop: 4 },
  buddy: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.card, borderRadius: 18, padding: space.md, marginTop: space.xl },
  buddyText: { flex: 1, fontFamily: fonts.sansSemi, fontSize: 15, color: colors.ink },
}));
