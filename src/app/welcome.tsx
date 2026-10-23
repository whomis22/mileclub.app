import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors, space } from '@/theme';

export default function Welcome() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.top}>
        <Text style={styles.brand}>MILE CLUB</Text>
        <Text style={styles.city}>AMSTERDAM</Text>
      </View>
      <View>
        <Text style={styles.hero}>Find your people.{'\n'}Get moving.</Text>
        <Text style={styles.sub}>
          Meet people near you who run, lift, stretch and play at your level, then go do it together.
        </Text>
        <Button title="GET STARTED" variant="secondary" onPress={() => router.push('/onboarding')} />
        <Text style={styles.fine}>Takes about a minute. No feed, no followers, just people to move with.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, padding: space.xl, justifyContent: 'space-between' },
  top: { marginTop: space.xl },
  brand: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  city: { color: colors.accent, fontSize: 13, fontWeight: '800', letterSpacing: 3, marginTop: 4 },
  hero: { color: '#fff', fontSize: 46, fontWeight: '900', letterSpacing: -1, lineHeight: 50 },
  sub: { color: '#BDB8AE', fontSize: 17, lineHeight: 24, marginTop: space.lg, marginBottom: space.xxl },
  fine: { color: '#8A857C', fontSize: 13, textAlign: 'center', marginTop: space.md, marginBottom: space.md },
});
