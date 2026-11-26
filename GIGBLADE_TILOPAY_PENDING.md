# GIGBLADE — Información pendiente de confirmación para Tilopay

Este archivo lista datos que **no pudieron verificarse** en el repositorio, en la interfaz pública o en la documentación del proyecto, o que requieren confirmación documental. No se han inventado valores para completarlos.

Fecha de preparación: 25 de noviembre de 2026. Actualizado tras la confirmación del solicitante sobre el importe del pago de la reunión.

---

## 1. Identidad legal y fiscal

- Razón social o nombre registrado (el repositorio usa «GigBlades» en la landing y «GIGBLADE» en el nombre del proyecto).
- Cédula jurídica / RUC de Costa Rica.
- Dirección fiscal y dirección comercial física.
- Nombre del representante legal y del responsable de cumplimiento.
- Registro de la marca, si existe.

Fuentes revisadas: `README.md`, `ui/landing/lib/seo.ts` (`ORG_NAME = "GigBlades"`, `sameAs: []`), `ui/landing/lib/termsContent.ts` (solo «GigBlades, Costa Rica» y `hola@gigblade.com`).

## 2. Configuración real del cobro en Tilopay

- **Confirmado por el solicitante:** el cargo cobrado en la reserva de la reunión de bienvenida es de **US$ 120**, y corresponde al pago inicial publicado para dejar la página lista. No es un cargo distinto ni un anticipo de la mensualidad.
- El valor por defecto del código se alineó a **120** en USD/CRC (`src/infrastructure/tilopay/client.ts:19,51-62`) y puede sobrescribirse por variables de entorno. Ya no existe el valor 10 en el código.
- En el despliegue revisado, `GET /api/waitlist` devolvió `payment.required: false`, porque las credenciales de Tilopay aún no están configuradas. El paso de pago no aparece mientras tanto, lo cual es coherente con la aprobación pendiente.
- Pendiente de evidencia documental: captura o exportación de la configuración de producción (`TILOPAY_MEETING_AMOUNT`, `TILOPAY_MEETING_CURRENCY`) donde conste el importe de US$ 120.
- Si la cuenta de Tilopay está en modo **producción (live)** o **sandbox/pruebas**. El cliente consulta `/api/v1/login`, `/api/v1/loginSdk` y `/api/v1/consult` en `https://app.tilopay.com`, pero el entorno devuelto por la transacción no está documentado ni se observó en una operación real.
- Credenciales y `key` de Tilopay: deliberadamente no se incluyen en el expediente.

## 3. Conciliación de precios

| Fuente | Cifra | Concepto | Estado |
|---|---|---|---|
| Landing y `/pricing` (`ui/landing/lib/plan-items.ts`, `faq-items.ts`, `constant.tsx`) | US$ 120 una vez + US$ 30/mes | Página, panel, hosting y seguridad; dominio aparte | Oferta publicada. US$ 120 confirmado como cargo cobrado; US$ 30/mes sin cobro recurrente integrado |
| Confirmación del solicitante | US$ 120 | Pago de la reserva de reunión / pago inicial | Vigente |
| `docs/reporte-avance-15-dias.md:23` | US$ 65/mes | Definición del día 1 del plan | Posiblemente obsoleta; no declarar |
| `src/infrastructure/tilopay/client.ts:19` | 120 (USD/CRC configurable) | Valor por defecto del código | Alineado al precio confirmado; sobrescribible por entorno |

La facturación recurrente de la mensualidad aparece explícitamente **fuera de alcance** en `docs/reporte-avance-15-dias.md:7,333,342,348`. Si Tilopay solicita el detalle del cargo, declarar **un único pago inicial de US$ 120** y el dominio como concepto adicional comprado por el cliente.

## 4. Comprobantes e historial de transacciones

- No existe evidencia de transacciones reales, facturas, recibos, notas de crédito ni libros contables en el repositorio.
- No se han generado documentos de este tipo para el expediente.
- Si Tilopay requiere historial de ventas o comprobantes, deben aportarse directamente desde el sistema financiero del solicitante.

## 5. Clientes y testimonios

- `ui/landing/app/constant.tsx:1366` contiene el comentario literal: `// TODO: replace placeholder stats/quotes with real customer numbers.`
- Los bloques de «historias de clientes» usan nombres («Nox», «DJ Marco», «Luna», «Residente») y logotipos de marcas de terceros (Mintlify, Firecrawl, Browser use, T3) como recursos de plantilla.
- Por esa razón **se excluyeron todas las citas, cifras y testimonios** del expediente. Si se desea presentar casos reales, enviar autorización por escrito, nombre autorizado y métricas verificables.

## 6. Capturas que requieren autenticación

Las siguientes pantallas existen en el código pero no se incluyen como captura en el expediente. No se intentó eludir ningún control de acceso:

- Panel de plataforma: resumen, DJs, contrataciones, lista de espera, referidos, finanzas, dominios, estado de páginas y plan (`src/panel/PanelSidebar.tsx:96-115`).
- Estudio del DJ: «Mi página», «Contenido», «Dominio propio», «Contrataciones» y «Visitas» (`src/panel/PanelSidebar.tsx:117-126`).
- Perfil público real de un DJ alojado en su propio hostname.

Se capturó únicamente la pantalla pública de inicio de sesión (`https://app.gigblades.com/sign-in`). El acceso al panel sí se verificó en un entorno local con la cuenta de prueba definida en el propio código (`src/lib/composition/memory-app.ts:97-100`): `GET /sign-in 200`, `POST /api/panel/login 200` y redirección a `/overview 200`. El bloqueo previo, un error 500 causado por la clase `bg-[url('/images/footer/footerbg.svg')]` en `ui/landing/components/footer.tsx:65`, quedó corregido. La captura de la sesión autenticada se descartó porque mostraba datos operativos reales del panel. Para incluir evidencia visual de esas pantallas, proporcione capturas tomadas desde una sesión legítima y sin datos personales.

## 7. Presencia digital adicional

- `sameAs` en `ui/landing/lib/seo.ts:9` está vacío: no hay redes sociales oficiales declaradas en el código.
- No se encontraron canales de WhatsApp comerciales, ni número de teléfono de atención, más allá del enlace dinámico generado a partir del teléfono que cada DJ carga en su página (`src/domain/waitlist.ts:300-328`).
- No hay blog, documentación pública ni centro de ayuda vinculados.

Confirmar dominio canónico del panel: la landing enlaza `https://app.gigblades.com/sign-in`, mientras que `.env.production.example:28` define `https://dashboard.gigblade.com`.

## 8. Textos legales y política de reembolsos

- Los términos vigentes en el código están redactados en inglés (`ui/landing/lib/termsContent.ts`), con fecha de efectividad «September 10, 2026».
- La cláusula 5 establece que los cargos no son reembolsables salvo disposición legal, y que los precios pueden cambiar con 30 días de aviso.
- Confirmar si existe versión en español, política de reembolsos operativa y si el cobro de la reserva de reunión es reembolsable en caso de cancelación.

## 9. Estado operativo de los módulos de infraestructura

La documentación describe la alta de dominios con Cloudflare Registrar y Vercel Domains como operativa, pero `.env.production.example:30-39` deja los tokens correspondientes vacíos y `.env.example:24-27` los marca como configurables. Confirmar qué proveedores están efectivamente contratados y activos antes de declarar la provisión de dominios como servicio incluido.

## 10. Datos de contacto verificados

- Correo: `hola@gigblade.com` (términos y configuración del panel).
- País: Costa Rica (términos y restricción `country !== "CR"` en `src/domain/waitlist.ts:276-278`).
- No hay teléfono comercial ni dirección postal verificables.
