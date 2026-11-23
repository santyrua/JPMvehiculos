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
