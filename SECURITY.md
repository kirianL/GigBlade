# SECURITY.md — Requisitos de seguridad obligatorios

Este documento define qué tiene que cumplir el código de GigBlade en materia de seguridad, sin excepción. Está organizado según el OWASP Top 10:2025 (la versión vigente del estándar), adaptado al stack real del proyecto: Next.js, Vercel, Supabase, Cloudflare.

## A01: Control de acceso roto (el riesgo #1 en 2025)

Es el riesgo más común y más grave. Para GigBlade significa, específicamente, que un DJ pueda ver o modificar datos de otro DJ.

- RLS (Row Level Security) activa en Supabase en toda tabla que tenga datos de tenant: `bookings`, `analytics_daily`, `tenants`.
- Ninguna operación sensible (alta, baja, cambio de plan, cambio de dominio) se resuelve desde el cliente. Siempre pasa por `service_role` en el servidor, con su propia verificación de permisos.
- El header `x-tenant-id` que pone el middleware nunca se confía a ciegas si además viene manipulado desde el cliente; se revalida contra Edge Config o Supabase en operaciones sensibles.
- SSRF (que en 2025 se fusionó a esta categoría): ninguna funcionalidad del servidor hace peticiones a URLs que vengan directamente de datos ingresados por el usuario sin validar contra una lista permitida.

## A02: Configuración de seguridad incorrecta (subió al puesto #2 en 2025)

- Headers de seguridad configurados: Content Security Policy, X-Frame-Options, X-Content-Type-Options.
- Ninguna variable de entorno sensible (`SUPABASE_SERVICE_ROLE_KEY`, `CLOUDFLARE_API_TOKEN`, `VERCEL_API_TOKEN`) con el prefijo `NEXT_PUBLIC_`.
- Modo debug y mensajes de error detallados desactivados en producción.
- Revisión periódica de la configuración de Cloudflare (WAF, reglas de firewall) y de Vercel (variables de entorno por ambiente, dominios autorizados).

## A03: Fallas en la cadena de suministro de software (categoría nueva en 2025)

Antes era solo "componentes vulnerables"; ahora cubre también el pipeline de build y las dependencias en general. Es la categoría con menor cantidad de casos detectados, pero el mayor impacto cuando ocurre.

- `npm audit` (o equivalente) corrido antes de cada release.
- Lockfile (`package-lock.json`) siempre commiteado, nunca generado distinto entre entornos.
- Si se usan GitHub Actions, versiones fijadas por hash, no por tag mutable.
- Revisar paquetes nuevos antes de instalarlos: nombre correcto (cuidado con typosquatting), mantenedor activo, sin postinstall scripts sospechosos.

## A04: Fallas criptográficas

- Todo el tráfico bajo HTTPS, sin excepción (ya cubierto por Vercel y Cloudflare, pero hay que verificarlo en cada dominio de DJ nuevo).
- Ningún dato sensible (contraseñas, tokens) almacenado en texto plano; Supabase Auth ya maneja el hash de contraseñas, no reinventar eso.
- Ninguna clave secreta hardcodeada en el código, siempre en variables de entorno.

## A05: Inyección

- Toda consulta a Supabase usa el cliente oficial (que parametriza automáticamente), nunca se arma SQL concatenando strings con datos del usuario.
- Validación de entrada con Zod en todos los endpoints públicos (`/api/waitlist` y, si se reabren, `/api/booking`, `/api/contact`, `/api/upload`) antes de procesar cualquier dato.
- Todo contenido generado por el usuario (biografía del DJ, mensajes de booking) se escapa correctamente antes de renderizarse, para evitar Cross-Site Scripting.

## A06: Diseño inseguro

Esto ya se trabajó bastante en `ARCHITECTURE.md`, pero como recordatorio de por qué importa:

- El aislamiento entre tenants es una decisión de diseño, no un parche después. Cache, rate limiting y RLS están pensados desde la arquitectura, no agregados al final.
- Rate limiting combinado (IP + usuario + dominio) por diseño, no solo por IP.

## A07: Fallas de autenticación

- Supabase Auth para todas las cuentas de administrador, con MFA (AAL2) obligatorio, no opcional.
- Ninguna ruta de `/api/admin/*` accesible sin sesión verificada.
- No usar ningún header o cookie no firmada como si fuera prueba de autenticación (por ejemplo, nada como `logged_in_hint`).

## A08: Fallas de integridad de software o datos

- Cualquier webhook o callback externo (Turnstile, Vercel, Cloudflare) verifica su firma antes de procesar el payload.
- No confiar en datos que vengan del cliente para decisiones de negocio (por ejemplo, el precio de un plan no se lee del formulario, se resuelve del lado del servidor).

## A09: Fallas de logging y alertas de seguridad

- Registro de auditoría (`audit_log` o tabla equivalente) para toda operación sensible del panel admin: quién, qué, cuándo.
- No alcanza con loggear; tiene que haber alguna forma de alerta ante patrones sospechosos (muchos intentos de login fallidos, muchos registros de dominio en poco tiempo desde la misma cuenta).
- Un 503 de plataforma deja rastro JSON (`postgrest_query_failed`) y, si es esquema incompleto (42703/PGRST204) o se dispara el mismo fallo 3 veces en un minuto, un segundo evento `platform_alert`. El visitante sigue viendo un mensaje genérico. Un 404 no se usa como alerta de migración.
- No hay pager. La señal existe; alguien tiene que mirarla. Kirian o quien tenga acceso al proyecto en Vercel revisa Runtime Logs (filtro Error + búsqueda `platform_alert`) **cada vez que entra al dashboard** y, como mínimo, **una vez por semana**. Un fallo de esquema puede aparecer un martes cualquiera, no el día del release. El checklist de release no sustituye este hábito.
- Retención de Runtime Logs (oficial de Vercel, no es indefinida): Hobby **1 hora**, Pro **1 día**, Enterprise **3 días**; con Observability Plus, Pro/Enterprise **30 días** (ventana de consulta de 14 días seguidos). En Hobby o Pro sin Observability Plus, un `platform_alert` del martes **ya no está** el domingo. El hábito semanal es el piso de responsabilidad; en la práctica hay que mirar al entrar a Vercel, dentro de esa ventana. No hace falta log drain ahora, pero no asumir que el log va a estar cuando lo busques. Fuente: [Runtime Logs](https://vercel.com/docs/logs/runtime).

## A10: Manejo incorrecto de condiciones excepcionales (categoría nueva en 2025)

Esta es la que más se pasa por alto: qué hace el sistema cuando algo falla de forma inesperada.

- Si la resolución de tenant falla (Edge Config no responde, dominio no encontrado), el sistema falla cerrado (muestra error o 404), nunca "abierto" cayendo a un tenant por defecto.
- Los mensajes de error que ve el usuario no exponen detalles internos (rutas de archivos, queries SQL, stack traces). Los detalles van solo al log interno.
- Probar explícitamente qué pasa ante casos límite: un booking con campos faltantes, una imagen corrupta, un dominio que se cae a mitad del proceso de registro (por eso la idempotencia que ya está prevista en la arquitectura).
- En Supabase/PostgREST, `{ error }` no significa “no existe la fila”. El mismo shape cubre tabla o columna ausente (`42703`, `42P01`, `PGRST204`). Tratar `error || !data` como 404 miente: el sistema falló y el log parece éxito. Distinguir por código de error; esquema incompleto es 503.

## Skills de ciberseguridad recomendadas

De la colección pública que revisamos antes, estas tres siguen siendo las relevantes para este proyecto, y cada una cubre partes específicas de esta lista:

- **Web Security:** cubre A01, A05 y A07 directamente (control de acceso, inyección, autenticación).
- **Supply Chain Security:** cubre A03 (auditoría de dependencias, detección de typosquatting, hardening de CI/CD).
- **Cloud Security:** útil para revisar configuración (A02), aunque bastante orientado a Docker/Kubernetes, que no es el caso acá; se aprovecha sobre todo la parte de auditoría de configuración de servicios en la nube, aplicable a Supabase y Vercel.

## Antes de cada release, confirmar

- [ ] RLS activa y probada en todas las tablas con datos de tenant
- [ ] Ningún secreto expuesto al cliente
- [ ] Rate limiting activo en endpoints públicos
- [ ] Headers de seguridad configurados
- [ ] `npm audit` sin vulnerabilidades críticas sin resolver
- [ ] MFA obligatorio en cuentas admin
- [ ] Manejo de errores que no expone información interna
- [ ] Idempotencia en operaciones de alta de dominio
- [ ] En Vercel Runtime Logs, revisar `platform_alert` y `postgrest_query_failed` (en especial `undefined_column` / `undefined_table` / `incomplete_row`). Esto **no reemplaza** la revisión semanal / al entrar al dashboard: un martes sin release también puede romper el esquema.

## Aplicación en este repo

| Control | Dónde |
|---|---|
| Tenant por hostname, no por header de cliente | `src/lib/tenant/from-headers.ts`, `src/proxy.ts` |
| RLS de tenants, analytics, memberships, waitlist | `supabase/migrations/0002_rls.sql`, `0004_dj_waitlist.sql`, `0006_security_hardening.sql` |
| Bookings y `audit_log` con RLS y sin grants a `anon` | `supabase/migrations/0006_security_hardening.sql` |
| Headers CSP / frame / nosniff / HSTS | `next.config.ts` |
| Secretos solo servidor | `.env.example`, `src/lib/env/server.ts` |
| Rate limit IP + host | `src/lib/http/rate-limit.ts`, `src/app/api/waitlist/route.ts` |
| Zod en waitlist | `src/domain/waitlist.ts` |
| SSRF allowlist | `src/lib/http/allowed-url.ts` |
| Errores opacos al cliente | `src/lib/http/errors.ts` |
| PostgREST: error de esquema ≠ fila ausente | `src/infrastructure/supabase/postgrest.ts` |
| Alerta mínima de plataforma | `src/lib/http/log.ts` (`platform_alert`) |
| Formulario público de booking cerrado | `src/app/api/wishlist/route.ts` (404/410) |
| MFA AAL2 para leer `admins` | `supabase/migrations/0002_rls.sql` |
