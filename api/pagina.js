// Vista previa por página para redes y buscadores (WhatsApp, Facebook, Google, etc.).
// Cubre las páginas fijas: Trámites, Crédito y Seguros.
// Solo los robots llegan aquí (ver los rewrites con "has: user-agent" en vercel.json);
// los usuarios normales reciben el sitio estático de siempre.
// Devuelve HTML con Open Graph + datos estructurados (JSON-LD). La imagen es un banner
// propio en /public (ver scripts/generate-og.mjs).

const PAGES = {
  tramites: {
    path: "/tramites",
    title: "Trámites vehiculares | JPM Vehículos",
    description:
      "Realiza tus trámites de tránsito con respaldo experto: traspaso, duplicado de placas y licencia, prenda, RUNT, cambio de color y más. Gestión rápida y segura en Barranquilla.",
    image: "/og-tramites.jpg",
    name: "Trámites vehiculares",
  },
  credito: {
    path: "/credito",
    title: "Crédito vehicular | JPM Vehículos",
    description:
      "Haz realidad tu vehículo con crédito. Gestionamos tu solicitud con múltiples entidades financieras para conseguir la mejor tasa y plazo. Asesoría personalizada en Barranquilla.",
    image: "/og-credito.jpg",
    name: "Crédito vehicular",
  },
  seguros: {
    path: "/seguros",
    title: "Seguro Todo Riesgo Vehicular | JPM Vehículos",
    description:
      "Protege tu vehículo con el mejor Seguro Todo Riesgo. Comparamos las principales aseguradoras de Colombia (SURA, Allianz, MAPFRE, AXA Colpatria y más) para la mejor cobertura al mejor precio.",
    image: "/og-seguros.jpg",
    name: "Seguro Todo Riesgo Vehicular",
  },
  comparendos: {
    path: "/comparendos",
    title: "Curso de Seguridad Vial y descuento de comparendos | JPM Vehículos",
    description:
      "¿Tienes un comparendo? Hacemos el Curso de Seguridad Vial por ti para que obtengas hasta el 50% de descuento, sin filas ni desplazamientos. Rápido, fácil y seguro en Barranquilla.",
    image: "/og-comparendos.jpg",
    name: "Curso de Seguridad Vial",
  },
};

export default async function handler(req, res) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "jpmvehiculos.com";
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const origin = `${proto}://${host}`;

  const slug = String((req.query && req.query.slug) || "").toLowerCase();
  const page = PAGES[slug];

  if (!page) {
    res.setHeader("Location", `${origin}/`);
    res.status(302).send("");
    return;
  }

  const esc = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const pageUrl = `${origin}${page.path}`;
  const image = `${origin}${page.image}`;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.name,
    serviceType: page.name,
    description: page.description,
    url: pageUrl,
    areaServed: { "@type": "City", name: "Barranquilla" },
    provider: {
      "@type": "AutoDealer",
      name: "JPM Vehículos",
      url: `${origin}/`,
      telephone: "+573175792923",
      image: `${origin}/jpm-logo.jpeg.jpg`,
    },
  };

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="JPM Vehículos" />
<meta property="og:title" content="${esc(page.title)}" />
<meta property="og:description" content="${esc(page.description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(page.title)}" />
<meta name="twitter:description" content="${esc(page.description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head>
<body>
<h1>${esc(page.title)}</h1>
<p>${esc(page.description)}</p>
<p><a href="${esc(pageUrl)}">Ver en JPM Vehículos</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
}
