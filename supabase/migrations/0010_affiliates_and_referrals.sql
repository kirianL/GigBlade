-- Sistema nativo de referidos y afiliados para GigBlade.
-- Registra promotores (cualquier persona que recomiende GigBlade),
-- configuración de porcentajes y tarifas de comisión totalmente modificables:
-- Cobro inicial de la página (setup) y mensualidad recurrente ($30 USD),
-- conversiones de compras de DJs y liquidaciones en Colones (SINPE Móvil / Bancos).

alter table public.dj_waitlist
  add column if not exists referral_code text;

create table if not exists public.affiliates (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  email text not null,
  phone text,
  payment_method text not null default 'sinpe',
  payment_details jsonb not null default '{}'::jsonb,
  custom_percentage_enabled boolean not null default false,
  custom_percentages jsonb default null,     -- ej: {"initial_setup": 25, "monthly": 20}
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint affiliates_code_format check (
    code = upper(code)
    and char_length(code) between 2 and 30
    and code ~ '^[A-Z0-9_-]+$'
  ),
  constraint affiliates_name_length check (
    char_length(name) between 2 and 120
  ),
  constraint affiliates_payment_method check (
    payment_method in ('sinpe', 'iban')
  ),
  constraint affiliates_status check (
    status in ('active', 'paused', 'archived')
  )
);

create unique index if not exists affiliates_code_unique
  on public.affiliates (upper(code));

create index if not exists affiliates_status_idx
  on public.affiliates (status, created_at desc);

create trigger affiliates_set_updated_at
  before update on public.affiliates
  for each row
  execute function public.set_updated_at();

-- Configuración global de porcentajes y precios de comisión modificables (Cobro Inicial + Mensualidad)
create table if not exists public.referral_commission_settings (
  id uuid primary key default gen_random_uuid(),
  currency text not null default 'USD',
  exchange_rate_crc numeric(8, 2) not null default 515.00,
  initial_setup_price_usd numeric(10, 2) not null default 100.00,
  initial_setup_percent numeric(5, 2) not null default 20.00,
  monthly_price_usd numeric(10, 2) not null default 30.00,
  monthly_percent numeric(5, 2) not null default 15.00,
  model text not null default 'percentage',
  percentages jsonb not null default '{
    "initial_setup": 20,
    "monthly": 15
  }'::jsonb,
  package_prices jsonb not null default '{
    "initial_setup": 100,
    "monthly": 30
  }'::jsonb,
  is_active boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now()
);

-- Liquidaciones de comisiones (SINPE Móvil / Transferencia bancaria en Colones o Dólares)
create table if not exists public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  amount_usd numeric(12, 2),
  currency text not null default 'CRC',
  method text not null default 'sinpe',
  reference_number text not null,
  note text,
  paid_at timestamptz not null default now(),
  created_by text
);

create index if not exists referral_payouts_affiliate_idx
  on public.referral_payouts (affiliate_id, paid_at desc);

-- Conversiones de compras de DJs referidos (seguimiento)
create table if not exists public.referral_conversions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete restrict,
  dj_name text not null,
  dj_email text not null,
  dj_waitlist_id uuid references public.dj_waitlist(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  charge_type text not null default 'initial_setup', -- 'initial_setup' | 'monthly'
  amount_usd numeric(10, 2) not null default 100.00,
  amount_crc numeric(12, 2) not null default 51500.00,
  commission_percentage numeric(5, 2) not null default 20.00 check (commission_percentage >= 0 and commission_percentage <= 100),
  commission_amount_usd numeric(10, 2) not null default 20.00 check (commission_amount_usd >= 0),
  commission_amount_crc numeric(12, 2) not null default 10300.00 check (commission_amount_crc >= 0),
  package_id text not null default 'initial_setup',
  package_price numeric(12, 2) not null default 51500.00,
  commission_amount numeric(12, 2) not null default 10300.00,
  currency text not null default 'USD',
  status text not null default 'approved',
  payout_id uuid references public.referral_payouts(id) on delete set null,
  payout_status text not null default 'unpaid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_conversions_status check (
    status in ('pending', 'approved', 'rejected')
  ),
  constraint referral_conversions_payout_status check (
    payout_status in ('unpaid', 'paid')
  )
);

create index if not exists referral_conversions_affiliate_idx
  on public.referral_conversions (affiliate_id, created_at desc);

create index if not exists referral_conversions_payout_status_idx
  on public.referral_conversions (payout_status, created_at desc);

create trigger referral_conversions_set_updated_at
  before update on public.referral_conversions
  for each row
  execute function public.set_updated_at();

-- Seguridad RLS
alter table public.affiliates enable row level security;
alter table public.referral_commission_settings enable row level security;
alter table public.referral_payouts enable row level security;
alter table public.referral_conversions enable row level security;

revoke all on public.affiliates from anon, authenticated;
revoke all on public.referral_commission_settings from anon, authenticated;
revoke all on public.referral_payouts from anon, authenticated;
revoke all on public.referral_conversions from anon, authenticated;

-- Fila inicial de tarifas modificables (Setup $100 USD @ 20% y Mensualidad $30 USD @ 15%)
insert into public.referral_commission_settings (
  currency,
  exchange_rate_crc,
  initial_setup_price_usd,
  initial_setup_percent,
  monthly_price_usd,
  monthly_percent,
  model,
  percentages,
  package_prices,
  is_active
)
select 
  'USD', 
  515.00,
  100.00,
  20.00,
  30.00,
  15.00,
  'percentage',
  '{"initial_setup": 20, "monthly": 15}'::jsonb,
  '{"initial_setup": 100, "monthly": 30}'::jsonb,
  true
where not exists (select 1 from public.referral_commission_settings);
