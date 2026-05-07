# JPM Vehículos Web

Proyecto listo para Vercel con React + Vite + Supabase.

## Archivos importantes

- `src/App.jsx`: código principal de la página.
- `src/styles.css`: diseño de la página.
- `supabase.sql`: tabla y políticas para Supabase.
- `.env.example`: ejemplo de variables ambientales.

## Probar localmente

```bash
npm install
npm run dev
```

## Variables en Vercel

Agrega estas variables en Vercel:

```txt
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_PUBLISHABLE_KEY
```

## Admin

Para abrir el admin, toca 7 veces el footer:

```txt
© 2026 JPM Vehículos. Compra y venta de vehículos.
```

Si Supabase está conectado, entra con el correo y contraseña creados en Supabase Auth.
Si no está conectado, usa la contraseña temporal del código.
