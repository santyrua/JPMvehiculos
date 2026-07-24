const descuentos = [
  {
    tipo: "Comparendo impuesto por un agente de tránsito",
    tiers: [
      { pct: "50%", cond: "Si el curso y el pago se realizan dentro de los primeros 5 días hábiles." },
      { pct: "25%", cond: "Si el trámite se efectúa entre el día hábil 6 y el 20." },
    ],
  },
  {
    tipo: "Fotomulta o comparendo electrónico",
    tiers: [
      { pct: "50%", cond: "Si el curso y el pago se realizan dentro de los primeros 11 días hábiles desde la notificación." },
      { pct: "25%", cond: "Si el trámite se realiza entre el día hábil 12 y el 26." },
    ],
  },
];

const beneficios = [
  "Nosotros hacemos el curso por ti.",
  "Ahorras tiempo y evitas desplazamientos innecesarios.",
  "Asesoría personalizada durante todo el proceso.",
  "Gestión ágil, confiable y segura.",
  "Aprovechas el máximo descuento que permite la ley.",
];

export default function Comparendos({ nav, whatsappNumber = "573175792923" }) {
  const waUrl =
    "https://wa.me/" +
    whatsappNumber +
    "?text=" +
    encodeURIComponent("Hola, quiero información sobre el Curso de Seguridad Vial para el descuento de mi comparendo.");

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-zinc-950 text-white">
      {nav}

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Comparendos</p>
        <h2 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">Curso de Seguridad Vial</h2>
        <p className="mt-3 max-w-3xl text-xl font-bold text-amber-300">
          ¡Obtén hasta el 50% de descuento en tu comparendo sin perder tu tiempo!
        </p>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-300">
          ¿Recibiste un comparendo y quieres acceder al beneficio del 50% de descuento que otorga la ley? Nosotros nos
          encargamos de realizar el Curso de Seguridad Vial por ti, permitiéndote ahorrar tiempo, evitar
          desplazamientos innecesarios y facilitar todo el proceso para que obtengas el descuento de manera rápida y
          segura.
        </p>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-400">
          Sabemos que cumplir con este requisito puede ser complicado por motivos de trabajo, estudios o falta de
          tiempo. Por eso ponemos a tu disposición un servicio ágil y confiable mediante el cual gestionamos tu curso,
          mientras tú continúas con tus actividades diarias.
        </p>
        <a
          href={waUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-zinc-950 transition hover:bg-zinc-200"
        >
          Quiero mi descuento
        </a>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-4 lg:px-8">
        <h3 className="text-2xl font-black tracking-tight md:text-3xl">Descuentos según la ley</h3>
        <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-300">
          De acuerdo con el Código Nacional de Tránsito (Ley 769 de 2002, artículo 136, modificado por la Ley 1383 de
          2010), quienes realicen el Curso de Seguridad Vial dentro de los plazos establecidos pueden acceder a
          importantes descuentos en el valor del comparendo.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {descuentos.map((d) => (
            <div key={d.tipo} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <h4 className="text-lg font-bold text-amber-300">{d.tipo}</h4>
              <div className="mt-4 space-y-3">
                {d.tiers.map((t) => (
                  <div key={t.pct + t.cond} className="flex items-start gap-4 rounded-2xl bg-zinc-950/50 p-4">
                    <span className="shrink-0 text-3xl font-black text-amber-300">{t.pct}</span>
                    <span className="text-sm leading-6 text-zinc-300">{t.cond}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-amber-300/10 px-5 py-4">
          <p className="text-sm leading-6 text-amber-200">
            <span className="font-bold">Importante:</span> Los plazos se cuentan en días hábiles. Entre más pronto
            realices el curso, mayor será el descuento al que podrás acceder.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
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
          <h3 className="text-2xl font-black tracking-tight md:text-3xl">No dejes vencer los plazos</h3>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-zinc-300">
            Entre más pronto actúes, mayor será el descuento que podrás obtener. Contáctanos hoy mismo y nosotros
            hacemos tu Curso de Seguridad Vial por ti, para que ahorres tiempo, dinero y realices tu trámite de forma
            fácil, rápida y segura.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-8 py-4 font-bold text-zinc-950 transition hover:bg-zinc-200"
          >
            Solicitar mi curso por WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
