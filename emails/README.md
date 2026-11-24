# Correos de Supabase Auth

Las plantillas de los correos que reciben los usuarios al registrarse y al
pedir una contraseña nueva. **Supabase no las lee de aquí**: viven dentro del
panel, y estos archivos son la copia de referencia para no perderlas y poder
ver su historial.

Al cambiar una, hay que pegarla también en el panel. Y al revés: si alguien
la edita en el panel, hay que traerla aquí.

## Dónde se pegan

Panel de Supabase → **Authentication → Emails**

| Archivo | Plantilla | Asunto |
|---|---|---|
| `confirmar-registro.html` | Confirm signup | Ya casi · Confirma tu correo en JPM Vehículos |
| `recuperar-contrasena.html` | Reset Password | Tu contraseña nueva de JPM Vehículos |

El asunto se escribe en el campo de arriba de cada plantilla, aparte del HTML.

## Cosas que no hay que romper

- **`{{ .ConfirmationURL }}`** es lo que Supabase reemplaza por el enlace
  real. Si se cambia, se envuelve o se le mete un acortador, el correo llega
  con un enlace muerto.
- **Estilos en línea y tablas.** Gmail y Outlook descartan las hojas de
  estilo y se atragantan con `flex` y `grid`. Se ve anticuado, pero es lo que
  llega entero a todos lados.
- **El logo se sirve desde el sitio** (`https://jpmvehiculos.com/email-logo.jpg`),
  porque un correo no puede llevar archivos locales. Lo genera
  `scripts/generate-email-logo.mjs` recortando `public/jpm-logo.jpeg.jpg`, y
  tiene que seguir desplegado para que se vea.
- **El `alt` del logo importa de verdad.** Gmail bloquea las imágenes por
  defecto con remitentes nuevos, así que mucha gente va a ver ese texto en
  lugar del logo. Está en ámbar sobre el fondo negro para que se lea bien.
- El bloque oculto del principio es el adelanto que Gmail muestra en la
  bandeja, junto al asunto.

## Quién los envía

Salen por **Resend** desde `noreply@jpmvehiculos.com`, no por el servicio
interno de Supabase (que está limitado a 2 correos por hora). La
configuración está en Authentication → SMTP, y los registros DNS que lo
autorizan (DKIM, SPF, DMARC) están en la zona de Vercel.
