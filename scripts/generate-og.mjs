// Genera los banners Open Graph (1200x630) de las páginas Trámites, Crédito y Seguros.
// Se rasterizan con sharp a public/og-<slug>.jpg y los sirve api/pagina.js como og:image.
// Uso: node scripts/generate-og.mjs

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const pages = [
  {
    slug: "tramites",
    eyebrow: "Trámites",
    titleLines: ["Trámites", "vehiculares"],
    chips: ["Traspaso", "Placas", "RUNT", "Prendas"],
    domain: "jpmvehiculos.com/tramites",
  },
  {
    slug: "credito",
    eyebrow: "Crédito",
    titleLines: ["Crédito", "vehicular"],
    chips: ["Aprobación ágil", "15+ entidades", "Cuotas a tu medida"],
    domain: "jpmvehiculos.com/credito",
  },
  {
    slug: "seguros",
    eyebrow: "Seguros",
    titleLines: ["Seguro Todo Riesgo", "Vehicular"],
    chips: ["Daños", "Hurto", "Resp. civil", "Asistencia 24h"],
    domain: "jpmvehiculos.com/seguros",
  },
  {
    slug: "comparendos",
    eyebrow: "Comparendos",
    titleLines: ["Curso de", "Seguridad Vial"],
    chips: ["Hasta 50% dto.", "Comparendos", "Fotomultas", "Sin filas"],
    domain: "jpmvehiculos.com/comparendos",
  },
];

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function buildChips(chips, startX, y) {
  const h = 58;
  let x = startX;
  const parts = [];
  for (const text of chips) {
    const w = Math.round(text.length * 15 + 52);
    parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="29" fill="#fbbf24" fill-opacity="0.08" stroke="#fbbf24" stroke-width="2"/>` +
        `<text x="${x + w / 2}" y="${y + 38}" font-family="Arial, sans-serif" font-size="30" fill="#fcd34d" text-anchor="middle">${esc(text)}</text>`
    );
    x += w + 18;
  }
  return parts.join("\n");
}

function buildSvg(p) {
  const [l1, l2] = p.titleLines;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<rect width="1200" height="630" fill="#09090b"/>
<text x="1155" y="475" font-family="Arial, sans-serif" font-weight="700" font-size="360" fill="#ffffff" fill-opacity="0.05" text-anchor="end">JPM</text>
<rect x="0" y="0" width="14" height="630" fill="#fbbf24"/>
<text x="70" y="112" font-family="Arial, sans-serif" font-weight="700" font-size="52" fill="#ffffff">JPM</text>
<text x="186" y="112" font-family="Arial, sans-serif" font-size="24" letter-spacing="6" fill="#fbbf24">VEHÍCULOS</text>
<text x="72" y="232" font-family="Arial, sans-serif" font-weight="700" font-size="30" letter-spacing="8" fill="#fbbf24">${esc(p.eyebrow.toUpperCase())}</text>
<text x="70" y="330" font-family="Arial, sans-serif" font-weight="700" font-size="80" fill="#ffffff">${esc(l1)}</text>
${l2 ? `<text x="70" y="422" font-family="Arial, sans-serif" font-weight="700" font-size="80" fill="#ffffff">${esc(l2)}</text>` : ""}
${buildChips(p.chips, 72, 470)}
<text x="72" y="582" font-family="Arial, sans-serif" font-size="28" fill="#a1a1aa">${esc(p.domain)}</text>
</svg>`;
}

for (const p of pages) {
  const svg = buildSvg(p);
  const out = join(publicDir, `og-${p.slug}.jpg`);
  await sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toFile(out);
  console.log("generado", out);
}
