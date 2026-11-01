import { Redirect } from 'expo-router';

import { useStore } from '@/state/store';
import { useTheme } from '@/theme';

export default function Index() {
  useTheme();
  const { profile } = useStore();
  return <Redirect href={profile ? '/now' : '/welcome'} />;
}
