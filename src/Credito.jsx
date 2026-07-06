const pasos = [
  { n: "1", title: "Solicitud de crédito", desc: "Recibimos tu información y diligenciamos la solicitud de crédito para iniciar el proceso." },
  { n: "2", title: "Entrega de documentos", desc: "Verificamos que toda la documentación esté completa para agilizar el estudio de crédito." },
  { n: "3", title: "Estudio de crédito", desc: "Las entidades financieras evalúan tu capacidad de pago, historial crediticio y perfil financiero." },
  { n: "4", title: "Aprobación", desc: "Se definen las condiciones de financiación: monto aprobado, plazo, tasa de interés y valor de las cuotas." },
  { n: "5", title: "Legalización y desembolso", desc: "Se firman los documentos y se realiza el desembolso del crédito para continuar con la compra de tu vehículo." },
];

const requisitos = [
  {
    grupo: "Empleados",
    items: [
      "Cédula de ciudadanía.",
      "Certificación laboral vigente.",
      "Tres (3) últimos desprendibles de nómina.",
      "Extractos bancarios de los últimos tres (3) meses.",
    ],
  },
  {
    grupo: "Independientes",
    items: [
      "Cédula de ciudadanía.",
      "Extractos bancarios de los últimos seis (6) meses.",
      "Registro Único Tributario (RUT).",
      "Certificado de Cámara de Comercio (cuando aplique).",
      "Declaración de renta (si aplica).",
      "Soportes de ingresos.",
    ],
  },
  {
    grupo: "Pensionados",
    items: ["Cédula de ciudadanía.", "Comprobante de pago de la pensión.", "Extractos bancarios recientes."],
  },
];

const entidades = [
  "Banco de Bogotá",
  "Davivienda",
  "BBVA Colombia",
  "Banco Finandina",
  "Sufi",
  "Finanzauto",
  "Mobilize Financial Services",
  "Toyota Financial Services",
  "Banco Santander Colombia",
  "Delta Credit",
  "Uni2",
  "Summa",
  "Apoyos Financieros",
  "Finesa",
  "Vehigroup",
];

const beneficios = [
  "Asesoría personalizada durante todo el proceso.",
  "Gestión ágil y segura de tu solicitud.",
  "Acompañamiento desde la radicación hasta el desembolso.",
  "Convenios con múltiples entidades financieras.",
  "Atención transparente, confiable y oportuna.",
];

export default function Credito({ onClose, whatsappNumber = "573175792923" }) {
  const waUrl =
    "https://wa.me/" + whatsappNumber + "?text=" + encodeURIComponent("Hola, quiero información sobre el crédito vehicular.");

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
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Crédito vehicular</p>
        <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
          ¡Haz realidad el sueño de tener tu vehículo!
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
          Te acompañamos durante todo el proceso para que obtengas tu crédito vehicular de forma rápida, segura y con
          las mejores alternativas de financiación del mercado.
        </p>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">
          Nuestro equipo de asesores analizará tu perfil y gestionará tu solicitud con diferentes entidades financieras
          para encontrar la opción que mejor se adapte a tus necesidades y capacidad de pago.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-zinc-950 transition hover:bg-zinc-200"
        >
          Solicitar mi crédito
        </a>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-4 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">¿Cómo es el proceso?</h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pasos.map((paso) => (
            <div key={paso.n} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-lg font-black text-zinc-950">
                {paso.n}
              </div>
              <h4 className="mt-4 text-lg font-bold">{paso.title}</h4>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{paso.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">Requisitos</h3>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {requisitos.map((grupo) => (
            <div key={grupo.grupo} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <h4 className="text-xl font-bold text-amber-300">{grupo.grupo}</h4>
              <ul className="mt-4 space-y-2 text-sm text-zinc-300">
                {grupo.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-amber-300">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-amber-300/10 px-5 py-4">
          <p className="text-sm leading-6 text-amber-200">
            <span className="font-bold">Importante:</span> Los requisitos pueden variar según las políticas de cada
            entidad financiera. Durante el estudio de crédito podrán solicitarse documentos adicionales.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">Entidades financieras aliadas</h3>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
          Contamos con convenio con reconocidas entidades financieras para brindarte una amplia variedad de opciones de
          financiación y aumentar las posibilidades de aprobación de tu crédito.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {entidades.map((entidad) => (
            <span
              key={entidad}
              className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-zinc-200"
            >
              {entidad}
            </span>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-6 text-zinc-400">
          Con una sola solicitud gestionamos diferentes alternativas de financiación, permitiéndote comparar opciones y
          elegir la que mejor se adapte a ti, sin tener que hacer el trámite por separado en cada entidad.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
          <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-amber-300">¿Por qué elegirnos?</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((beneficio) => (
              <span key={beneficio} className="flex items-start gap-2 text-sm text-zinc-200">
                <span className="text-emerald-400">✓</span>
                <span>{beneficio}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
          <h3 className="text-2xl font-black tracking-tight md:text-3xl">¡Solicita tu crédito vehicular hoy mismo!</h3>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            Da el primer paso para comprar el vehículo que deseas. Nuestro equipo de expertos está listo para
            acompañarte y ayudarte a obtener la mejor alternativa de financiación.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            Solicitar mi crédito por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
