const beneficios = [
  "Asesoría personalizada.",
  "Acompañamiento de principio a fin.",
  "Revisión previa de documentos.",
  "Gestión eficiente ante organismos de tránsito.",
  "Atención rápida y confiable.",
];

const tramites = [
  {
    title: "Traspaso",
    description:
      "Realiza el cambio de propietario de tu vehículo de forma rápida, segura y sin complicaciones. Te asesoramos durante todo el proceso para que el trámite cumpla con todos los requisitos legales y se complete con total tranquilidad.",
    requisitos: [
      "Documento de identidad del comprador y vendedor.",
      "Formulario de trámite diligenciado.",
      "Contrato de compraventa.",
      "Inscripción en el RUNT.",
      "Licencia de tránsito.",
      "SOAT vigente.",
      "Revisión técnico-mecánica (cuando aplique).",
      "Paz y salvo de multas e impuestos.",
      "Pago de derechos del trámite.",
    ],
    importante: "Nuestro equipo verifica previamente toda la documentación para evitar rechazos o demoras.",
  },
  {
    title: "Duplicado de placas",
    description:
      "¿Perdiste tus placas o están deterioradas? Gestionamos el trámite para obtener el duplicado de manera ágil, permitiéndote volver a circular con toda la documentación en regla.",
    requisitos: [
      "Documento de identidad.",
      "Formulario de trámite.",
      "Inscripción en el RUNT.",
      "SOAT vigente.",
      "Pago de derechos.",
    ],
    importante: "Si el motivo es deterioro, entrega las placas originales.",
  },
  {
    title: "Duplicado de licencia de tránsito",
    description:
      "Si tu tarjeta de propiedad fue extraviada, hurtada o está deteriorada, te ayudamos a obtener un nuevo documento de forma rápida para que continúes realizando tus trámites sin inconvenientes.",
    requisitos: ["Documento de identidad.", "Formulario.", "RUNT.", "SOAT.", "Pago del trámite."],
    importante: "Te indicamos si necesitas documentos adicionales.",
  },
  {
    title: "Inscripción de prenda",
    description:
      "Registra la prenda de tu vehículo de manera segura y conforme a la normativa vigente. Nuestro equipo te acompaña en cada paso para que el proceso sea ágil y sin errores.",
    requisitos: ["Documento de identidad.", "Contrato de prenda.", "Licencia de tránsito.", "RUNT.", "SOAT."],
    importante: "Ideal para créditos vehiculares.",
  },
  {
    title: "Levantamiento de prenda",
    description:
      "Una vez cancelada tu obligación financiera, gestionamos el levantamiento de prenda para que tu vehículo quede libre de limitaciones y puedas realizar cualquier trámite sin restricciones.",
    requisitos: ["Documento de identidad.", "Carta del acreedor.", "Licencia de tránsito.", "RUNT.", "Pago del trámite."],
    importante: "Verificamos previamente la autorización del acreedor.",
  },
  {
    title: "Inscripción al RUNT",
    description:
      "Realiza tu inscripción al RUNT de forma fácil y rápida. Este es el primer paso para acceder a los diferentes trámites de tránsito en Colombia, y te acompañamos durante todo el proceso.",
    requisitos: ["Documento de identidad.", "Datos personales.", "Pago del trámite."],
    importante: "La inscripción solo se realiza una vez.",
  },
  {
    title: "Cambio de color",
    description:
      "Actualiza el nuevo color de tu vehículo ante el organismo de tránsito y mantén toda tu documentación al día. Nosotros nos encargamos de gestionar el trámite para que conduzcas con total tranquilidad.",
    requisitos: ["Documento de identidad.", "Licencia de tránsito.", "SOAT.", "Formulario.", "Pago del trámite."],
    importante: "Evita inconvenientes en controles de tránsito.",
  },
];

export default function Tramites({ nav, whatsappNumber = "573175792923" }) {
  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-zinc-950 text-white">
      {nav}

      <section className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Trámites</p>
        <h2 className="text-4xl font-black tracking-tight md:text-5xl">Trámites vehiculares</h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-300">
          Realiza tus trámites de tránsito con el respaldo de un equipo experto. Te acompañamos durante todo el
          proceso para que tu gestión sea rápida, segura y sin complicaciones.
        </p>

        <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tramites.map((tramite) => (
            <article
              key={tramite.title}
              className="flex flex-col rounded-[2rem] border border-white/10 bg-white/[0.06] p-6"
            >
              <h3 className="text-2xl font-bold">{tramite.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{tramite.description}</p>

              <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-amber-300">Requisitos</p>
              <ul className="mt-3 space-y-2 text-sm text-zinc-300">
                {tramite.requisitos.map((requisito) => (
                  <li key={requisito} className="flex gap-2">
                    <span className="text-amber-300">•</span>
                    <span>{requisito}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 rounded-2xl bg-amber-300/10 px-4 py-3">
                <p className="text-sm leading-6 text-amber-200">
                  <span className="font-bold">Importante:</span> {tramite.importante}
                </p>
              </div>

              <a
                href={
                  "https://wa.me/" +
                  whatsappNumber +
                  "?text=" +
                  encodeURIComponent(`Hola, necesito información sobre el trámite de ${tramite.title}.`)
                }
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-zinc-950 transition hover:bg-zinc-200"
              >
                Preguntar por este trámite
              </a>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
