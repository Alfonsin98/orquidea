import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as jpeg from 'jpeg-js';
import { PhotoTargetPart, PhotoVisionMetrics } from '../types/orchid';
import { base64ToUint8Array } from './mathUtils';
import { analyzePixelsRGBA } from './pixelSegmentation';

export { analyzePixelsRGBA };

/**
 * Redimensiona la foto a una miniatura 96x96 en memoria nativa y ejecuta
 * la segmentación HSV directamente en el teléfono sin enviar datos a internet.
 */
export async function analyzeOrchidPhotoOnDevice(
  photoUri: string,
  targetPart: PhotoTargetPart
): Promise<PhotoVisionMetrics> {
  const manipulatorContext = ImageManipulator.manipulate(photoUri);
  manipulatorContext.resize({ width: 96, height: 96 });
  const renderedRef = await manipulatorContext.renderAsync();
  const saved = await renderedRef.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.9,
    base64: true,
  });

  if (!saved.base64) {
    throw new Error('No se pudo obtener el buffer de imagen local para el análisis visual.');
  }

  const jpegBytes = base64ToUint8Array(saved.base64);
  const decoded = jpeg.decode(jpegBytes, {
    useTArray: true,
    formatAsRGBA: true,
    maxMemoryUsageInMB: 16,
  });

  return analyzePixelsRGBA(decoded.data, decoded.width, decoded.height, targetPart);
}

