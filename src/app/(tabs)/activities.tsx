import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { ActivityCard } from '@/components/activity-card';
import { Body, Button, Chip, MenuButton, Screen, Title } from '@/components/ui';
import { ACTIVITIES, type ActivityId } from '@/data/options';
import { activityFit } from '@/lib/matching';
import { useStore } from '@/state/store';
import { space } from '@/theme';

export default function Activities() {
  const { activities, profile } = useStore();
  const [filter, setFilter] = useState<ActivityId | 'all' | 'mine'>('all');

  const list = activities
    .filter((a) =>
      filter === 'all' ? true : filter === 'mine' ? a.participants.includes('me') : a.type === filter,
    )
    .sort((a, b) => {
      if (filter === 'mine') return (a.date + a.time).localeCompare(b.date + b.time);
      return profile ? activityFit(profile, b) - activityFit(profile, a) : 0;
    });

  const types = ACTIVITIES.filter((t) => activities.some((a) => a.type === t.id));

  return (
    <Screen>
      <MenuButton onPress={() => router.push('/menu')} />
      <View style={{ height: space.lg }} />
      <Title sub="Join something this week, or start your own.">My runs</Title>
      <Button title="+ Start a run" onPress={() => router.push('/create-activity')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: space.lg }}>
        <View style={{ flexDirection: 'row', gap: space.sm }}>
          <Chip label="For you" selected={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="My plans" selected={filter === 'mine'} onPress={() => setFilter('mine')} />
          {types.map((t) => (
            <Chip key={t.id} label={`${t.emoji} ${t.label}`} selected={filter === t.id} onPress={() => setFilter(t.id)} />
          ))}
        </View>
      </ScrollView>
      {list.length === 0 ? (
        <Body muted>Nothing here yet. Join an activity or create one and it will show up here.</Body>
      ) : (
        list.map((a) => <ActivityCard key={a.id} activity={a} />)
      )}
    </Screen>
  );
}
