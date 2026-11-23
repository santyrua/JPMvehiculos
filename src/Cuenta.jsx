import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

// Registro e ingreso del público, para que cada quien suba su propio vehículo.
// No es la puerta del admin: eso sigue siendo los 7 toques en el footer. Lo que
// separa a una cuenta del negocio de una del público es la tabla admins, no por
// dónde entró.
//
// El nombre y el teléfono se guardan en los metadatos del usuario al
// registrarse, porque con la confirmación por correo activa todavía no hay
// sesión y sin sesión las políticas no dejan escribir en profiles. La fila de
// profiles se crea en el primer ingreso, desde MisVehiculos.
export default function Cuenta({ nav, supabase, hcaptchaSiteKey }) {
  const [modo, setModo] = useState("ingresar");
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [verContrasena, setVerContrasena] = useState(false);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef(null);

  const captchaActivo = !!hcaptchaSiteKey;

  function reiniciarCaptcha() {
    // El token de hCaptcha es de un solo uso.
    setCaptchaToken("");
    captchaRef.current?.resetCaptcha();
  }

  function cambiarModo(siguiente) {
    setModo(siguiente);
    setError("");
    setAviso("");
    reiniciarCaptcha();
  }

  async function enviar(event) {
    event.preventDefault();
    setError("");
    setAviso("");

    if (!supabase) {
      setError("No hay conexión con el servidor en este momento. Intenta más tarde.");
      return;
    }

    const correoLimpio = correo.trim();
    if (!correoLimpio) {
      setError("Escribe tu correo.");
      return;
    }

    if (modo !== "recuperar" && !contrasena) {
      setError("Escribe tu contraseña.");
      return;
    }

    if (modo === "registrarse") {
      if (contrasena.length < 8) {
        setError("La contraseña necesita al menos 8 caracteres.");
        return;
      }
      if (nombre.trim().length < 2) {
        setError("Escribe tu nombre.");
        return;
      }
      if (telefono.replace(/[^0-9]/g, "").length < 7) {
        setError("Escribe un teléfono válido, con indicativo si es fijo.");
        return;
      }
    }

    if (captchaActivo && !captchaToken) {
      setError("Completa el captcha para continuar.");
      return;
    }

    const opciones = captchaActivo ? { captchaToken } : {};
    setEnviando(true);

    try {
      if (modo === "registrarse") {
        const { data, error: errorRegistro } = await supabase.auth.signUp({
          email: correoLimpio,
          password: contrasena,
          options: {
            ...opciones,
            data: { name: nombre.trim(), phone: telefono.trim() },
          },
        });

        if (errorRegistro) throw errorRegistro;

        if (!data.session) {
          // Falta confirmar el correo: no hay sesión todavía.
          setAviso(
            `Te enviamos un correo a ${correoLimpio}. Ábrelo para confirmar tu cuenta y después entra con tu correo y contraseña.`
          );
          setContrasena("");
          reiniciarCaptcha();
        }
        // Si sí vino sesión, onAuthStateChange en App.jsx cambia la vista solo.
        return;
      }

      if (modo === "recuperar") {
        const { error: errorRecuperar } = await supabase.auth.resetPasswordForEmail(correoLimpio, {
          ...opciones,
          redirectTo: `${window.location.origin}/vender`,
        });

        if (errorRecuperar) throw errorRecuperar;

        setAviso(
          `Si existe una cuenta con ${correoLimpio}, te llegará un correo para cambiar la contraseña.`
        );
        reiniciarCaptcha();
        return;
      }

      const { error: errorIngreso } = await supabase.auth.signInWithPassword({
        email: correoLimpio,
        password: contrasena,
        options: opciones,
      });

      if (errorIngreso) throw errorIngreso;
      // El cambio de vista lo hace onAuthStateChange en App.jsx.
    } catch (fallo) {
      console.error(fallo);
      reiniciarCaptcha();

      const mensaje = String(fallo?.message || "");
      if (/Invalid login credentials/i.test(mensaje)) {
        setError("Correo o contraseña incorrectos.");
      } else if (/Email not confirmed/i.test(mensaje)) {
        setError("Todavía no confirmaste tu correo. Revisa tu bandeja de entrada.");
      } else if (/User already registered|already been registered/i.test(mensaje)) {
        setError("Ya existe una cuenta con ese correo. Entra en lugar de registrarte.");
      } else if (/rate limit|too many/i.test(mensaje)) {
        setError("Hubo demasiados intentos seguidos. Espera unos minutos y vuelve a probar.");
      } else {
        setError("No se pudo completar la operación. Intenta de nuevo en un momento.");
      }
    } finally {
      setEnviando(false);
    }
  }

  const titulos = {
    ingresar: "Entra a tu cuenta",
    registrarse: "Crea tu cuenta",
    recuperar: "Recuperar contraseña",
  };

  const bajadas = {
    ingresar: "Entra para subir tu vehículo y ver en qué va tu solicitud.",
    registrarse: "Con una cuenta puedes subir tu vehículo con fotos y seguirle el rastro.",
    recuperar: "Te enviamos un correo para que puedas cambiar la contraseña.",
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-zinc-950 text-white">
      {nav}

      <section className="mx-auto max-w-xl px-5 py-16 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
          Vende tu vehículo
        </p>
        <h1 className="text-4xl font-black tracking-tight md:text-5xl">{titulos[modo]}</h1>
        <p className="mt-4 text-lg leading-8 text-zinc-300">{bajadas[modo]}</p>

        <form
          onSubmit={enviar}
          className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6"
        >
          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {error}
            </div>
          )}

          {aviso && (
            <div className="mb-5 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm font-semibold text-emerald-100">
              {aviso}
            </div>
          )}

          {modo === "registrarse" && (
            <>
              <label htmlFor="cuenta-nombre" className="mb-2 block text-sm font-bold">
                Tu nombre
              </label>
              <input
                id="cuenta-nombre"
                name="name"
                type="text"
                autoComplete="name"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                className="mb-4 w-full rounded-2xl bg-white px-4 py-3 text-zinc-950 outline-none"
                placeholder="Nombre y apellido"
                aria-label="Nombre y apellido"
              />

              <label htmlFor="cuenta-telefono" className="mb-2 block text-sm font-bold">
                Tu teléfono
              </label>
              <input
                id="cuenta-telefono"
                name="tel"
                type="tel"
                autoComplete="tel"
                value={telefono}
                onChange={(event) => setTelefono(event.target.value)}
                className="mb-4 w-full rounded-2xl bg-white px-4 py-3 text-zinc-950 outline-none"
                placeholder="300 123 4567"
                aria-label="Teléfono"
              />
              <p className="mb-4 -mt-2 text-xs text-zinc-400">
                Es por donde te vamos a contactar si nos interesa tu vehículo.
              </p>
            </>
          )}

          <label htmlFor="cuenta-correo" className="mb-2 block text-sm font-bold">
            Correo
          </label>
          <input
            id="cuenta-correo"
            name="email"
            type="email"
            autoComplete="email"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            className="mb-4 w-full rounded-2xl bg-white px-4 py-3 text-zinc-950 outline-none"
            placeholder="tucorreo@ejemplo.com"
            aria-label="Correo"
          />

          {modo !== "recuperar" && (
            <>
              <label htmlFor="cuenta-contrasena" className="mb-2 block text-sm font-bold">
                Contraseña
              </label>
              <div className="relative mb-2">
                <input
                  id="cuenta-contrasena"
                  name="password"
                  type={verContrasena ? "text" : "password"}
                  autoComplete={modo === "registrarse" ? "new-password" : "current-password"}
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  className="w-full rounded-2xl bg-white px-4 py-3 pr-12 text-zinc-950 outline-none"
                  placeholder={modo === "registrarse" ? "Al menos 8 caracteres" : "Tu contraseña"}
                  aria-label="Contraseña"
                />

                {/* Igual que en el login del admin: solo se ve mientras el ojo
                    está presionado. */}
                <button
                  type="button"
                  aria-label="Mantén presionado para ver la contraseña"
                  title="Mantén presionado para ver la contraseña"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    setVerContrasena(true);
                  }}
                  onPointerUp={() => setVerContrasena(false)}
                  onPointerLeave={() => setVerContrasena(false)}
                  onPointerCancel={() => setVerContrasena(false)}
                  onBlur={() => setVerContrasena(false)}
                  onContextMenu={(event) => event.preventDefault()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 select-none p-1 text-zinc-500 transition hover:text-zinc-900"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                    {verContrasena && <path d="M4 4l16 16" />}
                  </svg>
                </button>
              </div>
            </>
          )}

          {captchaActivo && (
            <div className="mb-5 mt-4 flex justify-center">
              <HCaptcha
                ref={captchaRef}
                sitekey={hcaptchaSiteKey}
                onVerify={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken("")}
                onError={() => setCaptchaToken("")}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={enviando || (captchaActivo && !captchaToken)}
            className="mt-2 h-12 w-full rounded-full bg-white font-bold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando
              ? "Un momento..."
              : modo === "registrarse"
                ? "Crear mi cuenta"
                : modo === "recuperar"
                  ? "Enviar el correo"
                  : "Entrar"}
          </button>

          <div className="mt-5 space-y-2 text-sm text-zinc-300">
            {modo === "ingresar" && (
              <>
                <p>
                  ¿No tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => cambiarModo("registrarse")}
                    className="font-bold text-amber-300 underline underline-offset-4"
                  >
                    Regístrate
                  </button>
                </p>
                <p>
                  <button
                    type="button"
                    onClick={() => cambiarModo("recuperar")}
                    className="text-zinc-400 underline underline-offset-4 hover:text-white"
                  >
                    Olvidé mi contraseña
                  </button>
                </p>
              </>
            )}

            {modo !== "ingresar" && (
              <p>
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => cambiarModo("ingresar")}
                  className="font-bold text-amber-300 underline underline-offset-4"
                >
                  Entra aquí
                </button>
              </p>
            )}
          </div>
        </form>

        <p className="mt-6 text-sm leading-6 text-zinc-400">
          Lo que subas no se publica solo: queda como una solicitud que JPM Vehículos revisa
          antes de que aparezca en el catálogo.
        </p>
      </section>
    </div>
  );
}
