# Plataforma multitenant para DJs

Documento de contexto técnico y contrato arquitectónico para asistentes de código. Debe revisarse antes de generar o modificar código.

Estado: arquitectura objetivo para el MVP. No crear diseños ni componentes de UI hasta que se autorice explícitamente.

### Estado de implementación

- Hecho: repositorio Git aislado en `DjProject`, `.env.example` alineado, capas base, `proxy.ts`, cliente admin de Supabase, migraciones SQL/RLS/Storage, endpoint `/api/tenant`.
- Bloqueado sin credenciales: aplicar migraciones en un proyecto Supabase, leer Edge Config real, conectar Cloudflare y registrar un dominio de prueba.
- Pendiente: API de bookings, Turnstile, rate limiting, MFA admin, flujo de provisión de dominios, panel.

## Principios no negociables

- Un único proyecto y despliegue de Next.js atiende a todos los tenants.
- El tenant de navegación se resuelve por `hostname` contra Vercel Edge Config.
- Un `tenant_id` recibido del navegador nunca es una fuente de autorización.
- Las consultas con sesión de usuario se aíslan mediante RLS y una identidad firmada.
- Las operaciones con credenciales privilegiadas exigen un `TenantContext` validado y filtros explícitos, porque `service_role` omite RLS.
- Los secretos solo se usan en servidor.
- Toda operación externa facturable debe ser idempotente, auditable y recuperable.
- No se garantiza aislamiento físico con infraestructura compartida; se limita el impacto de *noisy neighbors* mediante cuotas, concurrencia, timeouts y límites por tenant.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend/Backend | Next.js 16+, App Router, Server Components por defecto |
| Hosting | Vercel Multi-Tenant Platform, Domains API, Edge Config y Firewall |
| Base de datos | Supabase Postgres con RLS |
| Storage | Supabase Storage con RLS en `storage.objects` |
| Edge/DNS/WAF | Cloudflare DNS, WAF y Cache |
| Registro de dominios | Cloudflare Registrar API beta |
| Antibot | Cloudflare Turnstile |
| Autenticación | Supabase Auth con MFA para administradores |

No usar proyectos de Vercel por tenant. No implementar correo transaccional en esta fase.

### Límites conocidos de Cloudflare Registrar

- La API de Registrar está en beta y solo soporta un subconjunto de TLD.
- Debe ejecutarse `domain-check` inmediatamente antes del registro; la búsqueda no es autoritativa.
- El registro es facturable y no reembolsable.
- La cuenta debe tener contacto de registrante y método de pago predeterminados.
- La API no soporta todavía renovaciones, transferencias ni cambios de contacto.
- `auto_renew` no debe asumirse: debe configurarse y supervisarse explícitamente.
- Cloudflare documenta un máximo de 100 dominios por cuenta. Antes de alcanzar ese límite se necesita una estrategia de múltiples cuentas o un proveedor alternativo.
- No se aceptan dominios internacionalizados en el MVP.

## Resolución multitenant

Edge Config almacena exclusivamente datos mínimos de enrutamiento:

```ts
type TenantRouting = {
  id: string;
  status: "active" | "suspended";
  canonicalHostname: string;
};
```

Las claves siguen el formato `tenant_<hostname-normalizado>`. El hostname se convierte a minúsculas, sin puerto ni punto final. Solo se aceptan hostnames válidos.

En Next.js 16 se usa `proxy.ts`; las lecturas de Edge Config son asíncronas:

```ts
import { get } from "@vercel/edge-config";
import { type NextRequest, NextResponse } from "next/server";

type TenantRouting = {
  id: string;
  status: "active" | "suspended";
  canonicalHostname: string;
};

function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export default async function proxy(request: NextRequest) {
  const hostname = normalizeHostname(request.nextUrl.hostname);
  let tenant: TenantRouting | undefined;

  try {
    tenant = await get<TenantRouting>(`tenant_${hostname}`);
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (!tenant || tenant.status !== "active") {
    return new NextResponse(null, { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);

  // Sobrescribe cualquier valor enviado por el cliente.
  requestHeaders.set("x-tenant-id", tenant.id);
  requestHeaders.set("x-tenant-hostname", hostname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

Los encabezados internos transportan contexto dentro de Next.js, pero no reemplazan la autorización de base de datos. Ningún repositorio acepta un `tenant_id` proveniente del body, query string o formulario.

Si Edge Config falla, la respuesta es cerrada (`503`) y no se consulta Supabase como fallback por request. Un dominio desconocido o suspendido devuelve `404`.

### Sincronización de Edge Config

- Las lecturas usan `@vercel/edge-config`.
- Las mutaciones usan la API autenticada de Vercel; no existe un `edgeConfig.set()` local.
- Todo cambio se registra primero en una operación/outbox persistente.
- Un reconciliador reintenta cambios pendientes y compara Supabase, Vercel Domains, Cloudflare y Edge Config.
- Al cambiar un dominio se activa primero el nuevo mapping y después se elimina el anterior.
- Nunca se marca un dominio como activo hasta que DNS, Vercel y Edge Config estén verificados.

## Variables de entorno

```text
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel
VERCEL_API_TOKEN=
VERCEL_PROJECT_ID=
VERCEL_TEAM_ID=
EDGE_CONFIG=
EDGE_CONFIG_ID=

# Cloudflare
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=

# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

`CLOUDFLARE_ZONE_ID` no es global: cada dominio tiene su propio `zone_id`, almacenado en `tenant_domains`.

### Clasificación de secretos

Solo pueden importarse desde módulos marcados con `server-only`:

- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_API_TOKEN`
- `CLOUDFLARE_API_TOKEN`
- `TURNSTILE_SECRET_KEY`

Nunca se exponen con `NEXT_PUBLIC_`, se registran en logs ni se incluyen en errores. Se validan al iniciar el servidor mediante un schema centralizado. Los tokens deben tener el mínimo alcance posible y rotarse.

## Esquema de base de datos

Los valores de estado son contratos internos estables; la traducción para usuarios pertenece a presentación.

```sql
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

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  contact_name text not null,
  contact_email text not null,
  event_date date,
  message text,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_name_length check (
    char_length(contact_name) between 1 and 120
  ),
  constraint bookings_email_length check (
    char_length(contact_email) between 3 and 320
  ),
  constraint bookings_message_length check (
    message is null or char_length(message) <= 5000
  ),
  constraint bookings_status_valid check (
    status in ('new', 'contacted', 'closed')
  )
);

create index bookings_tenant_created_idx
  on public.bookings (tenant_id, created_at desc);

create index bookings_tenant_status_idx
  on public.bookings (tenant_id, status);

create table public.analytics_daily (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  date date not null,
  visits integer not null default 0 check (visits >= 0),
  bookings_count integer not null default 0 check (bookings_count >= 0),
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
```

Las migraciones deben incluir una función/trigger común para actualizar `updated_at`.

## RLS y autorización

RLS se activa incluso en tablas a las que normalmente accede solo el servidor:

```sql
alter table public.tenants enable row level security;
alter table public.tenant_domains enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.bookings enable row level security;
alter table public.analytics_daily enable row level security;
alter table public.admins enable row level security;
alter table public.domain_provisioning_operations enable row level security;
```

La pertenencia se deriva de `auth.uid()`, nunca de un header modificable:

```sql
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
```

No se concede escritura directa sobre `tenants`, `tenant_domains`, `tenant_memberships`, `admins` ni `domain_provisioning_operations`; sus mutaciones pasan por casos de uso servidor autorizados. No usar una política genérica `FOR ALL` cuando los permisos de lectura y escritura son distintos. La ausencia de una política es una denegación intencional, no una tarea pendiente.

No existe política `INSERT` pública para `bookings`. El formulario público llama exclusivamente a `/api/bookings`; el handler:

1. Resuelve el tenant desde el contexto interno creado por `proxy.ts`.
2. Verifica Turnstile, schema, límites y rate limits.
3. Descarta cualquier `tenant_id` recibido del cliente.
4. Inserta con un cliente privilegiado exclusivamente servidor.

`service_role` omite RLS. Por ello, cada método privilegiado recibe un objeto `TenantContext` construido por código confiable y añade `.eq("tenant_id", context.tenantId)` en lecturas, actualizaciones y borrados. Esto se valida con pruebas de aislamiento entre dos tenants.

### Administradores y MFA

Antes de cualquier `/api/admin/*`, el servidor debe:

1. Validar criptográficamente el JWT; no confiar solo en datos de sesión almacenados.
2. Exigir `auth.jwt()->>'aal' = 'aal2'` o el claim equivalente validado en servidor.
3. Comprobar que `auth.uid()` existe en `admins` y que el rol permite la acción.
4. Volver a comprobar autorización dentro de la operación sensible.

Las políticas de datos administrativos que usen sesiones deben ser `AS RESTRICTIVE` para exigir AAL2 aunque existan otras políticas permisivas.

## Rutas de API

Las colecciones usan plural de forma consistente:

| Ruta | Método y función | Límites | Protección |
|---|---|---|---|
| `/api/bookings` | `POST` crear solicitud | IP + tenant | Turnstile, schema y límites |
| `/api/uploads` | `POST` subir imagen | IP + usuario + tenant | sesión, MIME real y tamaño |
| `/api/auth/*` | Supabase Auth | IP + usuario | límites de Supabase y Firewall |
| `/api/admin/tenants` | CRUD administrativo | usuario + acción | sesión, rol y AAL2 |
| `/api/domains/registrations` | `POST` iniciar alta | tenant + usuario | sesión, rol e idempotencia |
| `/api/domains/[hostname]/status` | `GET` consultar estado | tenant + usuario | sesión y pertenencia |

El contacto general se modela como booking sin `event_date`; no se mantiene una segunda ruta con semántica duplicada.

### Contrato común

- Validación server-side con schemas explícitos.
- Body con límite de bytes antes de parsearlo.
- Errores JSON tipados con `code`, `message` seguro y `requestId`.
- No devolver mensajes internos de proveedores.
- Timeouts y cancelación en llamadas externas.
- Logs estructurados con `requestId`, operación y tenant; nunca tokens, email completo ni contenido del mensaje.
- `Idempotency-Key` obligatorio en operaciones facturables o reintentables.

## Rate limiting y aislamiento de tráfico

No usar una única clave concatenada. Aplicar buckets independientes:

- Por IP: reduce abuso individual.
- Por usuario: protege operaciones autenticadas.
- Por tenant/dominio: evita que muchas IP saturen un tenant.
- Cuota global de emergencia: protege la plataforma.

Valores iniciales:

- Booking: 5 por IP cada 10 minutos y 100 por tenant cada 10 minutos.
- Upload: 20 por usuario por hora, 100 por tenant por hora y máximo 2 concurrentes por tenant.
- Admin y dominios: límites por usuario, tenant y tipo de acción.

Los contadores deben residir en un almacén distribuido compatible con Vercel. Toda respuesta limitada usa `429`, `Retry-After` y no consume operaciones externas.

Un ataque a un tenant puede compartir infraestructura con otros; la defensa consiste en límites por tenant, timeouts, circuit breakers, colas particionadas y concurrencia justa.

## Turnstile

En cada formulario público:

1. El cliente obtiene un token de un solo uso.
2. El servidor llama a Siteverify con `TURNSTILE_SECRET_KEY`.
3. Se valida `success`, hostname esperado y, si se configura, `action`.
4. El token se verifica antes de cualquier escritura.
5. Un fallo del proveedor cierra la operación; no se omite silenciosamente.

Turnstile complementa el rate limit; no lo reemplaza.

## Subida y entrega de archivos

En el MVP solo se admiten imágenes:

```text
Extensiones permitidas: .jpg, .jpeg, .png, .webp
Extensiones bloqueadas: todas las demás
Tamaño máximo del original: 10 MB
Validación: extensión + magic bytes + decodificación real
Ruta interna: <tenant_id>/<uuid>.<ext>
Postproceso: corregir orientación, eliminar EXIF, limitar dimensiones,
             redimensionar y convertir a WebP/AVIF
```

- No admitir SVG, HTML, JavaScript, ejecutables, archivos comprimidos ni PDF.
- El nombre y la ruta final los genera el servidor.
- El original permanece privado o se elimina después del procesamiento.
- Solo los derivados validados pueden servirse públicamente.
- Configurar límites de dimensiones y píxeles para evitar imágenes bomba.
- No usar el `Content-Type` enviado por el navegador como evidencia.

### Supabase Storage RLS

- Definir buckets y políticas en `storage.objects`.
- Las rutas comienzan con el `tenant_id`.
- Crear políticas separadas para `SELECT`, `INSERT`, `UPDATE` y `DELETE`.
- Verificar pertenencia mediante identidad autenticada, no mediante el path por sí solo.
- Si el servidor usa `service_role`, aplicar el mismo `TenantContext` obligatorio que en Postgres.
- No permitir `upsert` público.
- La caché de archivos derivados incluye hostname/tenant y versión del asset.

## Flujo robusto de alta de dominio

El registro no es una transacción distribuida. Se implementa como máquina de estados persistente:

1. Autenticar usuario, pertenencia, rol y AAL requerido.
2. Normalizar y validar hostname ASCII.
3. Crear `tenant_domains` en `pending` y una operación con `idempotency_key`.
4. Ejecutar `domain-check` autoritativo y guardar precio/TLD/resultado.
5. Exigir confirmación explícita del precio antes de la compra.
6. Registrar el dominio. Aceptar respuesta síncrona o `202` con URL de workflow.
7. Si el proceso se interrumpe, consultar el estado antes de reintentar la compra.
8. Obtener y guardar el `cloudflare_zone_id` del dominio.
9. Añadir el dominio al proyecto Vercel.
10. Consultar los registros exigidos por Vercel y crear A/CNAME/TXT en esa zona de Cloudflare.
11. Esperar verificación DNS y certificado SSL con polling acotado y backoff.
12. Actualizar Supabase y activar `tenant_<hostname>` mediante la API de Edge Config.
13. Marcar dominio y operación como `active`/`succeeded`.

Una compra completada no se intenta “revertir”: es no reembolsable. Los fallos posteriores quedan en estado recuperable y el reconciliador continúa desde el último paso confirmado.

Los dominios registrados en Cloudflare usan sus nameservers y apuntan a Vercel mediante DNS externo. Si en el futuro se ofrecen subdominios wildcard de la plataforma, se debe diseñar aparte la delegación a nameservers de Vercel requerida para certificados wildcard.

## Caché

- Toda clave o tag de caché incluye tenant y hostname canónico.
- Nunca almacenar respuestas privadas en caché pública.
- Invalidar por tenant al cambiar tema, dominio, estado o plan.
- Definir TTL y estrategia stale-while-revalidate por tipo de dato.
- No construir claves con headers no validados del cliente.

## Seguridad y operación antes de cada release

- [ ] RLS activa en todas las tablas y `storage.objects`
- [ ] Pruebas automáticas demuestran aislamiento entre al menos dos tenants
- [ ] `service_role` y tokens externos solo aparecen en módulos `server-only`
- [ ] Rate limiting distribuido activo en rutas públicas y sensibles
- [ ] Turnstile activo y validado en servidor
- [ ] Inputs, tamaño de body y outputs validados
- [ ] CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y protección de framing configurados
- [ ] MFA/AAL2 y rol comprobados en todas las operaciones admin
- [ ] Backups automáticos y restauración de Supabase probados
- [ ] Secretos rotables, con mínimo privilegio y sin hardcodear
- [ ] Storage privado para originales y validación real de contenido
- [ ] Idempotencia, timeouts y reconciliación en integraciones externas
- [ ] Logs sin secretos ni PII sensible
- [ ] Política de retención y borrado para bookings definida
- [ ] Alertas de expiración, renovación y fallos de dominio activas
- [ ] Capacidad de Cloudflare Registrar por debajo del umbral operativo

## Organización y clean code

Dependencias apuntan hacia el dominio, no hacia proveedores:

```text
src/
  app/                    # rutas, Server Components y Route Handlers
  application/            # casos de uso y orquestación
  domain/                 # entidades, invariantes y errores
  infrastructure/
    cloudflare/
    edge-config/
    supabase/
    vercel/
  lib/
    auth/
    env/
    http/
    rate-limit/
    tenant/
```

Convenciones:

- Server Components por defecto; `"use client"` solo cuando exista interactividad real.
- Módulos de secretos e infraestructura incluyen `import "server-only"`.
- Route Handlers son adaptadores delgados: autentican, validan y llaman un caso de uso.
- La lógica de negocio no importa SDKs de Supabase, Vercel ni Cloudflare.
- Cada proveedor implementa una interfaz pequeña y testeable.
- Los errores internos son tipados y se traducen a HTTP en un único lugar.
- No usar booleanos ambiguos para workflows; usar estados explícitos.
- No duplicar schemas o normalización de hostname.
- No crear abstracciones genéricas antes de tener dos usos reales.
- Toda consulta privilegiada que toque datos de tenant exige `TenantContext`.
- Las pruebas cubren éxito, autorización cruzada, reintentos y fallos parciales.

## Fuera de alcance

- Diseños y componentes de UI.
- Correo electrónico transaccional.
- Analytics en tiempo real o UI de analytics.
- Facturación recurrente automática.
- Documentos PDF.
- Dominios internacionalizados.
- Transferencias y renovaciones automatizadas mientras la API de Cloudflare no las soporte.

## Fuentes de referencia

- Supabase RLS: <https://supabase.com/docs/guides/database/postgres/row-level-security>
- Supabase MFA: <https://supabase.com/docs/guides/auth/auth-mfa>
- Supabase Storage RLS: <https://supabase.com/docs/guides/storage/security/access-control>
- Vercel Edge Config: <https://vercel.com/docs/edge-config/get-started>
- Vercel Multi-Tenant Domains: <https://vercel.com/docs/platforms/multi-tenant-platforms/configuring-domains>
- Cloudflare Registrar API: <https://developers.cloudflare.com/registrar/registrar-api/>
