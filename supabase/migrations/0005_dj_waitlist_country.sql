alter table public.dj_waitlist
  add column country text not null default 'CR',
  add constraint dj_waitlist_country_valid
    check (country in ('CR', 'US'));
