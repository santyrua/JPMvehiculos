import { useEffect, useRef, useState } from "react";
import { compressImage } from "./imageCompression.js";
import {
  VEHICLE_TYPES,
  FUELS,
  TRANSMISSIONS,
  bodyTypesByVehicleType,
} from "./vehicleOptions.js";

// El área de quien ya entró: sus datos, el formulario para subir un vehículo y
// el estado de lo que ya mandó.
//
// Nada de esto escribe en vehicles. Lo que se sube queda en vehicle_requests
// con estado 'pendiente' y las fotos en el bucket privado request-photos, bajo
// una carpeta propia por usuario. Las políticas RLS son las que de verdad
// limitan cada cosa; lo de aquí es solo la interfaz.

const MAX_FOTOS = 8;

const formularioVacio = {
  type: "Carro",
  brand: "",
  model: "",
  version: "",
  year: "",
  km: "",
  price: "",
  city: "Barranquilla",
  fuel: "Gasolina",
  transmission: "Automática",
  color: "",
  doors: "5",
  motor: "",
  bodyType: "",
  reverseCamera: "Sí",
  plateLastDigit: "",
  comments: "",
};

const ETIQUETAS_ESTADO = {
  pendiente: { texto: "En revisión", clase: "bg-amber-300 text-zinc-950" },
  publicada: { texto: "Publicada", clase: "bg-emerald-400 text-zinc-950" },
  descartada: { texto: "No continuó", clase: "bg-zinc-500 text-white" },
};

function soloDigitos(texto) {
  return String(texto || "").replace(/[^0-9]/g, "");
}

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

export default function MisVehiculos({ nav, supabase, session }) {
  const usuario = session?.user;
  const metadatos = usuario?.user_metadata || {};

  const [nombre, setNombre] = useState(metadatos.name || "");
  const [telefono, setTelefono] = useState(metadatos.phone || "");
  const [perfilGuardado, setPerfilGuardado] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);
  const [perfilAviso, setPerfilAviso] = useState("");

  const [form, setForm] = useState({ ...formularioVacio });
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  const [solicitudes, setSolicitudes] = useState([]);
  const [cargandoSolicitudes, setCargandoSolicitudes] = useState(true);
  const [miniaturas, setMiniaturas] = useState({});

  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);
  const [contrasenaAviso, setContrasenaAviso] = useState("");

  // Las vistas previas son blob: y hay que liberarlas a mano. Van por un ref
  // porque con [fotos] como dependencia la limpieza correría en cada cambio y
  // revocaría las que todavía se están mostrando: al agregar la segunda foto
  // se rompería la miniatura de la primera. Quitar una foto o enviar el
  // formulario ya liberan la suya; esto cubre el caso de salir de la página.
  const fotosRef = useRef([]);

  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  useEffect(() => {
    return () => fotosRef.current.forEach((foto) => URL.revokeObjectURL(foto.vistaPrevia));
  }, []);

  useEffect(() => {
    cargarPerfil();
    cargarSolicitudes();
  }, [usuario?.id]);

  async function cargarPerfil() {
    if (!supabase || !usuario) return;

    const { data, error: fallo } = await supabase
      .from("profiles")
      .select("name, phone")
      .eq("id", usuario.id)
      .maybeSingle();

    if (fallo) {
      console.error(fallo);
      return;
    }

    if (data) {
      setNombre(data.name || "");
      setTelefono(data.phone || "");
      setPerfilGuardado(true);
      return;
    }

    // Primer ingreso: la fila todavía no existe porque al registrarse no había
    // sesión. Se crea con lo que quedó en los metadatos del registro.
    const nombreMeta = String(metadatos.name || "").trim();
    const telefonoMeta = String(metadatos.phone || "").trim();

    if (nombreMeta.length >= 2 && soloDigitos(telefonoMeta).length >= 7) {
      const { error: falloCrear } = await supabase
        .from("profiles")
        .insert({ id: usuario.id, name: nombreMeta, phone: telefonoMeta });

      if (!falloCrear) {
        setPerfilGuardado(true);
        return;
      }
      console.error(falloCrear);
    }
  }

  async function cargarSolicitudes() {
    if (!supabase || !usuario) {
      setCargandoSolicitudes(false);
      return;
    }

    setCargandoSolicitudes(true);

    const { data, error: fallo } = await supabase
      .from("vehicle_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setCargandoSolicitudes(false);

    if (fallo) {
      console.error(fallo);
      setError("No pudimos cargar tus vehículos. Recarga la página para volver a intentarlo.");
      return;
    }

    const filas = data || [];
    setSolicitudes(filas);

    // Una miniatura por solicitud: el bucket es privado, así que la URL se
    // firma. Se piden todas de una sola vez.
    const rutas = filas.map((fila) => fila.photos?.[0]).filter(Boolean);
    if (rutas.length === 0) {
      setMiniaturas({});
      return;
    }

    const { data: firmadas, error: falloFirma } = await supabase.storage
      .from("request-photos")
      .createSignedUrls(rutas, 3600);

    if (falloFirma) {
      console.error(falloFirma);
      return;
    }

    const mapa = {};
    (firmadas || []).forEach((item) => {
      if (item.path && item.signedUrl) mapa[item.path] = item.signedUrl;
    });
    setMiniaturas(mapa);
  }

  async function guardarPerfil(event) {
    event.preventDefault();
    setPerfilAviso("");

    if (nombre.trim().length < 2) {
      setPerfilAviso("Escribe tu nombre.");
      return;
    }
    if (soloDigitos(telefono).length < 7) {
      setPerfilAviso("Escribe un teléfono válido.");
      return;
    }

    setGuardandoPerfil(true);

    const { error: fallo } = await supabase.from("profiles").upsert({
      id: usuario.id,
      name: nombre.trim(),
      phone: telefono.trim(),
      updated_at: new Date().toISOString(),
    });

    setGuardandoPerfil(false);

    if (fallo) {
      console.error(fallo);
      setPerfilAviso("No se pudieron guardar tus datos. Intenta de nuevo.");
      return;
    }

    setPerfilGuardado(true);
    setPerfilAviso("Datos guardados.");
  }

  function actualizarCampo(campo, valor) {
    setForm((actual) => {
      const siguiente = { ...actual, [campo]: valor };

      // Al cambiar de tipo, una carrocería que ya no aplica se limpia. Igual
      // que en el panel del admin.
      if (campo === "type") {
        const opciones = bodyTypesByVehicleType[valor];
        if (opciones && siguiente.bodyType && !opciones.includes(siguiente.bodyType)) {
          siguiente.bodyType = "";
        }
      }

      return siguiente;
    });
  }

  async function elegirFotos(event) {
    setError("");
    const archivos = Array.from(event.target.files || []);
    if (archivos.length === 0) return;

    const espacio = MAX_FOTOS - fotos.length;
    if (espacio <= 0) {
      setError(`Ya tienes el máximo de ${MAX_FOTOS} fotos.`);
      event.target.value = "";
      return;
    }

    const aProcesar = archivos.slice(0, espacio);

    try {
      // compressImage también hace de validación: un archivo que no sea
      // imagen falla en createImageBitmap.
      const comprimidas = await Promise.all(aProcesar.map((archivo) => compressImage(archivo)));
      const nuevas = comprimidas.map((archivo) => ({
        archivo,
        vistaPrevia: URL.createObjectURL(archivo),
      }));
      setFotos((actual) => [...actual, ...nuevas]);

      if (archivos.length > espacio) {
        setError(`Solo se agregaron ${espacio}: el máximo son ${MAX_FOTOS} fotos.`);
      }
    } catch (fallo) {
      console.error(fallo);
      setError("Una de las fotos no se pudo procesar. Prueba con otra imagen.");
    }

    event.target.value = "";
  }

  function quitarFoto(indice) {
    setFotos((actual) => {
      const foto = actual[indice];
      if (foto) URL.revokeObjectURL(foto.vistaPrevia);
      return actual.filter((_, i) => i !== indice);
    });
  }

  function validar() {
    if (!perfilGuardado) return "Primero guarda tu nombre y tu teléfono.";
    if (!form.brand.trim()) return "Escribe la marca.";
    if (!form.model.trim()) return "Escribe el modelo.";
    if (!/^[0-9]{4}$/.test(form.year.trim())) return "El año tiene que ser de 4 dígitos.";
    if (!soloDigitos(form.km)) return "Escribe el kilometraje.";
    if (!soloDigitos(form.price)) return "Escribe el precio que esperas.";
    if (!form.city.trim()) return "Escribe la ciudad.";
    if (!form.color.trim()) return "Escribe el color.";
    if (!form.motor.trim()) return "Escribe el motor, por ejemplo 1.6.";
    if (!form.bodyType.trim()) return "Falta el tipo de carrocería.";
    if (!/^[0-9]$/.test(form.plateLastDigit)) return "Escribe el último dígito de la placa.";
    if (form.type !== "Moto" && !/^[1-9]$/.test(form.doors)) return "Escribe cuántas puertas tiene.";
    if (fotos.length === 0) return "Sube al menos una foto del vehículo.";
    return "";
  }

  async function enviarSolicitud(event) {
    event.preventDefault();
    setError("");
    setAviso("");

    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setEnviando(true);

    try {
      // Las fotos van primero, a una carpeta propia dentro de la del usuario.
      // Si algo falla aquí no queda una solicitud a medias.
      const grupo = crypto.randomUUID();
      const rutas = [];

      for (let i = 0; i < fotos.length; i += 1) {
        const ruta = `${usuario.id}/${grupo}/${i + 1}.jpg`;
        const { error: falloSubida } = await supabase.storage
          .from("request-photos")
          .upload(ruta, fotos[i].archivo, { contentType: "image/jpeg", upsert: false });

        if (falloSubida) throw falloSubida;
        rutas.push(ruta);
      }

      const { error: falloInsercion } = await supabase.from("vehicle_requests").insert({
        user_id: usuario.id,
        status: "pendiente",
        type: form.type,
        brand: form.brand.trim(),
        model: form.model.trim(),
        version: form.version.trim() || null,
        year: form.year.trim(),
        km: soloDigitos(form.km),
        price_number: Number(soloDigitos(form.price)),
        city: form.city.trim(),
        fuel: form.fuel,
        transmission: form.transmission,
        color: form.color.trim(),
        // La moto no lleva puertas ni cámara de reversa.
        doors: form.type === "Moto" ? null : form.doors,
        motor: form.motor.trim(),
        body_type: form.bodyType.trim(),
        reverse_camera: form.type === "Moto" ? null : form.reverseCamera,
        plate_last_digit: form.plateLastDigit,
        comments: form.comments.trim() || null,
        photos: rutas,
      });

      if (falloInsercion) throw falloInsercion;

      fotos.forEach((foto) => URL.revokeObjectURL(foto.vistaPrevia));
      setFotos([]);
      setForm({ ...formularioVacio });
      setAviso("Listo, recibimos tu vehículo. JPM Vehículos lo revisa y te contacta al teléfono de tu perfil.");
      await cargarSolicitudes();
    } catch (fallo) {
      console.error(fallo);
      setError(
        "No se pudo enviar tu vehículo. Revisa tu conexión e intenta de nuevo; si sigue fallando, escríbenos por WhatsApp."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function borrarSolicitud(solicitud) {
    if (!window.confirm("¿Quitar este vehículo? Esta acción no se puede deshacer.")) return;

    // Primero las fotos: si se borra la fila antes, quedan huérfanas en el
    // bucket y ya no hay de dónde sacar sus rutas.
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

    if (fallo) {
      console.error(fallo);
      setError("No se pudo quitar. Intenta de nuevo.");
      return;
    }

    await cargarSolicitudes();
  }

  async function cambiarContrasena(event) {
    event.preventDefault();
    setContrasenaAviso("");

    if (nuevaContrasena.length < 8) {
      setContrasenaAviso("La contraseña necesita al menos 8 caracteres.");
      return;
    }

    setCambiandoContrasena(true);
    const { error: fallo } = await supabase.auth.updateUser({ password: nuevaContrasena });
    setCambiandoContrasena(false);

    if (fallo) {
      console.error(fallo);
      setContrasenaAviso("No se pudo cambiar la contraseña. Intenta de nuevo.");
      return;
    }

    setNuevaContrasena("");
    setContrasenaAviso("Contraseña actualizada.");
  }

  const esMoto = form.type === "Moto";
  const carroceriasDelTipo = bodyTypesByVehicleType[form.type] || null;

  const claseCampo = "w-full rounded-2xl bg-white px-4 py-3 text-zinc-950 outline-none";
  const claseEtiqueta = "mb-2 block text-sm font-bold";

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-zinc-950 text-white">
      {nav}

      <section className="mx-auto max-w-5xl px-5 py-16 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
              Vende tu vehículo
            </p>
            <h1 className="text-4xl font-black tracking-tight md:text-5xl">Mis vehículos</h1>
            <p className="mt-3 text-zinc-400">{usuario?.email}</p>
          </div>

          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="self-start rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10 sm:self-auto"
          >
            Cerrar sesión
          </button>
        </div>

        {/* ---------- Datos de contacto ---------- */}
        <form onSubmit={guardarPerfil} className="mt-10 rounded-[2rem] border border-white/10 bg-white/10 p-6">
          <h2 className="text-2xl font-black">Tus datos</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Por aquí te contactamos si nos interesa tu vehículo.
          </p>

          {perfilAviso && (
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold">
              {perfilAviso}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="perfil-nombre" className={claseEtiqueta}>Nombre</label>
              <input
                id="perfil-nombre"
                name="name"
                type="text"
                autoComplete="name"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className={claseCampo}
                placeholder="Nombre y apellido"
                aria-label="Nombre y apellido"
              />
            </div>

            <div>
              <label htmlFor="perfil-telefono" className={claseEtiqueta}>Teléfono</label>
              <input
                id="perfil-telefono"
                name="tel"
                type="tel"
                autoComplete="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                className={claseCampo}
                placeholder="300 123 4567"
                aria-label="Teléfono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={guardandoPerfil}
            className="mt-5 h-12 rounded-full bg-white px-8 font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-60"
          >
            {guardandoPerfil ? "Guardando..." : "Guardar mis datos"}
          </button>
        </form>

        {/* ---------- Subir un vehículo ---------- */}
        <form onSubmit={enviarSolicitud} className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6">
          <h2 className="text-2xl font-black">Sube tu vehículo</h2>
          <p className="mt-2 text-sm text-zinc-300">
            Llena lo que sepas y agrega fotos. No se publica solo: JPM Vehículos lo revisa antes.
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          {aviso && (
            <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100">
              {aviso}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="vehiculo-tipo" className={claseEtiqueta}>Tipo</label>
              <select
                id="vehiculo-tipo"
                name="tipo"
                value={form.type}
                onChange={(event) => actualizarCampo("type", event.target.value)}
                className={claseCampo}
                aria-label="Tipo de vehículo"
              >
                {VEHICLE_TYPES.map((tipo) => <option key={tipo}>{tipo}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="vehiculo-marca" className={claseEtiqueta}>Marca</label>
              <input id="vehiculo-marca" name="marca" type="text" value={form.brand}
                onChange={(event) => actualizarCampo("brand", event.target.value)}
                className={claseCampo} placeholder="Chevrolet, Mazda, Renault..." aria-label="Marca" />
            </div>

            <div>
              <label htmlFor="vehiculo-modelo" className={claseEtiqueta}>Modelo</label>
              <input id="vehiculo-modelo" name="modelo" type="text" value={form.model}
                onChange={(event) => actualizarCampo("model", event.target.value)}
                className={claseCampo} placeholder="Spark, CX-30, Duster..." aria-label="Modelo" />
            </div>

            <div>
              <label htmlFor="vehiculo-version" className={claseEtiqueta}>
                Versión <span className="font-normal text-zinc-400">(opcional)</span>
              </label>
              <input id="vehiculo-version" name="version" type="text" value={form.version}
                onChange={(event) => actualizarCampo("version", event.target.value)}
                className={claseCampo} placeholder="LT, Touring, Full equipo..." aria-label="Versión" />
            </div>

            <div>
              <label htmlFor="vehiculo-ano" className={claseEtiqueta}>Año</label>
              <input id="vehiculo-ano" name="ano" type="text" inputMode="numeric" maxLength={4}
                value={form.year}
                onChange={(event) => actualizarCampo("year", soloDigitos(event.target.value).slice(0, 4))}
                className={claseCampo} placeholder="2018" aria-label="Año" />
            </div>

            <div>
              <label htmlFor="vehiculo-km" className={claseEtiqueta}>Kilometraje</label>
              <input id="vehiculo-km" name="km" type="text" inputMode="numeric" value={form.km}
                onChange={(event) => actualizarCampo("km", soloDigitos(event.target.value).slice(0, 9))}
                className={claseCampo} placeholder="85000" aria-label="Kilometraje" />
            </div>

            <div>
              <label htmlFor="vehiculo-precio" className={claseEtiqueta}>Precio que esperas</label>
              <input id="vehiculo-precio" name="precio" type="text" inputMode="numeric" value={form.price}
                onChange={(event) => actualizarCampo("price", soloDigitos(event.target.value).slice(0, 11))}
                className={claseCampo} placeholder="45000000" aria-label="Precio que esperas" />
            </div>

            <div>
              <label htmlFor="vehiculo-ciudad" className={claseEtiqueta}>Ciudad</label>
              <input id="vehiculo-ciudad" name="ciudad" type="text" value={form.city}
                onChange={(event) => actualizarCampo("city", event.target.value)}
                className={claseCampo} placeholder="Barranquilla" aria-label="Ciudad" />
            </div>

            <div>
              <label htmlFor="vehiculo-combustible" className={claseEtiqueta}>Combustible</label>
              <select id="vehiculo-combustible" name="combustible" value={form.fuel}
                onChange={(event) => actualizarCampo("fuel", event.target.value)}
                className={claseCampo} aria-label="Combustible">
                {FUELS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="vehiculo-transmision" className={claseEtiqueta}>Transmisión</label>
              <select id="vehiculo-transmision" name="transmision" value={form.transmission}
                onChange={(event) => actualizarCampo("transmission", event.target.value)}
                className={claseCampo} aria-label="Transmisión">
                {TRANSMISSIONS.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>

            <div>
              <label htmlFor="vehiculo-color" className={claseEtiqueta}>Color</label>
              <input id="vehiculo-color" name="color" type="text" value={form.color}
                onChange={(event) => actualizarCampo("color", event.target.value)}
                className={claseCampo} placeholder="Gris, blanco, rojo..." aria-label="Color" />
            </div>

            <div>
              <label htmlFor="vehiculo-motor" className={claseEtiqueta}>Motor</label>
              <input id="vehiculo-motor" name="motor" type="text" value={form.motor}
                onChange={(event) => actualizarCampo("motor", event.target.value)}
                className={claseCampo} placeholder="1.6, 2.0 turbo..." aria-label="Motor" />
            </div>

            <div>
              <label htmlFor="vehiculo-carroceria" className={claseEtiqueta}>Tipo de carrocería</label>
              {carroceriasDelTipo ? (
                <select
                  id="vehiculo-carroceria"
                  name="carroceria"
                  value={form.bodyType}
                  onChange={(event) => actualizarCampo("bodyType", event.target.value)}
                  className={claseCampo}
                  aria-label="Tipo de carrocería"
                >
                  <option value="">Elige una</option>
                  {carroceriasDelTipo.map((item) => <option key={item}>{item}</option>)}
                </select>
              ) : (
                // La moto no tiene una lista fija, igual que en el panel del admin.
                <input id="vehiculo-carroceria" name="carroceria" type="text" value={form.bodyType}
                  onChange={(event) => actualizarCampo("bodyType", event.target.value)}
                  className={claseCampo} placeholder="Deportiva, scooter..." aria-label="Tipo de carrocería" />
              )}
            </div>

            <div>
              <label htmlFor="vehiculo-placa" className={claseEtiqueta}>Último dígito de la placa</label>
              <input id="vehiculo-placa" name="placa" type="text" inputMode="numeric" maxLength={1}
                value={form.plateLastDigit}
                onChange={(event) => actualizarCampo("plateLastDigit", soloDigitos(event.target.value).slice(0, 1))}
                className={claseCampo} placeholder="7" aria-label="Último dígito de la placa" />
            </div>

            {!esMoto && (
              <div>
                <label htmlFor="vehiculo-puertas" className={claseEtiqueta}>Puertas</label>
                <input id="vehiculo-puertas" name="puertas" type="text" inputMode="numeric" maxLength={1}
                  value={form.doors}
                  onChange={(event) => actualizarCampo("doors", soloDigitos(event.target.value).slice(0, 1))}
                  className={claseCampo} placeholder="5" aria-label="Puertas" />
              </div>
            )}

            {!esMoto && (
              <div>
                <label htmlFor="vehiculo-camara" className={claseEtiqueta}>¿Tiene cámara de reversa?</label>
                <select id="vehiculo-camara" name="camara" value={form.reverseCamera}
                  onChange={(event) => actualizarCampo("reverseCamera", event.target.value)}
                  className={claseCampo} aria-label="¿Tiene cámara de reversa?">
                  <option>Sí</option>
                  <option>No</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="vehiculo-comentarios" className={claseEtiqueta}>
              Algo más que debamos saber <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <textarea
              id="vehiculo-comentarios"
              name="comentarios"
              rows={4}
              maxLength={1000}
              value={form.comments}
              onChange={(event) => actualizarCampo("comments", event.target.value)}
              className={claseCampo}
              placeholder="Único dueño, mantenimientos al día, detalles de la pintura..."
              aria-label="Algo más que debamos saber"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-dashed border-white/25 bg-white/5 p-5">
            <label htmlFor="vehiculo-fotos" className="mb-3 block font-bold">
              Fotos del vehículo
            </label>

            <input
              id="vehiculo-fotos"
              name="fotos"
              type="file"
              accept="image/*"
              multiple
              onChange={elegirFotos}
              className="w-full text-sm"
            />

            <p className="mt-2 text-sm text-zinc-400">
              Hasta {MAX_FOTOS} fotos. La primera es la principal. Se reducen en tu propio
              teléfono antes de subirlas, así que no gastan muchos datos.
            </p>

            {fotos.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {fotos.map((foto, indice) => (
                  <div key={indice} className="relative">
                    <img
                      src={foto.vistaPrevia}
                      alt={`Foto ${indice + 1}`}
                      className="h-24 w-full rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => quitarFoto(indice)}
                      aria-label={`Quitar la foto ${indice + 1}`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-sm font-black text-white shadow-lg hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="mt-5 h-12 w-full rounded-full bg-amber-300 font-bold text-zinc-950 transition hover:bg-amber-200 disabled:opacity-60"
          >
            {enviando ? "Enviando..." : "Enviar mi vehículo"}
          </button>
        </form>

        {/* ---------- Lo que ya mandó ---------- */}
        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6">
          <h2 className="text-2xl font-black">Lo que has enviado</h2>

          {cargandoSolicitudes && <p className="mt-4 text-zinc-400">Cargando...</p>}

          {!cargandoSolicitudes && solicitudes.length === 0 && (
            <p className="mt-4 text-zinc-400">
              Todavía no has enviado ningún vehículo. Usa el formulario de arriba.
            </p>
          )}

          <div className="mt-5 space-y-4">
            {solicitudes.map((solicitud) => {
              const etiqueta = ETIQUETAS_ESTADO[solicitud.status] || ETIQUETAS_ESTADO.pendiente;
              const miniatura = miniaturas[solicitud.photos?.[0]];

              return (
                <div
                  key={solicitud.id}
                  className="flex flex-col gap-4 rounded-2xl bg-white/10 p-4 sm:flex-row"
                >
                  {miniatura ? (
                    <img
                      src={miniatura}
                      alt={`${solicitud.brand} ${solicitud.model}`}
                      className="h-28 w-full rounded-2xl object-cover sm:w-40"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center rounded-2xl bg-white/5 text-xs text-zinc-500 sm:w-40">
                      Sin foto
                    </div>
                  )}

                  <div className="flex-1">
                    <span
                      className={
                        "inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] " +
                        etiqueta.clase
                      }
                    >
                      {etiqueta.texto}
                    </span>

                    <p className="mt-2 text-lg font-bold">
                      {solicitud.brand} {solicitud.model} {solicitud.version || ""}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {solicitud.year} · {Number(solicitud.km).toLocaleString("es-CO")} km ·{" "}
                      {Number(solicitud.price_number).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      Enviado el {fechaLegible(solicitud.created_at)} ·{" "}
                      {solicitud.photos?.length || 0} foto
                      {(solicitud.photos?.length || 0) === 1 ? "" : "s"}
                    </p>

                    {solicitud.admin_note && (
                      <p className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm text-zinc-200">
                        <span className="font-bold">JPM Vehículos: </span>
                        {solicitud.admin_note}
                      </p>
                    )}

                    {solicitud.status === "pendiente" && (
                      <button
                        type="button"
                        onClick={() => borrarSolicitud(solicitud)}
                        className="mt-3 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold transition hover:bg-white/10"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ---------- Contraseña ---------- */}
        <form onSubmit={cambiarContrasena} className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6">
          <h2 className="text-2xl font-black">Cambiar mi contraseña</h2>

          {contrasenaAviso && (
            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold">
              {contrasenaAviso}
            </div>
          )}

          <label htmlFor="perfil-contrasena" className={claseEtiqueta + " mt-5"}>
            Nueva contraseña
          </label>
          <input
            id="perfil-contrasena"
            name="new-password"
            type="password"
            autoComplete="new-password"
            value={nuevaContrasena}
            onChange={(event) => setNuevaContrasena(event.target.value)}
            className={claseCampo + " sm:max-w-sm"}
            placeholder="Al menos 8 caracteres"
            aria-label="Nueva contraseña"
          />

          <button
            type="submit"
            disabled={cambiandoContrasena}
            className="mt-5 h-12 rounded-full border border-white/20 px-8 font-bold transition hover:bg-white/10 disabled:opacity-60"
          >
            {cambiandoContrasena ? "Cambiando..." : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
