// Mapa del sitio dinámico: incluye inicio, /vehiculos y cada carro (leídos de Supabase).
// Se sirve en /sitemap.xml (ver rewrite en vercel.json).

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://vnpzukvsnizsgxunwqbz.supabase.co";
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_vkvbHLkuRp9nP7qaBwW17w_CNEAQ9lb";
  const origin = "https://jpmvehiculos.com";

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
      `${SUPABASE_URL}/rest/v1/vehicles?select=id,name,created_at&order=created_at.desc&limit=1000`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (response.ok) {
      const rows = await response.json();
      if (Array.isArray(rows)) vehicles = rows;
    }
  } catch (error) {
    // Si Supabase falla, servimos al menos las páginas principales.
  }

  const urls = [
    { loc: `${origin}/`, priority: "1.0" },
    { loc: `${origin}/vehiculos`, priority: "0.9" },
    ...vehicles.map((vehicle) => ({
      loc: `${origin}/vehiculo/${slugify(vehicle.name)}-${String(vehicle.id).slice(0, 8)}`,
      priority: "0.8",
      lastmod: vehicle.created_at ? new Date(vehicle.created_at).toISOString().slice(0, 10) : "",
    })),
  ];

  const body = urls
    .map(
      (url) =>
        `  <url><loc>${url.loc}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}<priority>${url.priority}</priority></url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400");
  res.status(200).send(xml);
}
