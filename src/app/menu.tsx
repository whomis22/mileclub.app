import { router, type Href } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space } from '@/theme';

// Side menu: every page plus settings. Opens from the menu button at the top left.
export default function Menu() {
  const insets = useSafeAreaInsets();
  const { profile, reset } = useStore();

  const go = (href: Href) => {
    router.back();
    setTimeout(() => router.push(href), 50);
  };

  const pages: { label: string; href: Href }[] = [
    { label: 'Home', href: '/now' },
    { label: 'Explore', href: '/feed' },
    { label: 'Messages', href: '/messages' },
    { label: 'My runs', href: '/activities' },
    { label: 'Coaches', href: '/train' },
    { label: 'People near you', href: '/people' },
  ];
  const settings: { label: string; onPress: () => void }[] = [
    { label: 'Account', onPress: () => go('/profile') },
    { label: 'Notifications', onPress: () => soon('Notifications') },
    { label: 'Privacy and safety', onPress: () => soon('Privacy and safety') },
    { label: 'Payments', onPress: () => soon('Payments') },
    { label: 'Help', onPress: () => soon('Help') },
  ];

  function soon(what: string) {
    Alert.alert(what, 'This page is coming soon.');
  }

  return (
    <View style={styles.root}>
      <View style={[styles.panel, { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }]}>
        <ScrollView>
          {profile ? (
            <Pressable style={styles.me} onPress={() => go('/profile')}>
              <Avatar name={profile.firstName} uri={profile.photoUri} size={52} />
              <View>
                <Text style={styles.meName}>{profile.firstName}</Text>
                <Text style={styles.meLink}>View profile</Text>
              </View>
            </Pressable>
          ) : null}
          {pages.map((p) => (
            <Pressable key={p.label} style={({ pressed }) => [styles.item, pressed && styles.itemOn]} onPress={() => go(p.href)}>
              <Text style={styles.itemText}>{p.label}</Text>
            </Pressable>
          ))}
          <View style={styles.divider} />
          <Text style={styles.section}>SETTINGS</Text>
          {settings.map((s) => (
            <Pressable key={s.label} style={({ pressed }) => [styles.item, pressed && styles.itemOn]} onPress={s.onPress}>
              <Text style={styles.small}>{s.label}</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.item}
            onPress={() =>
              Alert.alert('Log out?', 'This clears your profile and plans on this phone.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Log out',
                  style: 'destructive',
                  onPress: () => {
                    reset();
                    router.dismissAll();
                    router.replace('/welcome');
                  },
                },
              ])
            }>
            <Text style={[styles.small, { color: colors.danger, fontFamily: fonts.sansSemi }]}>Log out</Text>
          </Pressable>
        </ScrollView>
      </View>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} accessibilityLabel="Close menu" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(38,42,28,0.55)' },
  panel: { width: '80%', maxWidth: 320, backgroundColor: colors.bg, borderTopRightRadius: 32, borderBottomRightRadius: 32, paddingHorizontal: space.lg },
  me: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingBottom: space.lg, paddingHorizontal: space.xs },
  meName: { fontFamily: fonts.serif, fontSize: 24, color: colors.ink },
  meLink: { fontFamily: fonts.sansSemi, fontSize: 12, color: colors.olive },
  item: { height: 46, borderRadius: radius.pill, justifyContent: 'center', paddingHorizontal: space.md },
  itemOn: { backgroundColor: colors.oliveSoft },
  itemText: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.ink },
  small: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: space.md, marginHorizontal: space.md },
  section: { fontFamily: fonts.sansSemi, fontSize: 10, letterSpacing: 2, color: colors.muted, paddingHorizontal: space.md, marginBottom: space.xs },
});
