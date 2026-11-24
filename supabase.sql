-- Quiénes administran el sitio. El registro público de cuentas está abierto,
-- así que "estar autenticado" ya no significa "ser del negocio": el permiso
-- de escritura depende de esta lista, no del rol.
create table if not exists admins (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now()
);

alter table admins enable row level security;

-- Cada quien puede consultar únicamente su propia fila, para que la interfaz
-- sepa si dibuja el panel. La lista completa no se puede leer por la API y no
-- hay política de escritura: esta tabla solo se toca por SQL.
drop policy if exists "Users can check their own admin row" on admins;
create policy "Users can check their own admin row"
on admins
for select
to authenticated
using (id = (select auth.uid()));

-- Sin los grants que Supabase le da por defecto a toda tabla nueva en public.
-- RLS ya niega la escritura y PostgREST no expone TRUNCATE, pero de esta tabla
-- depende todo el permiso de escritura del sitio: mejor que no cargue permisos
-- que no usa. Queda solo el SELECT que necesita is_admin().
revoke all on table admins from anon;
revoke all on table admins from authenticated;
grant select on table admins to authenticated;

-- Los UUID de las cuentas administradoras NO van en este archivo: el
-- repositorio es público. Se insertan a mano desde el SQL Editor de Supabase,
-- tomándolos de auth.users:
--   insert into admins (id) values ('UUID-DE-LA-CUENTA') on conflict (id) do nothing;

-- security invoker a propósito: la función solo consulta la fila del propio
-- usuario, que es justo lo que permite la política de arriba. Con security
-- definer, Supabase avisa que la función queda llamable por
-- /rest/v1/rpc/is_admin (lints 0028 y 0029), y no hace falta.
-- stable para que al escribirla como (select is_admin()) se evalúe una sola
-- vez por consulta y no fila por fila.
create or replace function public.is_admin()
returns boolean
language sql
security invoker
stable
set search_path = public
as $$
  select exists (select 1 from public.admins where id = auth.uid());
$$;

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

-- Escritura solo para las cuentas que estén en admins. Antes bastaba con estar
-- autenticado; con el registro público abierto eso dejaría que cualquiera que
-- cree una cuenta edite o borre el catálogo entero.
-- Nota: se usa (select is_admin()) en lugar de is_admin() para que la condición
-- se evalúe una sola vez por consulta y no fila por fila (recomendación del
-- linter de Supabase).
drop policy if exists "Authenticated can insert vehicles" on vehicles;
drop policy if exists "Admins can insert vehicles" on vehicles;
create policy "Admins can insert vehicles"
on vehicles
for insert
to authenticated
with check ((select public.is_admin()));

drop policy if exists "Authenticated can update vehicles" on vehicles;
drop policy if exists "Admins can update vehicles" on vehicles;
create policy "Admins can update vehicles"
on vehicles
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Authenticated can delete vehicles" on vehicles;
drop policy if exists "Admins can delete vehicles" on vehicles;
create policy "Admins can delete vehicles"
on vehicles
for delete
to authenticated
using ((select public.is_admin()));

-- Crea un bucket público en Storage llamado: vehicle-photos
-- Luego ejecuta estas políticas para Storage:

-- Tope de tamaño y tipos permitidos, aplicados por el servidor. La compresión
-- del navegador ya deja las fotos en menos de 1 MB, pero eso es código del
-- cliente: quien tenga el token del admin puede llamar a la API de Storage
-- directamente y saltárselo. 10 MB es el doble de la foto más grande que hay.
update storage.buckets
set file_size_limit = 10485760,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'vehicle-photos';

-- IMPORTANTE: el bucket es público, así que las imágenes se sirven por su URL pública
-- sin necesidad de una política SELECT. NO agregues una política de lectura amplia sobre
-- storage.objects: permitiría LISTAR todos los archivos del bucket (aviso de seguridad de
-- Supabase: public_bucket_allows_listing). Por eso aquí solo la eliminamos si existe.
drop policy if exists "Public can read vehicle photos" on storage.objects;

drop policy if exists "Authenticated can upload vehicle photos" on storage.objects;
drop policy if exists "Admins can upload vehicle photos" on storage.objects;
create policy "Admins can upload vehicle photos"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'vehicle-photos' and (select public.is_admin()));

drop policy if exists "Authenticated can update vehicle photos" on storage.objects;
drop policy if exists "Admins can update vehicle photos" on storage.objects;
create policy "Admins can update vehicle photos"
on storage.objects
for update
to authenticated
using (bucket_id = 'vehicle-photos' and (select public.is_admin()))
with check (bucket_id = 'vehicle-photos' and (select public.is_admin()));

drop policy if exists "Authenticated can delete vehicle photos" on storage.objects;
drop policy if exists "Admins can delete vehicle photos" on storage.objects;
create policy "Admins can delete vehicle photos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'vehicle-photos' and (select public.is_admin()));

-- ===========================================================================
-- Apartado público: cada quien se registra, hace su perfil y sube su vehículo.
-- Nada de esto toca la tabla vehicles: el catálogo solo cambia cuando el
-- negocio publica desde su panel.
-- ===========================================================================

-- Perfil de quien se registra. Lo que de verdad sirve para devolver la
-- llamada es el teléfono; el correo ya lo guarda auth.users.
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 80),
  phone text not null check (char_length(trim(phone)) between 7 and 30),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table profiles enable row level security;

drop policy if exists "Users can read their own profile" on profiles;
create policy "Users can read their own profile"
on profiles for select to authenticated
using (id = (select auth.uid()));

-- El negocio necesita el nombre y el teléfono para contactar a quien ofrece
-- el vehículo.
drop policy if exists "Admins can read all profiles" on profiles;
create policy "Admins can read all profiles"
on profiles for select to authenticated
using ((select public.is_admin()));

drop policy if exists "Users can create their own profile" on profiles;
create policy "Users can create their own profile"
on profiles for insert to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
on profiles for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Sin política de delete: el perfil se va con la cuenta.

create table if not exists vehicle_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'publicada', 'descartada')),

  -- Tal como los escribió el dueño. Aquí no se corrige nada.
  type text not null,
  brand text not null check (char_length(brand) <= 40),
  model text not null check (char_length(model) <= 40),
  version text check (char_length(version) <= 60),
  year text not null check (year ~ '^[0-9]{4}$'),
  km text not null check (km ~ '^[0-9]{1,9}$'),
  price_number numeric not null check (price_number >= 0 and price_number <= 100000000000),
  city text not null check (char_length(city) <= 60),
  fuel text not null,
  transmission text not null,
  color text not null check (char_length(color) <= 30),

  -- Estos los pide el formulario público para que al pasar la solicitud al
  -- formulario de publicación no queden huecos. Van nullable porque la moto
  -- no lleva puertas ni cámara de reversa.
  doors text check (doors is null or doors ~ '^[1-9]$'),
  motor text check (motor is null or char_length(motor) <= 30),
  body_type text check (body_type is null or char_length(body_type) <= 40),
  reverse_camera text check (reverse_camera is null or reverse_camera in ('Sí', 'No')),
  plate_last_digit text check (plate_last_digit is null or plate_last_digit ~ '^[0-9]$'),

  comments text check (char_length(comments) <= 1000),

  -- Rutas dentro del bucket request-photos, no URLs públicas.
  photos text[] not null default '{}'
    check (coalesce(array_length(photos, 1), 0) <= 8),

  admin_note text check (char_length(admin_note) <= 500),
  created_at timestamp with time zone default now(),
  reviewed_at timestamp with time zone,
  published_vehicle_id uuid references vehicles(id) on delete set null
);

create index if not exists vehicle_requests_user_id_created_at_idx
  on vehicle_requests (user_id, created_at desc);
create index if not exists vehicle_requests_status_created_at_idx
  on vehicle_requests (status, created_at desc);

alter table vehicle_requests enable row level security;

drop policy if exists "Users can read their own requests" on vehicle_requests;
create policy "Users can read their own requests"
on vehicle_requests for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can read all requests" on vehicle_requests;
create policy "Admins can read all requests"
on vehicle_requests for select to authenticated
using ((select public.is_admin()));

-- Solo puede crear solicitudes a su nombre, y siempre pendientes.
drop policy if exists "Users can create their own requests" on vehicle_requests;
create policy "Users can create their own requests"
on vehicle_requests for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pendiente');

-- Puede corregir la suya mientras siga pendiente. Como el using y el with
-- check exigen 'pendiente', tampoco puede moverle el estado.
drop policy if exists "Users can edit their own pending requests" on vehicle_requests;
create policy "Users can edit their own pending requests"
on vehicle_requests for update to authenticated
using (user_id = (select auth.uid()) and status = 'pendiente')
with check (user_id = (select auth.uid()) and status = 'pendiente');

-- El negocio es el único que aprueba o descarta.
drop policy if exists "Admins can update any request" on vehicle_requests;
create policy "Admins can update any request"
on vehicle_requests for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "Users can delete their own pending requests" on vehicle_requests;
create policy "Users can delete their own pending requests"
on vehicle_requests for delete to authenticated
using (user_id = (select auth.uid()) and status = 'pendiente');

drop policy if exists "Admins can delete any request" on vehicle_requests;
create policy "Admins can delete any request"
on vehicle_requests for delete to authenticated
using ((select public.is_admin()));

-- Bucket PRIVADO, aparte de vehicle-photos: lo que sube el público no se
-- sirve por URL pública hasta que el negocio decida publicarlo. 3 MB es
-- holgado para una foto que el navegador ya comprimió a menos de 1 MB, y
-- solo image/jpeg porque eso es lo único que produce compressImage.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-photos', 'request-photos', false, 3145728, array['image/jpeg'])
on conflict (id) do update
set public = false,
    file_size_limit = 3145728,
    allowed_mime_types = array['image/jpeg'];

-- Cada quien escribe únicamente dentro de su propia carpeta: la primera parte
-- de la ruta tiene que ser su uid. Así una cuenta no puede sobrescribir ni
-- borrar las fotos de otra.
drop policy if exists "Users can upload their own request photos" on storage.objects;
create policy "Users can upload their own request photos"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'request-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can read their own request photos" on storage.objects;
create policy "Users can read their own request photos"
on storage.objects for select to authenticated
using (
  bucket_id = 'request-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Este bucket sí lleva política SELECT, al contrario de vehicle-photos: al ser
-- privado no se puede listar desde fuera, y hace falta para que el negocio
-- pueda firmar URLs y ver las fotos de cada solicitud.
drop policy if exists "Admins can read request photos" on storage.objects;
create policy "Admins can read request photos"
on storage.objects for select to authenticated
using (bucket_id = 'request-photos' and (select public.is_admin()));

drop policy if exists "Users can delete their own request photos" on storage.objects;
create policy "Users can delete their own request photos"
on storage.objects for delete to authenticated
using (
  bucket_id = 'request-photos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Admins can delete request photos" on storage.objects;
create policy "Admins can delete request photos"
on storage.objects for delete to authenticated
using (bucket_id = 'request-photos' and (select public.is_admin()));
