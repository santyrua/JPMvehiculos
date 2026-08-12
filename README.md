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

El acceso de administrador usa Supabase Auth: entra con el correo y la contraseña
creados en Supabase. Sin las variables de entorno configuradas, el admin no está
disponible.
