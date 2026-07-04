// Vista previa por carro para redes (WhatsApp, Facebook, etc.).
// Solo los robots de redes llegan aquí (ver el "has: user-agent" en vercel.json);
// los usuarios normales reciben el sitio estático de siempre.
// La función lee el vehículo de Supabase y devuelve el HTML con las etiquetas Open Graph.

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vnpzukvsnizsgxunwqbz.supabase.co";
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_vkvbHLkuRp9nP7qaBwW17w_CNEAQ9lb";

  const host = req.headers["x-forwarded-host"] || req.headers.host || "jpmvehiculos.com";
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0];
  const origin = `${proto}://${host}`;

  const slugid = String((req.query && req.query.slugid) || "").replace(/\/+$/, "");
  const shortId = slugid.split("-").pop();

  const esc = (value) =>
    String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  let vehicle = null;
  try {
    if (shortId) {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/vehicles?select=id,name,description,image,price_number,city,year&limit=500`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      );
      if (response.ok) {
        const rows = await response.json();
        if (Array.isArray(rows)) vehicle = rows.find((row) => String(row.id).startsWith(shortId));
      }
    }
  } catch (error) {
    // Si Supabase falla, caemos a la vista previa genérica del sitio.
  }

  const pageUrl = `${origin}/vehiculo/${slugid}`;
  let title = "JPM Vehículos";
  let description = "Compra y venta de vehículos en Barranquilla.";
  let image = `${origin}/jpm-logo.jpeg.jpg`;

  if (vehicle) {
    const price = new Intl.NumberFormat("es-CO").format(Number(vehicle.price_number || 0));
    title = `${vehicle.name} · $${price}`;
    description = vehicle.description
      ? String(vehicle.description).slice(0, 180)
      : `${vehicle.name} en venta en ${vehicle.city || "Barranquilla"}. JPM Vehículos.`;
    image = vehicle.image || image;
  }

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)} | JPM Vehículos</title>
<meta name="description" content="${esc(description)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="JPM Vehículos" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(pageUrl)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
<link rel="canonical" href="${esc(pageUrl)}" />
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(pageUrl)}">Ver en JPM Vehículos</a></p>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=300, stale-while-revalidate=86400");
  res.status(200).send(html);
}
