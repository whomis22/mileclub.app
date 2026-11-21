import 'react-native-url-polyfill/auto';

import { createClient, processLock } from '@supabase/supabase-js';
import { Storage } from '@/lib/kv';
import { AppState, Platform } from 'react-native';

import type { Profile } from '@/data/types';

// Mile Club's server (Supabase, EU / Ireland). The publishable key is meant to be
// public: what each person may read or change is decided by the rules on the server.
const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://zfdklgeiacutfezykweq.supabase.co';
const KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY ?? 'sb_publishable_dDX4vOCfhyjOp-_nKYKUQA_VnUgbPTS';

export const supabase = createClient(URL, KEY, {
  auth: {
    storage: Storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

// Keep the login fresh only while the app is open.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

// Plain-English versions of the server's error messages.
export function friendlyError(e: unknown): string {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : String(e);
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password don’t match. Try again?';
  if (m.includes('expired') || m.includes('invalid') && m.includes('token')) return 'That code isn’t right or has expired. Ask for a new one.';
  if (m.includes('rate limit') || m.includes('only request this after') || m.includes('security purposes'))
    return 'Too many tries in a short time. Please wait a minute and try again.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the code.';
  if (m.includes('signups not allowed') || m.includes('user not found')) return 'We couldn’t find an account with that email.';
  if (m.includes('network') || m.includes('fetch')) return 'No connection. Check your internet and try again.';
  if (m.includes('password')) return msg;
  return 'Something went wrong. Please try again.';
}

// The signed-in person's account id, or null when nobody is logged in (read from the phone, no network).
export async function myId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// The signed-in person's profile row: only they can read or change it.
export async function fetchMyProfile(): Promise<Profile | null> {
  const id = await myId();
  if (!id) return null;
  const { data, error } = await supabase.from('profiles').select('data').eq('id', id).maybeSingle();
  if (error || !data?.data || !Object.keys(data.data).length) return null;
  return data.data as Profile;
}

// Save the profile to the server (best effort: the phone keeps its own copy too).
export async function pushProfile(profile: Profile) {
  const id = await myId();
  if (!id) return;
  // The photo is still a file on this phone; it moves to the server in a later step.
  const { photoUri: _photo, ...rest } = profile;
  await supabase.from('profiles').upsert({ id: id, name: profile.firstName, data: rest, updated_at: new Date().toISOString() });
}

// Claim an @username for the signed-in person. Returns false if someone else has it.
export async function claimUsername(username: string, name: string): Promise<boolean> {
  const id = await myId();
  if (!id) return true;
  const { error } = await supabase.from('profiles').upsert({ id: id, username, name });
  if (error?.code === '23505') return false;
  if (error) throw error;
  return true;
}
