import { PhotoTargetPart, PhotoVisionMetrics } from '../types/orchid';
import { analyzePixelsRGBA } from './pixelSegmentation';

/**
 * Carga una imagen (File o base64) en un Canvas HTML5 offscreen redimensionado a 96x96,
 * extrae los píxeles RGBA nativos y ejecuta la segmentación cromática en el procesador del teléfono.
 */
export async function analyzePhotoInBrowser(
  imageSource: File | Blob | string,
  targetPart: PhotoTargetPart
): Promise<{ metrics: PhotoVisionMetrics; previewDataUrl: string }> {
  let dataUrl: string;

  if (typeof imageSource === 'string') {
    dataUrl = imageSource;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    });
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('No se pudo cargar la imagen para análisis.'));
    img.src = dataUrl;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto Canvas 2D en el navegador.');
  }

  // Dibujar redimensionando a 96x96 para procesamiento ultra-rápido en móviles
  ctx.drawImage(img, 0, 0, 96, 96);
  const imageData = ctx.getImageData(0, 0, 96, 96);

  const metrics = analyzePixelsRGBA(imageData.data, 96, 96, targetPart);

  // Crear una miniatura optimizada en JPEG para no saturar IndexedDB
  const previewDataUrl = canvas.toDataURL('image/jpeg', 0.85);

  return { metrics, previewDataUrl };
}
