// Recorta el logo para usarlo como cabecera de los correos de Auth.
//
// El original (public/jpm-logo.jpeg.jpg) es 16:9 con mucho aire arriba y
// abajo: puesto a lo ancho de un correo quedaría de casi 300 px de alto y se
// comería la pantalla antes del mensaje. Aquí se deja solo la zona con el
// carro, el nombre y la línea de "siempre marcando la diferencia".
//
// Sale al doble del tamaño en que se muestra (1040 px para mostrarse a 520)
// para que no se vea borroso en pantallas retina.
//
// Uso: node scripts/generate-email-logo.mjs

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const origen = join(publicDir, "jpm-logo.jpeg.jpg");
const destino = join(publicDir, "email-logo.jpg");

const { width, height } = await sharp(origen).metadata();

// Proporciones sobre el original, para que el recorte siga sirviendo aunque
// algún día cambien el archivo por uno de otro tamaño.
const recorte = {
  left: Math.round(width * 0.06),
  top: Math.round(height * 0.16),
  width: Math.round(width * 0.88),
  height: Math.round(height * 0.55),
};

await sharp(origen)
  .extract(recorte)
  .resize({ width: 1040 })
  .jpeg({ quality: 88 })
  .toFile(destino);

const salida = await sharp(destino).metadata();
console.log(`generado ${destino} (${salida.width}x${salida.height})`);
