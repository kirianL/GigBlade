alter table public.dj_waitlist
  add column if not exists phone text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dj_waitlist_phone_format'
      and conrelid = 'public.dj_waitlist'::regclass
  ) then
    alter table public.dj_waitlist
      add constraint dj_waitlist_phone_format check (
        phone is null
        or (
          char_length(phone) between 7 and 30
          and phone ~ '^\+?[0-9 .()-]+$'
        )
      );
  end if;
end $$;
