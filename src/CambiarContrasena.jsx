import { useState } from "react";

// La pantalla a la que llega quien abre el enlace de "olvidé mi contraseña".
//
// Supabase ya le dio sesión al verificar el enlace, así que técnicamente
// podría entrar al sitio sin más. Pero viene a una sola cosa, y soltarlo en
// la página completa de su cuenta con el cambio de contraseña escondido al
// final es hacerle buscar lo único que necesita.

export default function CambiarContrasena({ nav, supabase, onListo, onCancelar }) {
  const [nueva, setNueva] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [ver, setVer] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [lista, setLista] = useState(false);

  async function guardar(event) {
    event.preventDefault();
    setError("");

    if (nueva.length < 8) {
      setError("La contraseña necesita al menos 8 caracteres.");
      return;
    }

    if (nueva !== confirmacion) {
      setError("Las dos contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    const { error: fallo } = await supabase.auth.updateUser({ password: nueva });
    setGuardando(false);

    if (fallo) {
      console.error(fallo);
      // El enlace de recuperación caduca y es de un solo uso: si ya se gastó,
      // la sesión no alcanza para cambiar la contraseña.
      setError(
        /session|expired|token/i.test(String(fallo.message || ""))
          ? "El enlace ya venció o se usó antes. Pide uno nuevo desde “Olvidé mi contraseña”."
          : "No se pudo cambiar la contraseña. Intenta de nuevo."
      );
      return;
    }

    setNueva("");
    setConfirmacion("");
    setLista(true);
  }

  const claseCampo = "w-full rounded-2xl bg-white px-4 py-3 pr-12 text-zinc-950 outline-none";

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-zinc-950 text-white">
      {nav}

      <section className="mx-auto max-w-md px-5 py-16 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
          Tu cuenta
        </p>
        <h1 className="text-4xl font-black tracking-tight">Elige una contraseña nueva</h1>

        {lista ? (
          <div className="mt-8 rounded-[2rem] border border-emerald-400/40 bg-emerald-500/15 p-6">
            <p className="text-lg font-bold text-emerald-100">Contraseña cambiada.</p>
            <p className="mt-2 text-emerald-100/80">
              Ya puedes usarla la próxima vez que entres.
            </p>

            <button
              type="button"
              onClick={onListo}
              className="mt-5 h-12 w-full rounded-full bg-white font-bold text-zinc-950 transition hover:bg-zinc-200"
            >
              Continuar
            </button>
          </div>
        ) : (
          <form onSubmit={guardar} className="mt-8 rounded-[2rem] border border-white/10 bg-white/10 p-6">
            <p className="mb-5 text-zinc-300">
              Escríbela dos veces para evitar una errata.
            </p>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
                {error}
              </div>
            )}

            <label htmlFor="nueva-contrasena" className="mb-2 block text-sm font-bold">
              Contraseña nueva
            </label>
            <div className="relative mb-4">
              <input
                id="nueva-contrasena"
                name="new-password"
                type={ver ? "text" : "password"}
                autoComplete="new-password"
                value={nueva}
                onChange={(event) => setNueva(event.target.value)}
                className={claseCampo}
                placeholder="Al menos 8 caracteres"
                aria-label="Contraseña nueva"
                autoFocus
              />

              {/* Igual que en el resto del sitio: solo se ve mientras el ojo
                  está presionado. */}
              <button
                type="button"
                aria-label="Mantén presionado para ver la contraseña"
                title="Mantén presionado para ver la contraseña"
                onPointerDown={(evento) => {
                  evento.preventDefault();
                  setVer(true);
                }}
                onPointerUp={() => setVer(false)}
                onPointerLeave={() => setVer(false)}
                onPointerCancel={() => setVer(false)}
                onBlur={() => setVer(false)}
                onContextMenu={(evento) => evento.preventDefault()}
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
                  {ver && <path d="M4 4l16 16" />}
                </svg>
              </button>
            </div>

            <label htmlFor="confirmar-contrasena" className="mb-2 block text-sm font-bold">
              Confírmala
            </label>
            <input
              id="confirmar-contrasena"
              name="confirm-password"
              type={ver ? "text" : "password"}
              autoComplete="new-password"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className={claseCampo}
              placeholder="Escríbela otra vez"
              aria-label="Confirmar la contraseña nueva"
            />

            {confirmacion.length > 0 && nueva !== confirmacion && (
              <p className="mt-2 text-sm text-amber-300">Todavía no coinciden.</p>
            )}

            <button
              type="submit"
              disabled={guardando}
              className="mt-6 h-12 w-full rounded-full bg-amber-300 font-bold text-zinc-950 transition hover:bg-amber-200 disabled:opacity-60"
            >
              {guardando ? "Guardando..." : "Guardar contraseña"}
            </button>

            <button
              type="button"
              onClick={onCancelar}
              className="mt-3 w-full text-sm text-zinc-400 underline underline-offset-4 transition hover:text-white"
            >
              Ahora no, ir a mi cuenta
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
