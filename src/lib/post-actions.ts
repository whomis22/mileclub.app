import { router, type Href } from 'expo-router';
import { Alert } from 'react-native';

import type { MyPost } from '@/state/store';

// The ••• menu on your own posts: edit, archive (hide, kept on your profile) or delete.
export function openPostActions(
  post: MyPost,
  actions: { archivePost: (id: string, archived: boolean) => void; deletePost: (id: string) => void },
) {
  Alert.alert('Your post', undefined, [
    { text: 'Edit', onPress: () => router.push(`/new-post?edit=${post.id}` as Href) },
    {
      text: post.archived ? 'Unarchive' : 'Archive',
      onPress: () => actions.archivePost(post.id, !post.archived),
    },
    {
      text: 'Delete',
      style: 'destructive',
      onPress: () =>
        Alert.alert('Delete this post?', 'This can’t be undone. Archive it instead to just hide it.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => actions.deletePost(post.id) },
        ]),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}
