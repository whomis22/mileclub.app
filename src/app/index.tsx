import { Redirect } from 'expo-router';

import { useStore } from '@/state/store';

export default function Index() {
  const { profile } = useStore();
  return <Redirect href={profile ? '/discover' : '/welcome'} />;
}
