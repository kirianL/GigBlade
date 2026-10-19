# GigBlade

Plataforma multitenant para sitios de DJs. Un solo despliegue de Next.js resuelve tenants por hostname.

```bash
npm install
npm test
npm run dev
```

`getApp()` lee `APP_RUNTIME`. Con `memory` usa fakes locales. En Vercel, cuando están configuradas `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (o `APP_RUNTIME=real`), corre contra Supabase.

## Vercel

Importar el repo `kirianL/GigBlade` en [Vercel](https://vercel.com/new). Root Directory vacío (la raíz). Framework: Next.js.

En producción definir las variables de `.env.example`: Supabase, Turnstile, `GIGBLADE_PANEL_PASSWORD` y `NEXT_PUBLIC_DASHBOARD_URL`. `RESEND_API_KEY` y `PANEL_MAIL_FROM` quedan para cuando se active el correo; sin ellas la contraseña del DJ se muestra una sola vez en el panel.

En GitHub: Settings → Pages → desactivar Pages (o Source: None) para no seguir sirviendo el export estático.
