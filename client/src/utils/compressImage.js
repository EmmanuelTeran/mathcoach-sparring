/**
 * Utilidades de compresión de imágenes en el cliente.
 *
 * Las fotos de celular pesan 3–12 MB (y ~33% más en Base64). Para la evaluación
 * basta con ~2000 px en el lado mayor: se conserva la legibilidad de la letra manuscrita
 * (incluso con varios ejercicios en una sola hoja) y cada foto queda en ~0.3–0.8 MB.
 */
export const MAX_IMAGE_DIMENSION = 2000;
export const JPEG_QUALITY = 0.82;

/**
 * Dibuja una fuente (video, imagen o bitmap) en un canvas redimensionado y devuelve un dataURL JPEG.
 */
export function drawToCompressedDataUrl(
  source,
  srcWidth,
  srcHeight,
  { maxDimension = MAX_IMAGE_DIMENSION, quality = JPEG_QUALITY } = {}
) {
  const scale = Math.min(1, maxDimension / Math.max(srcWidth, srcHeight));
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D no disponible');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo decodificar la imagen'));
    img.src = src;
  });
}

/**
 * Comprime un File de imagen a dataURL JPEG redimensionado.
 * Respeta la orientación EXIF. Si la compresión falla, devuelve el archivo original como dataURL.
 */
export async function compressImageFile(file, options) {
  try {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        const dataUrl = drawToCompressedDataUrl(bitmap, bitmap.width, bitmap.height, options);
        bitmap.close?.();
        return dataUrl;
      } catch {
        // Fallback a HTMLImageElement
      }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await loadImage(objectUrl);
      return drawToCompressedDataUrl(img, img.naturalWidth, img.naturalHeight, options);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch (err) {
    console.warn('No se pudo comprimir la imagen, se enviará la original:', err);
    return readFileAsDataUrl(file);
  }
}
