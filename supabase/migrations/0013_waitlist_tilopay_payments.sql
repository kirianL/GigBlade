-- Pagos con Tilopay para reservar la reunión del DJ antes de confirmar su lugar.
-- Tabla privada (solo service_role): anon/authenticated completamente revocados.

create table if not exists public.waitlist_payment_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  artist_name text not null,
  email text not null,
  country text not null default 'CR',
  city text,
  instagram text,
  phone text,
  note text,
  meeting_at timestamptz not null,
  referral_code text,
  package_id text not null default 'all_inclusive',
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'CRC')),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  tilopay_transaction_id text,
  tilopay_auth_code text,
  tilopay_response_code text,
  tilopay_description text,
  waitlist_id uuid references public.dj_waitlist(id) on delete set null,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists waitlist_payment_orders_active_meeting_idx
  on public.waitlist_payment_orders (meeting_at, expires_at)
  where status = 'pending';

create index if not exists waitlist_payment_orders_email_idx
  on public.waitlist_payment_orders (email);

create index if not exists waitlist_payment_orders_waitlist_id_idx
  on public.waitlist_payment_orders (waitlist_id)
  where waitlist_id is not null;

revoke all on public.waitlist_payment_orders from anon, authenticated, public;

alter table public.waitlist_payment_orders enable row level security;
alter table public.waitlist_payment_orders force row level security;

drop policy if exists waitlist_payment_orders_deny_client on public.waitlist_payment_orders;
create policy waitlist_payment_orders_deny_client
  on public.waitlist_payment_orders
  for all
  to anon, authenticated
  using (false)
  with check (false);

alter table public.dj_waitlist
  add column if not exists payment_status text not null default 'unpaid',
  add column if not exists payment_amount numeric(10, 2),
  add column if not exists payment_currency text,
  add column if not exists tilopay_order_number text,
  add column if not exists tilopay_transaction_id text,
  add column if not exists tilopay_auth_code text,
  add column if not exists paid_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'dj_waitlist_payment_status_valid'
      and conrelid = 'public.dj_waitlist'::regclass
  ) then
    alter table public.dj_waitlist
      add constraint dj_waitlist_payment_status_valid
      check (payment_status in ('unpaid', 'paid'));
  end if;
end $$;

create unique index if not exists dj_waitlist_tilopay_order_unique
  on public.dj_waitlist (tilopay_order_number)
  where tilopay_order_number is not null;
