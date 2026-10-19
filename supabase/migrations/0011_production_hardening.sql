-- Endurecimiento de producción: revocar grants directos de anon/authenticated,
-- forzar RLS en todas las tablas del esquema public, declarar políticas de
-- denegación explícita (el backend opera con service_role) y agregar índices
-- sobre las llaves foráneas de referral_conversions.

revoke all on public.tenants from anon, authenticated, public;
revoke all on public.tenant_domains from anon, authenticated, public;
revoke all on public.dj_waitlist from anon, authenticated, public;
revoke all on public.panel_accounts from anon, authenticated, public;
revoke all on public.panel_sessions from anon, authenticated, public;
revoke all on public.site_visits from anon, authenticated, public;
revoke all on public.bookings from anon, authenticated, public;
revoke all on public.affiliates from anon, authenticated, public;
revoke all on public.referral_commission_settings from anon, authenticated, public;
revoke all on public.referral_conversions from anon, authenticated, public;
revoke all on public.referral_payouts from anon, authenticated, public;

alter table public.tenants enable row level security;
alter table public.tenants force row level security;

alter table public.tenant_domains enable row level security;
alter table public.tenant_domains force row level security;

alter table public.dj_waitlist enable row level security;
alter table public.dj_waitlist force row level security;

alter table public.panel_accounts enable row level security;
alter table public.panel_accounts force row level security;

alter table public.panel_sessions enable row level security;
alter table public.panel_sessions force row level security;

alter table public.site_visits enable row level security;
alter table public.site_visits force row level security;

alter table public.bookings enable row level security;
alter table public.bookings force row level security;

alter table public.affiliates enable row level security;
alter table public.affiliates force row level security;

alter table public.referral_commission_settings enable row level security;
alter table public.referral_commission_settings force row level security;

alter table public.referral_conversions enable row level security;
alter table public.referral_conversions force row level security;

alter table public.referral_payouts enable row level security;
alter table public.referral_payouts force row level security;

drop policy if exists tenants_deny_client on public.tenants;
create policy tenants_deny_client
  on public.tenants
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists tenant_domains_deny_client on public.tenant_domains;
create policy tenant_domains_deny_client
  on public.tenant_domains
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists dj_waitlist_deny_client on public.dj_waitlist;
create policy dj_waitlist_deny_client
  on public.dj_waitlist
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists panel_accounts_deny_client on public.panel_accounts;
create policy panel_accounts_deny_client
  on public.panel_accounts
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists panel_sessions_deny_client on public.panel_sessions;
create policy panel_sessions_deny_client
  on public.panel_sessions
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists site_visits_deny_client on public.site_visits;
create policy site_visits_deny_client
  on public.site_visits
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists bookings_deny_client on public.bookings;
create policy bookings_deny_client
  on public.bookings
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists affiliates_deny_client on public.affiliates;
create policy affiliates_deny_client
  on public.affiliates
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists referral_commission_settings_deny_client on public.referral_commission_settings;
create policy referral_commission_settings_deny_client
  on public.referral_commission_settings
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists referral_conversions_deny_client on public.referral_conversions;
create policy referral_conversions_deny_client
  on public.referral_conversions
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists referral_payouts_deny_client on public.referral_payouts;
create policy referral_payouts_deny_client
  on public.referral_payouts
  for all
  to anon, authenticated
  using (false)
  with check (false);

create index if not exists referral_conversions_waitlist_idx
  on public.referral_conversions (dj_waitlist_id);

create index if not exists referral_conversions_tenant_idx
  on public.referral_conversions (tenant_id);

create index if not exists referral_conversions_payout_idx
  on public.referral_conversions (payout_id);

delete from public.panel_sessions
where expires_at <= now();
