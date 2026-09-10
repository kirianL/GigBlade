-- Contrato de esquema congelado para el MVP.
-- No aplicar contra un proyecto real hasta el día de conexión.
-- Cambios posteriores deben ser migraciones nuevas, no reescrituras.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  plan text not null default 'all_inclusive',
  theme_config jsonb not null default '{}'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenants_slug_format check (
    slug = lower(slug)
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint tenants_plan_valid check (
    plan in ('all_inclusive')
  ),
  constraint tenants_status_valid check (
    status in ('active', 'suspended', 'canceled')
  ),
  constraint tenants_theme_object check (
    jsonb_typeof(theme_config) = 'object'
  )
);

create unique index tenants_slug_unique
  on public.tenants (lower(slug));

create trigger tenants_set_updated_at
  before update on public.tenants
  for each row
  execute function public.set_updated_at();

create table public.tenant_domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  hostname text not null,
  kind text not null default 'registered',
  status text not null default 'pending',
  is_canonical boolean not null default false,
  registrar text,
  cloudflare_zone_id text,
  registered_at timestamptz,
  expires_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tenant_domains_hostname_normalized check (
    hostname = lower(hostname)
    and hostname !~ '[:/]'
    and hostname !~ '\.$'
  ),
  constraint tenant_domains_kind_valid check (
    kind in ('registered', 'brought_in', 'platform_subdomain')
  ),
  constraint tenant_domains_status_valid check (
    status in (
      'pending',
      'registering',
      'configuring_dns',
      'verifying',
      'active',
      'failed',
      'disabled'
    )
  )
);

create unique index tenant_domains_hostname_unique
  on public.tenant_domains (lower(hostname));

create unique index tenant_domains_one_canonical
  on public.tenant_domains (tenant_id)
  where is_canonical;

create index tenant_domains_tenant_id_idx
  on public.tenant_domains (tenant_id);

create trigger tenant_domains_set_updated_at
  before update on public.tenant_domains
  for each row
  execute function public.set_updated_at();

create table public.tenant_memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id),
  constraint tenant_memberships_role_valid check (
    role in ('owner', 'editor', 'viewer')
  )
);

create index tenant_memberships_user_id_idx
  on public.tenant_memberships (user_id);

create table public.analytics_daily (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date date not null,
  visits integer not null default 0 check (visits >= 0),
  primary key (tenant_id, date)
);

create table public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  constraint admins_role_valid check (
    role in ('admin', 'soporte')
  )
);

create table public.domain_provisioning_operations (
  id uuid primary key default gen_random_uuid(),
  tenant_domain_id uuid not null
    references public.tenant_domains(id) on delete cascade,
  idempotency_key text not null unique,
  status text not null,
  provider_workflow_url text,
  last_error_code text,
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint domain_operations_status_valid check (
    status in (
      'pending',
      'checking',
      'registering',
      'configuring_dns',
      'adding_to_vercel',
      'verifying',
      'syncing_edge_config',
      'succeeded',
      'failed'
    )
  )
);

create trigger domain_provisioning_operations_set_updated_at
  before update on public.domain_provisioning_operations
  for each row
  execute function public.set_updated_at();
