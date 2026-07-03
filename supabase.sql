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

drop policy if exists "Public can read vehicles" on vehicles;
create policy "Public can read vehicles"
on vehicles
for select
using (true);

drop policy if exists "Authenticated can insert vehicles" on vehicles;
create policy "Authenticated can insert vehicles"
on vehicles
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update vehicles" on vehicles;
create policy "Authenticated can update vehicles"
on vehicles
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can delete vehicles" on vehicles;
create policy "Authenticated can delete vehicles"
on vehicles
for delete
to authenticated
using (true);

-- Crea un bucket público en Storage llamado: vehicle-photos
-- Luego ejecuta estas políticas para Storage:

drop policy if exists "Public can read vehicle photos" on storage.objects;
create policy "Public can read vehicle photos"
on storage.objects
for select
using (bucket_id = 'vehicle-photos');

drop policy if exists "Authenticated can upload vehicle photos" on storage.objects;
create policy "Authenticated can upload vehicle photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'vehicle-photos');

drop policy if exists "Authenticated can update vehicle photos" on storage.objects;
create policy "Authenticated can update vehicle photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'vehicle-photos')
with check (bucket_id = 'vehicle-photos');

drop policy if exists "Authenticated can delete vehicle photos" on storage.objects;
create policy "Authenticated can delete vehicle photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'vehicle-photos');
