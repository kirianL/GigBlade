-- Fecha y hora agendada para la reunión de bienvenida del DJ en la lista de espera.

alter table public.dj_waitlist
  add column if not exists meeting_at timestamptz;

create index if not exists dj_waitlist_meeting_at_idx
  on public.dj_waitlist (meeting_at)
  where meeting_at is not null;
