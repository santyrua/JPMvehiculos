import { useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

export default function AdminLogin({
  hasSupabase,
  adminEmail,
  setAdminEmail,
  adminPassword,
  setAdminPassword,
  loginAdmin,
  onCancel,
  hcaptchaSiteKey,
  captchaToken,
  setCaptchaToken,
  captchaRef,
}) {
  const captchaEnabled = hasSupabase && !!hcaptchaSiteKey;
  const [showPassword, setShowPassword] = useState(false);
  const hidePassword = () => setShowPassword(false);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm">
      <form
        onSubmit={loginAdmin}
        className="w-full max-w-md rounded-[2rem] bg-white p-6 text-zinc-950 shadow-2xl"
      >
        <h3 className="text-3xl font-black">Acceso administrador</h3>

        <p className="mt-2 text-zinc-600">
          {hasSupabase
            ? "Ingresa tu correo y contraseña de Supabase Auth."
            : "Supabase no está conectado, así que el admin no está disponible."}
        </p>

        {hasSupabase && (
          <input
            type="email"
            value={adminEmail}
            onChange={(event) => setAdminEmail(event.target.value)}
            className="mt-5 w-full rounded-2xl bg-zinc-100 px-4 py-3 outline-none"
            placeholder="Correo admin"
            autoFocus
          />
        )}

        <div className="relative mt-3">
          <input
            type={showPassword ? "text" : "password"}
            value={adminPassword}
            onChange={(event) => setAdminPassword(event.target.value)}
            className="w-full rounded-2xl bg-zinc-100 px-4 py-3 pr-12 outline-none"
            placeholder="Contraseña"
            autoFocus={!hasSupabase}
          />

          {/* La contraseña solo se ve mientras el ojo está presionado: al
              soltar, sacar el puntero o perder el foco vuelve a ocultarse.
              El preventDefault evita robarle el foco al campo. */}
          <button
            type="button"
            aria-label="Mantén presionado para ver la contraseña"
            title="Mantén presionado para ver la contraseña"
            onPointerDown={(event) => { event.preventDefault(); setShowPassword(true); }}
            onPointerUp={hidePassword}
            onPointerLeave={hidePassword}
            onPointerCancel={hidePassword}
            onKeyDown={(event) => { if (event.key === " " || event.key === "Enter") { event.preventDefault(); setShowPassword(true); } }}
            onKeyUp={hidePassword}
            onBlur={hidePassword}
            onContextMenu={(event) => event.preventDefault()}
            className="absolute right-3 top-1/2 -translate-y-1/2 select-none p-1 text-zinc-500 transition hover:text-zinc-900"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
              {showPassword && <path d="M4 4l16 16" />}
            </svg>
          </button>
        </div>

        {captchaEnabled && (
          <div className="mt-4 flex justify-center">
            <HCaptcha
              ref={captchaRef}
              sitekey={hcaptchaSiteKey}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken("")}
              onError={() => setCaptchaToken("")}
            />
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            disabled={captchaEnabled && !captchaToken}
            className="h-12 rounded-full bg-zinc-950 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Entrar
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-full border border-black/20 bg-white font-bold text-zinc-950"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
