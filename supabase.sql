create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  brand text not null,
  model text not null,
  version text not null,
  year text not null,
  price_number numeric not null,
  km text not null,
  fuel text not null,
  city text not null,
  color text not null,
  doors text not null,
  transmission text not null,
  motor text not null,
  body_type text not null,
  reverse_camera text not null,
  plate_last_digit text not null,
  description text not null,
  status text not null default 'Disponible',
  image text not null,
  photos text[] not null default '{}',
  created_at timestamp with time zone default now()
);

alter table vehicles enable row level security;

-- Lectura pública del catálogo.
drop policy if exists "Public can read vehicles" on vehicles;
create policy "Public can read vehicles"
on vehicles
for select
using (true);

-- Escritura solo para usuarios autenticados (admin).
-- Nota: se usa (select auth.role()) en lugar de auth.role() para que la condición
-- se evalúe una sola vez por consulta y no fila por fila (recomendación del linter de Supabase).
drop policy if exists "Authenticated can insert vehicles" on vehicles;
create policy "Authenticated can insert vehicles"
on vehicles
for insert
to authenticated
with check ((select auth.role()) = 'authenticated');

drop policy if exists "Authenticated can update vehicles" on vehicles;
create policy "Authenticated can update vehicles"
on vehicles
for update
to authenticated
using ((select auth.role()) = 'authenticated')
with check ((select auth.role()) = 'authenticated');

drop policy if exists "Authenticated can delete vehicles" on vehicles;
create policy "Authenticated can delete vehicles"
on vehicles
for delete
to authenticated
using ((select auth.role()) = 'authenticated');

-- Crea un bucket público en Storage llamado: vehicle-photos
-- Luego ejecuta estas políticas para Storage:

-- IMPORTANTE: el bucket es público, así que las imágenes se sirven por su URL pública
-- sin necesidad de una política SELECT. NO agregues una política de lectura amplia sobre
-- storage.objects: permitiría LISTAR todos los archivos del bucket (aviso de seguridad de
-- Supabase: public_bucket_allows_listing). Por eso aquí solo la eliminamos si existe.
drop policy if exists "Public can read vehicle photos" on storage.objects;

drop policy if exists "Authenticated can upload vehicle photos" on storage.objects;
create policy "Authenticated can upload vehicle photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'vehicle-photos' and (select auth.role()) = 'authenticated');

drop policy if exists "Authenticated can update vehicle photos" on storage.objects;
create policy "Authenticated can update vehicle photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'vehicle-photos' and (select auth.role()) = 'authenticated')
with check (bucket_id = 'vehicle-photos' and (select auth.role()) = 'authenticated');

drop policy if exists "Authenticated can delete vehicle photos" on storage.objects;
create policy "Authenticated can delete vehicle photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'vehicle-photos' and (select auth.role()) = 'authenticated');
