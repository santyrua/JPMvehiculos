import { useEffect, useState } from "react";

// La cola de lo que sube el público, dentro del panel del admin.
//
// Nada de aquí entra al catálogo por sí solo: "Pasar al formulario" precarga el
// formulario de publicación de arriba, y el vehículo solo existe cuando el
// negocio lo guarda desde ahí. Así los datos pasan por la validación y por el
// aviso de erratas que ya tiene el panel.

const ETIQUETAS = {
  pendiente: { texto: "Pendiente", clase: "bg-amber-300 text-zinc-950" },
  publicada: { texto: "Publicada", clase: "bg-emerald-400 text-zinc-950" },
  descartada: { texto: "Descartada", clase: "bg-zinc-400 text-zinc-950" },
};

function fechaLegible(valor) {
  if (!valor) return "";
  try {
    return new Date(valor).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch (error) {
    return "";
  }
}

function pesos(valor) {
  return Number(valor || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  });
}

export default function SolicitudesAdmin({ supabase, onPrefill, recargar = 0 }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [fotos, setFotos] = useState({});
  const [filtro, setFiltro] = useState("pendiente");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState("");

  useEffect(() => {
    cargar();
  }, [filtro, recargar]);

  async function cargar() {
    if (!supabase) {
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    let consulta = supabase
      .from("vehicle_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (filtro !== "todas") consulta = consulta.eq("status", filtro);

    const { data, error: fallo } = await consulta;
    setCargando(false);

    if (fallo) {
      console.error(fallo);
      setError("No se pudieron cargar las solicitudes. Revisa las políticas de vehicle_requests.");
      return;
    }

    const filas = data || [];
    setSolicitudes(filas);

    if (filas.length === 0) {
      setPerfiles({});
      setFotos({});
      return;
    }

    // El nombre y el teléfono viven en profiles. No hay relación declarada
    // entre vehicle_requests y profiles (user_id apunta a auth.users), así que
    // se piden aparte en una sola consulta.
    const ids = [...new Set(filas.map((fila) => fila.user_id))];
    const { data: filasPerfil, error: falloPerfil } = await supabase
      .from("profiles")
      .select("id, name, phone")
      .in("id", ids);

    if (falloPerfil) console.error(falloPerfil);

    const mapaPerfiles = {};
    (filasPerfil || []).forEach((perfil) => {
      mapaPerfiles[perfil.id] = perfil;
    });
    setPerfiles(mapaPerfiles);

    // El bucket es privado: cada foto necesita una URL firmada.
    const rutas = filas.flatMap((fila) => fila.photos || []);
    if (rutas.length === 0) {
      setFotos({});
      return;
    }

    const { data: firmadas, error: falloFirma } = await supabase.storage
      .from("request-photos")
      .createSignedUrls(rutas, 3600);

    if (falloFirma) {
      console.error(falloFirma);
      return;
    }

    const mapaFotos = {};
    (firmadas || []).forEach((item) => {
      if (item.path && item.signedUrl) mapaFotos[item.path] = item.signedUrl;
    });
    setFotos(mapaFotos);
  }

  async function descartar(solicitud) {
    const nota = window.prompt(
      "¿Por qué no continúa? Lo que escribas lo verá el dueño en su cuenta (puedes dejarlo vacío).",
      ""
    );
    // prompt devuelve null si cancelaron.
    if (nota === null) return;

    setOcupado(solicitud.id);

    const { error: fallo } = await supabase
      .from("vehicle_requests")
      .update({
        status: "descartada",
        admin_note: nota.trim() ? nota.trim().slice(0, 500) : null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", solicitud.id);

    setOcupado("");

    if (fallo) {
      console.error(fallo);
      setError("No se pudo descartar. Intenta de nuevo.");
      return;
    }

    await cargar();
  }

  async function eliminar(solicitud) {
    if (!window.confirm("¿Eliminar esta solicitud y sus fotos? No se puede deshacer.")) return;

    setOcupado(solicitud.id);

    // Las fotos primero: borrada la fila ya no hay de dónde sacar sus rutas.
    if (solicitud.photos?.length) {
      const { error: falloFotos } = await supabase.storage
        .from("request-photos")
        .remove(solicitud.photos);
      if (falloFotos) console.error(falloFotos);
    }

    const { error: fallo } = await supabase
      .from("vehicle_requests")
      .delete()
      .eq("id", solicitud.id);

    setOcupado("");

    if (fallo) {
      console.error(fallo);
      setError("No se pudo eliminar. Intenta de nuevo.");
      return;
    }

    await cargar();
  }

  async function pasarAlFormulario(solicitud) {
    setOcupado(solicitud.id);
    setError("");
    try {
      await onPrefill(solicitud);
    } catch (fallo) {
      console.error(fallo);
      setError("No se pudieron traer las fotos de la solicitud. Intenta de nuevo.");
    } finally {
      setOcupado("");
    }
  }

  const pendientes = solicitudes.filter((fila) => fila.status === "pendiente").length;

  return (
    <section id="solicitudes" className="bg-zinc-100 py-16 text-zinc-950">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">
              Panel admin
            </p>
            <h2 className="text-4xl font-black tracking-tight">Vehículos que subió el público</h2>
            <p className="mt-3 max-w-2xl text-zinc-600">
              Los datos están tal como los escribió el dueño: revísalos contra la tarjeta de
              propiedad antes de publicar. Al pasar uno al formulario, las fotos se traen con él.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[
              { clave: "pendiente", texto: "Pendientes" },
              { clave: "publicada", texto: "Publicadas" },
              { clave: "descartada", texto: "Descartadas" },
              { clave: "todas", texto: "Todas" },
            ].map((opcion) => (
              <button
                key={opcion.clave}
                type="button"
                onClick={() => setFiltro(opcion.clave)}
                className={
                  "rounded-full px-4 py-2 text-sm font-bold transition " +
                  (filtro === opcion.clave
                    ? "bg-zinc-950 text-white"
                    : "bg-white text-zinc-950 hover:bg-zinc-200")
                }
              >
                {opcion.texto}
              </button>
            ))}
          </div>
        </div>

        {filtro !== "pendiente" && pendientes > 0 && (
          <p className="mb-5 rounded-2xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
            Tienes {pendientes} sin revisar.
          </p>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {cargando && <p className="text-zinc-600">Cargando...</p>}

        {!cargando && solicitudes.length === 0 && (
          <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600">
            {filtro === "pendiente"
              ? "No hay vehículos del público esperando revisión."
              : "No hay nada con ese filtro."}
          </div>
        )}

        <div className="space-y-5">
          {solicitudes.map((solicitud) => {
            const perfil = perfiles[solicitud.user_id];
            const etiqueta = ETIQUETAS[solicitud.status] || ETIQUETAS.pendiente;
            const trabajando = ocupado === solicitud.id;

            return (
              <div key={solicitud.id} className="rounded-[2rem] bg-white p-6 shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span
                      className={
                        "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] " +
                        etiqueta.clase
                      }
                    >
                      {etiqueta.texto}
                    </span>

                    <h3 className="mt-3 text-2xl font-black">
                      {solicitud.brand} {solicitud.model} {solicitud.version || ""}
                    </h3>

                    <p className="text-zinc-600">
                      {solicitud.type} · {solicitud.year} ·{" "}
                      {Number(solicitud.km).toLocaleString("es-CO")} km · {solicitud.color}
                    </p>
                    <p className="mt-1 text-xl font-black text-amber-600">
                      {pesos(solicitud.price_number)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-100 p-4 text-sm">
                    <p className="font-black uppercase tracking-[0.18em] text-zinc-500">Contacto</p>
                    <p className="mt-2 font-bold">{perfil?.name || "Sin perfil guardado"}</p>
                    {perfil?.phone && (
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span>{perfil.phone}</span>
                        <a
                          href={`https://wa.me/57${String(perfil.phone).replace(/[^0-9]/g, "").slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white"
                        >
                          WhatsApp
                        </a>
                      </div>
                    )}
                    <p className="mt-2 text-xs text-zinc-500">
                      Enviado el {fechaLegible(solicitud.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-x-6 gap-y-2 text-sm md:grid-cols-2">
                  <p>
                    <span className="font-bold">Ciudad: </span>
                    {solicitud.city}
                  </p>
                  <p>
                    <span className="font-bold">Combustible: </span>
                    {solicitud.fuel} · <span className="font-bold">Transmisión: </span>
                    {solicitud.transmission}
                  </p>
                  <p>
                    <span className="font-bold">Motor: </span>
                    {solicitud.motor || "—"} · <span className="font-bold">Carrocería: </span>
                    {solicitud.body_type || "—"}
                  </p>
                  <p>
                    <span className="font-bold">Puertas: </span>
                    {solicitud.doors || "—"} · <span className="font-bold">Cámara de reversa: </span>
                    {solicitud.reverse_camera || "—"} ·{" "}
                    <span className="font-bold">Último dígito: </span>
                    {solicitud.plate_last_digit || "—"}
                  </p>
                </div>

                {solicitud.comments && (
                  <p className="mt-4 rounded-2xl bg-zinc-100 px-4 py-3 text-sm leading-6 text-zinc-700">
                    <span className="font-bold">Dice el dueño: </span>
                    {solicitud.comments}
                  </p>
                )}

                {solicitud.photos?.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-8">
                    {solicitud.photos.map((ruta, indice) => {
                      const url = fotos[ruta];
                      if (!url) {
                        return (
                          <div
                            key={ruta}
                            className="flex h-20 items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-400"
                          >
                            ...
                          </div>
                        );
                      }
                      return (
                        <a key={ruta} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={`Foto ${indice + 1} de ${solicitud.brand} ${solicitud.model}`}
                            className="h-20 w-full rounded-xl object-cover transition hover:opacity-80"
                          />
                        </a>
                      );
                    })}
                  </div>
                )}

                {solicitud.admin_note && (
                  <p className="mt-4 rounded-2xl bg-zinc-950 px-4 py-3 text-sm text-white">
                    <span className="font-bold">Tu nota: </span>
                    {solicitud.admin_note}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  {solicitud.status === "pendiente" && (
                    <button
                      type="button"
                      disabled={trabajando}
                      onClick={() => pasarAlFormulario(solicitud)}
                      className="rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {trabajando ? "Trayendo las fotos..." : "Pasar al formulario"}
                    </button>
                  )}

                  {solicitud.status === "pendiente" && (
                    <button
                      type="button"
                      disabled={trabajando}
                      onClick={() => descartar(solicitud)}
                      className="rounded-full border border-black/20 bg-white px-5 py-2.5 text-sm font-bold text-zinc-950 transition hover:bg-zinc-100 disabled:opacity-60"
                    >
                      No continúa
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={trabajando}
                    onClick={() => eliminar(solicitud)}
                    className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
