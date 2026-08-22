// Vista previa por página para redes y buscadores (WhatsApp, Facebook, Google, etc.).
// Cubre el catálogo (/vehiculos) y las páginas fijas: Trámites, Crédito, Seguros y Comparendos.
// Solo los robots llegan aquí (ver los rewrites con "has: user-agent" en vercel.json);
// los usuarios normales reciben el sitio estático de siempre.
// Devuelve HTML con Open Graph + datos estructurados (JSON-LD). La imagen es un banner
// propio en /public (ver scripts/generate-og.mjs).
// El catálogo además lista los carros reales de Supabase, para que Google indexe /vehiculos
// como una página propia con contenido y no como un duplicado del inicio.

const PAGES = {
  vehiculos: {
    path: "/vehiculos",
    title: "Carros y camionetas usadas en venta en Barranquilla | JPM Vehículos",
    description:
      "Catálogo de vehículos usados en Barranquilla: carros, camionetas y motos con fotos, precio, año y kilometraje. Crédito vehicular y asesoría directa por WhatsApp.",
    image: "/og-vehiculos.jpg",
    name: "Catálogo de vehículos",
    listVehicles: true,
  },
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

  // JSON.stringify no escapa "<", así que un "</script>" dentro de los datos cerraría
  // la etiqueta antes de tiempo. Se reemplazan por escapes unicode, que siguen siendo
  // JSON válido y los lectores de datos estructurados entienden igual.
  const jsonLd = (data) =>
    JSON.stringify(data)
      .replace(/</g, "\\u003c")
      .replace(/>/g, "\\u003e")
      .replace(/&/g, "\\u0026");

  const pageUrl = `${origin}${page.path}`;
  const image = `${origin}${page.image}`;

  const provider = {
    "@type": "AutoDealer",
    name: "JPM Vehículos",
    url: `${origin}/`,
    telephone: "+573175792923",
    image: `${origin}/jpm-logo.jpeg.jpg`,
  };

  let bodyExtra = "";
  let ld = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: page.name,
    serviceType: page.name,
    description: page.description,
    url: pageUrl,
    areaServed: { "@type": "City", name: "Barranquilla" },
    provider,
  };

  if (page.listVehicles) {
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vnpzukvsnizsgxunwqbz.supabase.co";
    const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_vkvbHLkuRp9nP7qaBwW17w_CNEAQ9lb";

    const slugify = (text) =>
      String(text || "")
        .toLowerCase()
        .replace(/[áàâä]/g, "a")
        .replace(/[éèêë]/g, "e")
        .replace(/[íìîï]/g, "i")
        .replace(/[óòôö]/g, "o")
        .replace(/[úùûü]/g, "u")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    let vehicles = [];
    try {
      const response = await fetch(
        // El mismo tope que usa el sitemap: con 100 se quedaban por fuera del
        // listado los vehículos más antiguos.
        `${SUPABASE_URL}/rest/v1/vehicles?select=id,name,price_number,year,km,fuel,city,status&order=created_at.desc&limit=1000`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows)) vehicles = rows;
      }
    } catch (error) {
      // Si Supabase falla, servimos la página con su texto fijo y sin listado.
    }

    const vehicleUrl = (vehicle) => `${origin}/vehiculo/${slugify(vehicle.name)}-${String(vehicle.id).slice(0, 8)}`;
    const formatPrice = (value) => `$${new Intl.NumberFormat("es-CO").format(Number(value || 0))}`;

    if (vehicles.length) {
      bodyExtra = `<ul>${vehicles
        .map((vehicle) => {
          const specs = [formatPrice(vehicle.price_number), vehicle.year, vehicle.km, vehicle.fuel, vehicle.city]
            .filter(Boolean)
            .join(" · ");
          const sold = vehicle.status === "Vendido" ? " (Vendido)" : "";
          return `<li><a href="${esc(vehicleUrl(vehicle))}">${esc(vehicle.name)}</a>${esc(sold)} — ${esc(specs)}</li>`;
        })
        .join("")}</ul>`;
    }

    ld = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: page.name,
      description: page.description,
      url: pageUrl,
      isPartOf: { "@type": "WebSite", name: "JPM Vehículos", url: `${origin}/` },
      provider,
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: vehicles.length,
        itemListElement: vehicles.map((vehicle, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: vehicleUrl(vehicle),
          name: vehicle.name,
        })),
      },
    };
  }

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
<script type="application/ld+json">${jsonLd(ld)}</script>
</head>
<body>
<h1>${esc(page.title)}</h1>
<p>${esc(page.description)}</p>
${bodyExtra}
<p><a href="${esc(pageUrl)}">Ver en JPM Vehículos</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
}
