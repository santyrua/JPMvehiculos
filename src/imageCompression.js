const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

export async function compressImage(file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise((resolve, reject) =>
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("No se pudo comprimir la imagen"))), "image/jpeg", quality)
  );

  const compressedName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
  return new File([blob], compressedName, { type: "image/jpeg" });
}
