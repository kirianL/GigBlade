-- Lista de espera pública de DJs. Sin SELECT para anon/authenticated:
-- las altas pasan por la API con service role.

create table public.dj_waitlist (
  id uuid primary key default gen_random_uuid(),
  artist_name text not null,
  email text not null,
  city text,
  instagram text,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint dj_waitlist_artist_name_len check (
    char_length(artist_name) between 2 and 80
  ),
  constraint dj_waitlist_email_normalized check (
    email = lower(email)
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint dj_waitlist_city_len check (
    city is null or char_length(city) between 1 and 80
  ),
  constraint dj_waitlist_instagram_format check (
    instagram is null or instagram ~ '^[a-z0-9._]{1,30}$'
  ),
  constraint dj_waitlist_note_len check (
    note is null or char_length(note) <= 280
  ),
  constraint dj_waitlist_status_valid check (
    status in ('pending', 'contacted', 'onboarded', 'declined')
  )
);

create unique index dj_waitlist_email_unique
  on public.dj_waitlist (email);

alter table public.dj_waitlist enable row level security;

revoke all on public.dj_waitlist from anon, authenticated;
