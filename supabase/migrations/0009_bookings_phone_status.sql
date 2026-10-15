alter table public.bookings
  add column if not exists phone text,
  add column if not exists status text not null default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_phone_format'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_phone_format check (
        phone is null
        or (
          char_length(phone) between 7 and 30
          and phone ~ '^\+?[0-9 .()-]+$'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_status_valid'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_status_valid check (
        status in ('pending', 'confirmed', 'declined')
      );
  end if;
end $$;

create index if not exists bookings_tenant_status_idx
  on public.bookings (tenant_id, status, created_at desc);

grant update on public.bookings to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bookings'
      and policyname = 'bookings_member_update'
  ) then
    create policy bookings_member_update
      on public.bookings
      for update
      to authenticated
      using (private.has_tenant_access(tenant_id))
      with check (private.has_tenant_access(tenant_id));
  end if;
end $$;
