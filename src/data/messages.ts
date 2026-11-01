// Sample conversations so Messages has life before there's a server.
// "members" is the Mile Club Members group: everyone who signs up is added to it
// automatically (needs the server later), and by default only admins can post.

export type ChatMessage = { id: string; from: 'me' | 'them' | 'admin'; text: string };

export type ChatThread = {
  id: string;
  kind: 'group' | 'private';
  personId?: string; // for private chats
  name: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
};

export const MEMBERS_GROUP_ID = 'members';

export const THREADS: ChatThread[] = [
  {
    id: MEMBERS_GROUP_ID,
    kind: 'group',
    name: 'Mile Club Members',
    time: '8:30',
    unread: true,
    messages: [
      { id: 'g1', from: 'admin', text: 'Welcome to Mile Club! This is where we share news, new runs and events with every member.' },
      { id: 'g2', from: 'admin', text: 'This week’s group runs are live. Pick one on Home and swipe right to join.' },
    ],
  },
  {
    id: 'femke',
    kind: 'private',
    personId: 'femke',
    name: 'Femke',
    time: '9:12',
    unread: true,
    messages: [
      { id: 'f1', from: 'them', text: 'Are you coming to the riverside run on Saturday?' },
      { id: 'f2', from: 'me', text: 'Yes! Just joined. Is it really chatty pace?' },
      { id: 'f3', from: 'them', text: 'Promise. Coffee after?' },
      { id: 'f4', from: 'them', text: 'See you at the bridge at 8?' },
    ],
  },
  {
    id: 'daan',
    kind: 'private',
    personId: 'daan',
    name: 'Daan',
    time: 'Yesterday',
    unread: false,
    messages: [
      { id: 'd1', from: 'them', text: 'Good long run today. Same time next week?' },
      { id: 'd2', from: 'me', text: 'Great run today!' },
    ],
  },
  {
    id: 'sanne',
    kind: 'private',
    personId: 'sanne',
    name: 'Sanne',
    time: 'Mon',
    unread: false,
    messages: [{ id: 's1', from: 'them', text: 'Thanks for waiting for me on the last kilometre!' }],
  },
];

export function findThread(id: string) {
  return THREADS.find((t) => t.id === id);
}
