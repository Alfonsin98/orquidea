import { PhotoTargetPart, PhotoVisionMetrics } from '../types/orchid';
import { clamp, rgbToHsv } from './mathUtils';

/**
 * Segmentación cromática en espacio HSV con ponderación espacial central (ROI)
 * para evaluar tejido foliar, velamen radicular y pigmentación floral 100% offline.
 */
export function analyzePixelsRGBA(
  rgba: Uint8Array | Uint8ClampedArray,
  width: number,
  height: number,
  targetPart: PhotoTargetPart
): PhotoVisionMetrics {
  let totalWeight = 0;
  let healthyGreenWeight = 0;
  let darkLowLightGreenWeight = 0;
  let silverDryVelamenWeight = 0;
  let hydratedGreenVelamenWeight = 0;
  let chlorosisWeight = 0;
  let necrosisWeight = 0;
  let anthocyaninWeight = 0;
  let bloomWeight = 0;
  let brightnessAcc = 0;
  let analyzedPixels = 0;

  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.sqrt(cx * cx + cy * cy) || 1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = rgba[idx];
      const g = rgba[idx + 1];
      const b = rgba[idx + 2];
      const a = rgba[idx + 3];
      if (a < 128) continue;

      const { h, s, v } = rgbToHsv(r, g, b);

      // Descartar destellos especulares blancos puros y sombras negras profundas de fondo
      if ((v > 0.96 && s < 0.05) || v < 0.07) {
        continue;
      }

      const distRatio = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxRadius;
      // Dar mayor peso al centro donde el usuario encuadra la hoja o raíz
      const spatialWeight = distRatio < 0.58 ? 1.75 : distRatio < 0.82 ? 1.0 : 0.45;

      // Si evaluamos hojas, filtramos paredes/fondos grises neutros fuera del centro
      if (targetPart === 'hojas' && s < 0.14 && distRatio > 0.45) {
        continue;
      }

      totalWeight += spatialWeight;
      brightnessAcc += v * spatialWeight;
      analyzedPixels++;

      const isGreenHue = h >= 68 && h <= 162;
      const isYellowChloroticHue = h >= 43 && h < 68;
      const isBrownNecrotic =
        (h >= 10 && h < 43 && s >= 0.18 && v < 0.42) || (v < 0.18 && s >= 0.16);
      const isAnthocyaninRedPurple =
        ((h >= 290 && h <= 355) || h < 12) && s >= 0.22 && v >= 0.18 && v <= 0.58;
      const isSilverVelamen = s < 0.20 && v >= 0.42 && v <= 0.90;
      const isVibrantBloom =
        s >= 0.38 && v >= 0.48 && (h >= 250 || h < 42 || (h >= 46 && h <= 64 && v > 0.72));

      if (isGreenHue && s >= 0.20 && v >= 0.18) {
        healthyGreenWeight += spatialWeight;
        hydratedGreenVelamenWeight += spatialWeight;
        if (h > 106 && v < 0.36) {
          darkLowLightGreenWeight += spatialWeight;
        }
      } else if (isYellowChloroticHue && s >= 0.24 && v >= 0.34) {
        chlorosisWeight += spatialWeight;
      } else if (isBrownNecrotic) {
        necrosisWeight += spatialWeight;
      } else if (isAnthocyaninRedPurple) {
        anthocyaninWeight += spatialWeight;
      } else if (isSilverVelamen) {
        silverDryVelamenWeight += spatialWeight;
      }

      if (isVibrantBloom) {
        bloomWeight += spatialWeight;
      }
    }
  }

  const denom = Math.max(1e-5, totalWeight);
  const greenRatio = healthyGreenWeight / denom;
  const darkGreenRatio = darkLowLightGreenWeight / Math.max(1e-5, healthyGreenWeight);
  const chlorosisRatio = clamp(chlorosisWeight / denom, 0, 1);
  const necrosisRatio = clamp(necrosisWeight / denom, 0, 1);
  const anthocyaninRatio = clamp(anthocyaninWeight / denom, 0, 1);
  const bloomPigmentRatio = clamp(bloomWeight / denom, 0, 1);
  const brightnessMean = clamp(brightnessAcc / denom, 0, 1);

  // Vigor de clorofila: premia verde saludable y penaliza clorosis/necrosis
  const rawGreenVigor =
    greenRatio * 125 - chlorosisRatio * 55 - necrosisRatio * 75 + (targetPart === 'flores' ? 35 : 12);
  const greenVigorScore = Math.round(clamp(rawGreenVigor, 8, 98));

  // Hidratación del velamen: compara raíces verdes hidratadas vs raíces plateadas secas vs marrones
  const velamenDenom = Math.max(
    1e-5,
    hydratedGreenVelamenWeight + silverDryVelamenWeight + necrosisWeight * 0.6
  );
  const rawVelamenHydration =
    (hydratedGreenVelamenWeight / velamenDenom) * 92 +
    (silverDryVelamenWeight / velamenDenom) * 24 -
    (necrosisWeight / velamenDenom) * 18;
  const velamenHydrationScore = Math.round(clamp(rawVelamenHydration, 10, 96));

  const detectedSignals: string[] = [];

  if (targetPart === 'raices') {
    if (velamenHydrationScore >= 64 && necrosisRatio < 0.16) {
      detectedSignals.push('Velamen verde brillante: raíces bien hidratadas (aún no requiere riego)');
    } else if (velamenHydrationScore <= 42 && necrosisRatio < 0.20) {
      detectedSignals.push('Velamen gris/plateado dominante: raíces secas listas para próximo riego');
    }
    if (necrosisRatio >= 0.20) {
      detectedSignals.push(
        'Tonos marrones oscuros elevados en zona radicular: revisar firmeza por posible pudrición'
      );
    }
  } else if (targetPart === 'flores') {
    if (bloomPigmentRatio >= 0.18) {
      detectedSignals.push('Alta saturación cromática floral detectada: pétalos vigorosos y turgentes');
    } else {
      detectedSignals.push('Tonalidad suave o floración blanca/crema registrada correctamente');
    }
  } else {
    // Hojas o planta completa
    if (greenVigorScore >= 68 && chlorosisRatio < 0.12 && necrosisRatio < 0.10) {
      if (darkGreenRatio > 0.55) {
        detectedSignals.push(
          'Clorofila densa color verde muy oscuro: saludable, pero podría necesitar más luz filtrada para florecer'
        );
      } else {
        detectedSignals.push('Tonalidad verde manzana óptima: excelente balance entre luz e hidratación');
      }
    }
    if (chlorosisRatio >= 0.14) {
      detectedSignals.push(
        `Clorosis/amarilleo detectado (${Math.round(chlorosisRatio * 100)}%): evaluar exceso de sol, hoja basal vieja o falta de nitrógeno/magnesio`
      );
    }
    if (anthocyaninRatio >= 0.10) {
      detectedSignals.push(
        `Pigmentación rojiza/antocianina (${Math.round(anthocyaninRatio * 100)}%): respuesta protectora a radiación lumínica alta`
      );
    }
    if (necrosisRatio >= 0.15) {
      detectedSignals.push(
        `Zonas oscuras/necróticas (${Math.round(necrosisRatio * 100)}%): vigilar quemadura solar o mancha fúngica`
      );
    }
  }

  if (detectedSignals.length === 0) {
    detectedSignals.push(
      `Tejido registrado (vigor cromático ${greenVigorScore}/100) incorporado al historial ML`
    );
  }

  const summary = detectedSignals[0];

  return {
    targetPart,
    greenVigorScore,
    velamenHydrationScore,
    chlorosisRatio: Number(chlorosisRatio.toFixed(3)),
    necrosisRatio: Number(necrosisRatio.toFixed(3)),
    anthocyaninRatio: Number(anthocyaninRatio.toFixed(3)),
    bloomPigmentRatio: Number(bloomPigmentRatio.toFixed(3)),
    brightnessMean: Number(brightnessMean.toFixed(3)),
    analyzedPixels,
    summary,
    detectedSignals,
  };
}

