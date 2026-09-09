alter table public.tenants enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.bookings enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.admins enable row level security;
alter table public.domain_provisioning_operations enable row level security;

revoke all on public.tenants from anon, authenticated;
revoke all on public.tenant_domains from anon, authenticated;
revoke all on public.tenant_memberships from anon, authenticated;
revoke all on public.bookings from anon, authenticated;
revoke all on public.analytics_daily from anon, authenticated;
revoke all on public.admins from anon, authenticated;
revoke all on public.domain_provisioning_operations from anon, authenticated;

grant select on public.tenants to authenticated;
grant select on public.tenant_domains to authenticated;
grant select on public.tenant_memberships to authenticated;
grant select, update on public.bookings to authenticated;
grant select on public.analytics_daily to authenticated;
grant select on public.admins to authenticated;

create schema if not exists private;

create or replace function private.has_tenant_access(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships membership
    where membership.tenant_id = target_tenant_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_tenant_role(
  target_tenant_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_memberships membership
    where membership.tenant_id = target_tenant_id
      and membership.user_id = (select auth.uid())
      and membership.role = any(allowed_roles)
  );
$$;

revoke all on function private.has_tenant_access(uuid) from public;
revoke all on function private.has_tenant_role(uuid, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_tenant_access(uuid) to authenticated;
grant execute on function private.has_tenant_role(uuid, text[]) to authenticated;

create policy tenants_member_select
  on public.tenants
  for select
  to authenticated
  using (private.has_tenant_access(id));

create policy tenant_domains_member_select
  on public.tenant_domains
  for select
  to authenticated
  using (private.has_tenant_access(tenant_id));

create policy bookings_tenant_select
  on public.bookings
  for select
  to authenticated
  using (private.has_tenant_access(tenant_id));

create policy bookings_tenant_update
  on public.bookings
  for update
  to authenticated
  using (private.has_tenant_role(tenant_id, array['owner', 'editor']))
  with check (private.has_tenant_role(tenant_id, array['owner', 'editor']));

create policy analytics_tenant_select
  on public.analytics_daily
  for select
  to authenticated
  using (private.has_tenant_access(tenant_id));

create policy memberships_own_select
  on public.tenant_memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy admins_own_aal2_select
  on public.admins
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    and (select auth.jwt()->>'aal') = 'aal2'
  );
