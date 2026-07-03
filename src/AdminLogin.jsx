export default function AdminLogin({
  hasSupabase,
  adminEmail,
  setAdminEmail,
  adminPassword,
  setAdminPassword,
  loginAdmin,
  onCancel,
}) {
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
            : "Supabase no está conectado. Usa la contraseña temporal."}
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

        <input
          type="password"
          value={adminPassword}
          onChange={(event) => setAdminPassword(event.target.value)}
          className="mt-3 w-full rounded-2xl bg-zinc-100 px-4 py-3 outline-none"
          placeholder="Contraseña"
          autoFocus={!hasSupabase}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            className="h-12 rounded-full bg-zinc-950 font-bold text-white"
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
