import { FormInput, FormSelect } from "./ui.jsx";

export default function AdminPanel({
  hasSupabase,
  editingIndex,
  cancelEdit,
  adminError,
  adminWarnings,
  dismissWarnings,
  saveAnyway,
  adminForm,
  updateAdminField,
  handleAdminPhotos,
  adminPhotos,
  removeAdminPhoto,
  saveVehicle,
  isSaving,
  bodyTypeOptions,
  adminVehicleSearch,
  setAdminVehicleSearch,
  adminFilteredVehicles,
  vehiclesCount,
  editVehicle,
  deleteVehicle,
  closeAdmin,
}) {
  return (
    <section id="admin" className="bg-white py-20 text-zinc-950">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">Panel admin</p>
          <h2 className="text-4xl font-black tracking-tight md:text-5xl">{editingIndex !== null ? "Editar publicación" : "Agregar vehículos al catálogo"}</h2>
          <p className="mt-5 text-lg leading-8 text-zinc-600">Desde aquí puedes cargar o editar un vehículo con sus fotos y datos.</p>
          {!hasSupabase && <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">Supabase no está conectado en esta vista. Revisa las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en Vercel.</p>}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={saveVehicle} className="rounded-[2rem] bg-zinc-100 p-6 shadow-xl">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <h3 className="text-2xl font-black">{editingIndex !== null ? "Editando vehículo" : "Datos del vehículo"}</h3>
              {editingIndex !== null && <button type="button" onClick={cancelEdit} className="rounded-full border border-black/20 bg-white px-4 py-2 text-sm font-bold text-zinc-950">Cancelar edición</button>}
            </div>

            {adminError && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {adminError}
              </div>
            )}

            {adminWarnings?.length > 0 && (
              <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-amber-800">Revisa antes de subir</p>

                <ul className="mt-3 space-y-3">
                  {adminWarnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-900">
                      <p className="font-bold">{warning.titulo}</p>
                      <p className="text-amber-800">{warning.detalle}</p>
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs text-amber-700">
                  Si el dato viene así de la tarjeta de propiedad, guárdalo tal cual.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={dismissWarnings}
                    className="rounded-full bg-zinc-950 px-5 py-2 text-sm font-bold text-white"
                  >
                    Corregir
                  </button>

                  <button
                    type="button"
                    onClick={saveAnyway}
                    disabled={isSaving}
                    className="rounded-full border border-amber-400 bg-white px-5 py-2 text-sm font-bold text-amber-900 disabled:opacity-60"
                  >
                    Guardar así
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                value={adminForm.name}
                onChange={(value) => updateAdminField("name", value)}
                placeholder="Nombre completo del vehículo"
              />

              <FormSelect
                value={adminForm.type}
                onChange={(value) => updateAdminField("type", value)}
              >
                <option>Carro</option>
                <option>Camioneta</option>
                <option>Moto</option>
              </FormSelect>

              <FormSelect
                value={adminForm.status}
                onChange={(value) => updateAdminField("status", value)}
              >
                <option>Disponible</option>
                <option>Vendido</option>
              </FormSelect>

              <FormInput
                value={adminForm.brand}
                onChange={(value) => updateAdminField("brand", value)}
                placeholder="Marca"
              />

              <FormInput
                value={adminForm.model}
                onChange={(value) => updateAdminField("model", value)}
                placeholder="Modelo"
              />

              <FormInput
                value={adminForm.year}
                onChange={(value) => updateAdminField("year", value)}
                placeholder="Año"
              />

              <FormInput
                value={adminForm.version}
                onChange={(value) => updateAdminField("version", value)}
                placeholder="Versión"
              />

              <FormInput
                value={adminForm.price}
                onChange={(value) => updateAdminField("price", value.replace(/[^0-9]/g, ""))}
                placeholder="Precio sin puntos"
              />

              <FormInput
                value={adminForm.km}
                onChange={(value) => updateAdminField("km", value.replace(/[^0-9]/g, ""))}
                placeholder="Kilómetros sin puntos"
              />

              <FormInput
                value={adminForm.city}
                onChange={(value) => updateAdminField("city", value)}
                placeholder="Ciudad"
              />

              <FormInput
                value={adminForm.color}
                onChange={(value) => updateAdminField("color", value)}
                placeholder="Color"
              />

              <FormSelect
                value={adminForm.fuel}
                onChange={(value) => updateAdminField("fuel", value)}
              >
                <option>Gasolina</option>
                <option>Diésel</option>
                <option>Híbrido</option>
                <option>Eléctrico</option>
              </FormSelect>

              <FormSelect
                value={adminForm.transmission}
                onChange={(value) => updateAdminField("transmission", value)}
              >
                <option>Automática</option>
                <option>Mecánica</option>
                <option>Por confirmar</option>
              </FormSelect>

              <FormInput
                value={adminForm.motor}
                onChange={(value) => updateAdminField("motor", value)}
                placeholder="Motor"
              />

              <FormInput
                value={adminForm.doors}
                onChange={(value) => updateAdminField("doors", value)}
                placeholder="Puertas"
              />

              {bodyTypeOptions ? (
                <FormSelect
                  value={adminForm.bodyType}
                  onChange={(value) => updateAdminField("bodyType", value)}
                >
                  <option value="">Tipo de carrocería</option>

                  {/* Los vehículos cargados antes traen valores que no están en
                      la lista ("Sedan" sin tilde, "STATION WAGON", "Carga"...).
                      Se muestran como opción para no borrarlos al editar. */}
                  {adminForm.bodyType && !bodyTypeOptions.includes(adminForm.bodyType) && (
                    <option value={adminForm.bodyType}>{adminForm.bodyType} (actual)</option>
                  )}

                  {bodyTypeOptions.map((bodyType) => (
                    <option key={bodyType} value={bodyType}>{bodyType}</option>
                  ))}
                </FormSelect>
              ) : (
                <FormInput
                  value={adminForm.bodyType}
                  onChange={(value) => updateAdminField("bodyType", value)}
                  placeholder="Tipo de carrocería"
                />
              )}

              <FormInput
                value={adminForm.plateLastDigit}
                onChange={(value) => updateAdminField("plateLastDigit", value)}
                placeholder="Último dígito de la placa"
              />
            </div>

            <textarea
              value={adminForm.description}
              onChange={(event) => updateAdminField("description", event.target.value)}
              spellCheck="true"
              lang="es"
              className="mt-4 min-h-28 w-full rounded-2xl bg-white px-4 py-3 outline-none"
              placeholder="Descripción del vehículo"
            />

            <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-white p-5">
              <label className="mb-3 block font-bold">Fotos del vehículo</label>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdminPhotos}
                className="w-full text-sm"
              />

              <p className="mt-2 text-sm text-zinc-500">
                Puedes seleccionar varias fotos. La primera será la principal.
              </p>

              {adminPhotos.length > 0 && (
                <div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-zinc-700">
                      {adminPhotos.length} foto{adminPhotos.length === 1 ? "" : "s"} cargada
                      {adminPhotos.length === 1 ? "" : "s"}
                    </p>

                    <span className="text-xs font-semibold text-zinc-500">
                      Elimina una foto con la X
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {adminPhotos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.url || photo}
                          alt="Vista previa"
                          className="h-24 w-full rounded-2xl object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeAdminPhoto(index)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white shadow-lg hover:bg-red-700"
                          aria-label="Eliminar foto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-5 h-12 w-full rounded-full bg-zinc-950 font-bold text-white disabled:opacity-60"
            >
              {isSaving
                ? "Guardando..."
                : editingIndex !== null
                  ? "Actualizar publicación"
                  : "Guardar vehículo"}
            </button>
          </form>

          <div className="rounded-[2rem] bg-zinc-950 p-6 text-white shadow-xl">
            <h3 className="mb-4 text-2xl font-black">Vehículos cargados</h3>

            <div className="mb-4 rounded-2xl bg-white px-4 py-3 text-zinc-950">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500">🔎</span>

                <input
                  value={adminVehicleSearch}
                  onChange={(event) => setAdminVehicleSearch(event.target.value)}
                  className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-zinc-500"
                  placeholder="Buscar por marca, modelo, año, precio, ciudad..."
                />
              </div>
            </div>

            <p className="mb-4 text-sm text-zinc-400">
              {adminFilteredVehicles.length} de {vehiclesCount} vehículo
              {vehiclesCount === 1 ? "" : "s"}
            </p>

            <div className="max-h-[650px] space-y-3 overflow-y-auto pr-2">
              {adminFilteredVehicles.map(({ vehicle, index }) => (
                <div
                  key={(vehicle.dbId || vehicle.name) + index}
                  className="rounded-2xl bg-white/10 p-4"
                >
                  <div className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-zinc-950">
                    {vehicle.status || "Disponible"}
                  </div>

                  <p className="font-bold">{vehicle.name}</p>
                  <p className="text-sm text-zinc-400">
                    {vehicle.price} · {vehicle.year}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => editVehicle(vehicle, index)}
                      className="rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-zinc-950"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() => deleteVehicle(vehicle, index)}
                      className="rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-950"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {adminFilteredVehicles.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-sm text-zinc-400">
                  No hay vehículos que coincidan con esa búsqueda.
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={closeAdmin}
          className="mt-8 rounded-full bg-zinc-950 px-6 py-3 font-bold text-white"
        >
          Cerrar panel admin
        </button>
      </div>
    </section>
  );
}
