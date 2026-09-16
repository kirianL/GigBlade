-- Plantillas de sitio DJ.
-- Los ids deben coincidir con SITE_TEMPLATE_IDS en src/domain/site-template.ts.
-- No aplica diseño: solo el contrato de qué plantilla renderiza el hostname.

alter table public.tenants
  add column if not exists template_id text not null default 'pista';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'tenants_template_id_valid'
      and conrelid = 'public.tenants'::regclass
  ) then
    alter table public.tenants
      add constraint tenants_template_id_valid check (
        template_id = lower(template_id)
        and template_id in ('pista', 'festival', 'after')
      );
  end if;
end $$;
