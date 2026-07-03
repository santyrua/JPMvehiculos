import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const BUCKET = "vehicle-photos";
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 82;
const SIZE_THRESHOLD_BYTES = 450 * 1024;
const CONCURRENCY = 5;

const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const offsetArg = process.argv.find((arg) => arg.startsWith("--offset="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const OFFSET = offsetArg ? Number(offsetArg.split("=")[1]) : 0;
const DRY_RUN = process.argv.includes("--dry-run");

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Corre con: node --env-file=.env.migration scripts/compress-existing-photos.mjs");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const backupDir = path.join("photo-backups", new Date().toISOString().replace(/[:.]/g, "-"));

function extractPath(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length));
}

async function collectPhotoPaths() {
  const { data, error } = await supabase.from("vehicles").select("id,image,photos");
  if (error) throw error;

  const paths = new Set();
  for (const row of data) {
    for (const url of [row.image, ...(row.photos || [])]) {
      const objectPath = url && extractPath(url);
      if (objectPath) paths.add(objectPath);
    }
  }
  return [...paths];
}

async function processPath(objectPath, index, total) {
  const label = `[${index + 1}/${total}] ${objectPath}`;

  const { data: original, error: downloadError } = await supabase.storage.from(BUCKET).download(objectPath);
  if (downloadError) {
    console.error(`${label} -> ERROR descargando: ${downloadError.message}`);
    return { objectPath, status: "error" };
  }

  const originalBuffer = Buffer.from(await original.arrayBuffer());
  const metadata = await sharp(originalBuffer).metadata();
  const needsResize = (metadata.width || 0) > MAX_DIMENSION || (metadata.height || 0) > MAX_DIMENSION;
  const needsCompress = originalBuffer.byteLength > SIZE_THRESHOLD_BYTES;

  if (!needsResize && !needsCompress) {
    console.log(`${label} -> ya optimizada (${(originalBuffer.byteLength / 1024).toFixed(0)} KB), se omite`);
    return { objectPath, status: "skipped" };
  }

  const compressedBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();

  const savedPct = (100 * (1 - compressedBuffer.byteLength / originalBuffer.byteLength)).toFixed(0);
  console.log(
    `${label} -> ${(originalBuffer.byteLength / 1024 / 1024).toFixed(2)} MB -> ${(compressedBuffer.byteLength / 1024).toFixed(0)} KB (-${savedPct}%)`
  );

  if (DRY_RUN) {
    return { objectPath, status: "dry-run", before: originalBuffer.byteLength, after: compressedBuffer.byteLength };
  }

  await fs.mkdir(path.dirname(path.join(backupDir, objectPath)), { recursive: true });
  await fs.writeFile(path.join(backupDir, objectPath), originalBuffer);

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, compressedBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (uploadError) {
    console.error(`${label} -> ERROR subiendo: ${uploadError.message}`);
    return { objectPath, status: "error" };
  }

  return { objectPath, status: "compressed", before: originalBuffer.byteLength, after: compressedBuffer.byteLength };
}

async function runPool(items, worker, concurrency) {
  const results = [];
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const currentIndex = cursor++;
      results[currentIndex] = await worker(items[currentIndex], currentIndex, items.length);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, next));
  return results;
}

async function main() {
  console.log("Buscando fotos en la tabla vehicles...");
  const allPaths = await collectPhotoPaths();
  const paths = allPaths.slice(OFFSET, OFFSET + LIMIT);

  console.log(`${allPaths.length} fotos únicas encontradas. Procesando ${paths.length}${DRY_RUN ? " (dry-run, sin subir cambios)" : ""}.`);
  if (!DRY_RUN) console.log(`Respaldo de originales en: ${backupDir}`);

  const results = await runPool(paths, processPath, CONCURRENCY);

  const compressed = results.filter((r) => r.status === "compressed" || r.status === "dry-run");
  const skipped = results.filter((r) => r.status === "skipped").length;
  const errors = results.filter((r) => r.status === "error").length;
  const beforeTotal = compressed.reduce((sum, r) => sum + r.before, 0);
  const afterTotal = compressed.reduce((sum, r) => sum + r.after, 0);

  console.log("\n=== Resumen ===");
  console.log(`Procesadas: ${compressed.length} | Omitidas (ya optimizadas): ${skipped} | Errores: ${errors}`);
  if (compressed.length > 0) {
    console.log(`Peso total: ${(beforeTotal / 1024 / 1024).toFixed(1)} MB -> ${(afterTotal / 1024 / 1024).toFixed(1)} MB`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
