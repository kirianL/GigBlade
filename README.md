# GigBlade

Plataforma multitenant para sitios de DJs. Un solo despliegue de Next.js resuelve tenants por hostname.

Consulta `ARCHITECTURE.md` antes de cambiar código. En esta fase no hay UI ni persistencia de bookings.

```bash
npm install
npm test
npm run dev
```

`getApp()` lee `APP_RUNTIME`. Con `memory` usa fakes. El día de conectar, en `.env.local` se pone `APP_RUNTIME=real`.

## Vercel

Importar el repo `kirianL/GigBlade` en [Vercel](https://vercel.com/new). Root Directory vacío (la raíz). Framework: Next.js.

En el primer deploy deja `APP_RUNTIME=memory`. La waitlist no persistirá hasta `APP_RUNTIME=real` y las claves de `.env.example`.

En GitHub: Settings → Pages → desactivar Pages (o Source: None) para no seguir sirviendo el export estático.
