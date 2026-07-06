const requisitos = [
  "Cédula del propietario.",
  "Licencia de tránsito (tarjeta de propiedad) del vehículo.",
  "Información del conductor principal, cuando sea requerida.",
  "Fotografías o inspección del vehículo, según las políticas de la aseguradora.",
  "Datos de contacto del tomador del seguro.",
];

const coberturas = [
  "Pérdida total o parcial por daños.",
  "Pérdida total o parcial por hurto.",
  "Responsabilidad civil extracontractual.",
  "Asistencia en carretera las 24 horas.",
  "Servicio de grúa.",
  "Vehículo de reemplazo (según el plan contratado).",
  "Gastos de transporte (de acuerdo con la póliza).",
  "Protección para conductor y ocupantes.",
  "Atención y acompañamiento en caso de siniestro.",
  "Asesoría personalizada durante toda la vigencia de la póliza.",
];

const aseguradoras = [
  "SURA",
  "AXA Colpatria",
  "Allianz",
  "Seguros Bolívar",
  "MAPFRE",
  "La Equidad Seguros",
  "HDI Seguros",
  "SBS Seguros",
  "Seguros Mundial",
  "La Previsora",
  "Seguros del Estado",
  "Aseguradora Solidaria",
];

export default function Seguros({ onClose, whatsappNumber = "573175792923" }) {
  const waUrl =
    "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("Hola, quiero cotizar un Seguro Todo Riesgo para mi vehículo.");

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950 text-white">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <button onClick={onClose} className="text-left transition hover:opacity-80">
            <p className="text-xl font-black tracking-tight">JPM</p>
            <p className="-mt-1 text-xs uppercase tracking-[0.32em] text-zinc-400">Vehículos</p>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            ← Volver al inicio
          </button>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Seguros</p>
        <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
          Seguro Todo Riesgo Vehicular
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
          Protege tu vehículo con un Seguro Todo Riesgo diseñado para brindarte tranquilidad en cada recorrido.
          Trabajamos con las principales aseguradoras del país para ofrecerte diferentes alternativas de cobertura,
          beneficios y precios, permitiéndote comparar y elegir la opción que mejor se adapte a tus necesidades y
          presupuesto.
        </p>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">
          Nuestro proceso es rápido, fácil y con acompañamiento personalizado. Solo debes suministrar la información
          básica del vehículo y del propietario para recibir una cotización con varias opciones de aseguradoras. Una vez
          elijas la alternativa que mejor se ajuste a tus necesidades, se realiza la emisión de la póliza y tu vehículo
          quedará protegido con el respaldo de una compañía aseguradora reconocida.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-zinc-950 transition hover:bg-zinc-200"
        >
          Cotizar mi seguro
        </a>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-4 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">Requisitos</h3>
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <ul className="grid gap-3 text-sm text-zinc-300 sm:grid-cols-2">
            {requisitos.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-amber-300">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">Coberturas y beneficios</h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {coberturas.map((cobertura) => (
            <span
              key={cobertura}
              className="flex items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-zinc-200"
            >
              <span className="text-emerald-400">✓</span>
              <span>{cobertura}</span>
            </span>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-amber-300/10 px-5 py-4">
          <p className="text-sm leading-6 text-amber-200">
            <span className="font-bold">Importante:</span> Las coberturas, valores y condiciones pueden variar según
            cada aseguradora y el perfil del vehículo. Te ayudamos a comparar para que elijas la mejor opción.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">Aseguradoras aliadas</h3>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
          Contamos con alianzas con algunas de las aseguradoras más importantes de Colombia para ofrecerte mayor
          variedad de opciones y las mejores condiciones del mercado:
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {aseguradoras.map((aseguradora) => (
            <span
              key={aseguradora}
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-zinc-200"
            >
              {aseguradora}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
          <h3 className="text-2xl font-black tracking-tight md:text-3xl">¡Cotiza hoy mismo tu Seguro Todo Riesgo!</h3>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            Compara diferentes opciones en un solo lugar. Nuestro equipo de asesores te ayudará a encontrar la mejor
            combinación entre cobertura, respaldo y precio para que conduzcas con la tranquilidad de estar protegido en
            todo momento.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            Cotizar mi seguro por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
