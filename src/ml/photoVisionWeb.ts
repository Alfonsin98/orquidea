import { PhotoTargetPart, PhotoVisionMetrics } from '../types/orchid';
import { analyzePixelsRGBA } from './pixelSegmentation';

export { analyzePixelsRGBA };

/**
 * Carga cualquier origen de imagen (File, Blob o dataUrl string) en un HTMLImageElement.
 */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen para su procesamiento.'));
    };
  });
}

/**
 * Optimiza y redimensiona una imagen manteniendo alta definición (hasta 1600px en el lado mayor)
 * con compresión JPEG de alta fidelidad (calidad 0.88).
 * Esto produce imágenes nítidas en pantallas Retina/iPhone (sin pixelación al ampliar)
 * ocupando un tamaño liviano (~180KB-320KB) en IndexedDB.
 */
export async function optimizeImageForWeb(
  imageSource: File | Blob | string,
  maxDimension = 1600,
  quality = 0.88
): Promise<string> {
  const img = await loadImage(imageSource);

  let width = img.naturalWidth || img.width || 800;
  let height = img.naturalHeight || img.height || 600;

  // Redimensionar solo si excede el tamaño máximo, preservando la proporción exacta
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el lienzo Canvas para optimizar la imagen.');
  }

  // Activar suavizado bicúbico de alta calidad
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Procesa la foto en dos canales independientes:
 * 1. Canal Visual HD (1600px): Imagen nítida para la galería, comparación y zoom sin pixelado.
 * 2. Canal Machine Learning (96x96): Miniatura en canvas auxiliar para segmentación cromática ultrarrápida.
 */
export async function analyzePhotoInBrowser(
  imageSource: File | Blob | string,
  targetPart: PhotoTargetPart
): Promise<{ metrics: PhotoVisionMetrics; previewDataUrl: string; highResDataUrl: string }> {
  // Cargar imagen original completa
  const img = await loadImage(imageSource);

  // 1. Generar imagen optimizada en Alta Definición (hasta 1600px)
  let hdWidth = img.naturalWidth || img.width || 800;
  let hdHeight = img.naturalHeight || img.height || 600;
  const maxHdDim = 1600;

  if (hdWidth > maxHdDim || hdHeight > maxHdDim) {
    if (hdWidth > hdHeight) {
      hdHeight = Math.round((hdHeight * maxHdDim) / hdWidth);
      hdWidth = maxHdDim;
    } else {
      hdWidth = Math.round((hdWidth * maxHdDim) / hdHeight);
      hdHeight = maxHdDim;
    }
  }

  const hdCanvas = document.createElement('canvas');
  hdCanvas.width = hdWidth;
  hdCanvas.height = hdHeight;
  const hdCtx = hdCanvas.getContext('2d');
  if (!hdCtx) {
    throw new Error('No se pudo crear el lienzo Canvas HD.');
  }
  hdCtx.imageSmoothingEnabled = true;
  hdCtx.imageSmoothingQuality = 'high';
  hdCtx.drawImage(img, 0, 0, hdWidth, hdHeight);

  const highResDataUrl = hdCanvas.toDataURL('image/jpeg', 0.88);

  // 2. Canal de Visión por Computadora (Canvas 96x96 ultrarrápido en el procesador del móvil)
  const mlCanvas = document.createElement('canvas');
  mlCanvas.width = 96;
  mlCanvas.height = 96;
  const mlCtx = mlCanvas.getContext('2d', { willReadFrequently: true });
  if (!mlCtx) {
    throw new Error('No se pudo inicializar el Canvas de visión artificial.');
  }

  mlCtx.drawImage(img, 0, 0, 96, 96);
  const imageData = mlCtx.getImageData(0, 0, 96, 96);

  const metrics = analyzePixelsRGBA(imageData.data, 96, 96, targetPart);

  return {
    metrics,
    previewDataUrl: highResDataUrl, // Asignamos la versión HD como previewDataUrl para máxima nitidez
    highResDataUrl,
  };
}
