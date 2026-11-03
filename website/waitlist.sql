-- Mile Club website waitlist.
-- Anyone can add themselves (insert only). Nobody can read the list from the website;
-- Yana sees it in Supabase under Table Editor > waitlist.
create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  city text not null check (char_length(city) between 1 and 100),
  age int not null check (age between 16 and 100),
  source text not null default 'website'
);
create unique index if not exists waitlist_email_city on public.waitlist (lower(email), lower(city));
alter table public.waitlist enable row level security;
drop policy if exists "Anyone can join the waitlist" on public.waitlist;
create policy "Anyone can join the waitlist" on public.waitlist
  for insert to anon, authenticated with check (true);
grant insert on public.waitlist to anon, authenticated;
