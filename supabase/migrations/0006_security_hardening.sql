-- A01 / A09: bookings y audit_log con RLS. Sin grants a anon/authenticated.
-- Las escrituras pasan por service_role en el servidor.

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text not null,
  event_type text not null,
  city text,
  event_date date,
  note text,
  created_at timestamptz not null default now(),
  constraint bookings_name_len check (char_length(name) between 1 and 80),
  constraint bookings_email_normalized check (
    email = lower(email)
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  ),
  constraint bookings_event_type_valid check (
    event_type in (
      'club',
      'festival',
      'private',
      'wedding',
      'corporate',
      'other'
    )
  ),
  constraint bookings_city_len check (
    city is null or char_length(city) between 1 and 80
  ),
  constraint bookings_note_len check (
    note is null or char_length(note) <= 500
  )
);

create index bookings_tenant_created_idx
  on public.bookings (tenant_id, created_at desc);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  action text not null,
  resource text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_log_action_len check (
    char_length(action) between 1 and 80
  ),
  constraint audit_log_resource_len check (
    char_length(resource) between 1 and 120
  ),
  constraint audit_log_metadata_object check (
    jsonb_typeof(metadata) = 'object'
  )
);

create index audit_log_tenant_created_idx
  on public.audit_log (tenant_id, created_at desc);

create index audit_log_actor_created_idx
  on public.audit_log (actor_user_id, created_at desc);

alter table public.bookings enable row level security;
alter table public.bookings force row level security;
alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

alter table public.tenants force row level security;
alter table public.tenant_domains force row level security;
alter table public.tenant_memberships force row level security;
alter table public.analytics_daily force row level security;
alter table public.admins force row level security;
alter table public.domain_provisioning_operations force row level security;
alter table public.dj_waitlist force row level security;

revoke all on public.bookings from anon, authenticated;
revoke all on public.audit_log from anon, authenticated;

grant select on public.bookings to authenticated;

create policy bookings_member_select
  on public.bookings
  for select
  to authenticated
  using (private.has_tenant_access(tenant_id));
