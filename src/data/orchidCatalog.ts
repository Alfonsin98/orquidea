import {
  FertilizerDose,
  FertilizerType,
  GrowthStage,
  LeafCondition,
  LightLevel,
  OrchidGenus,
  PseudobulbCondition,
  RootCondition,
  SubstrateType,
  VentilationLevel,
  WateringMethod,
} from '../types/orchid';

export interface GenusProfile {
  genus: OrchidGenus;
  commonName: string;
  growthHabit: 'monopodial' | 'simpodial';
  hasPseudobulbs: boolean;
  baseWaterDays: number; // Intervalo base en corteza a 22°C y 60% HR
  baseFertilizeDays: number;
  idealTempDayRangeC: [number, number];
  idealTempNightRangeC: [number, number];
  bloomDeltaTempC: number; // Diferencial día-noche que induce vara floral
  idealHumidityRangePct: [number, number];
  preferredLight: LightLevel[];
  preferredSubstrates: SubstrateType[];
  droughtTolerance: number; // 0..1
  rotSensitivity: number; // 0..1
  requiresWinterRest: boolean;
  velamenNote: string;
  bloomTriggerSummary: string;
  expertTips: string[];
}

export const ORCHID_CATALOG: Record<OrchidGenus, GenusProfile> = {
  Phalaenopsis: {
    genus: 'Phalaenopsis',
    commonName: 'Orquídea Mariposa',
    growthHabit: 'monopodial',
    hasPseudobulbs: false,
    baseWaterDays: 8,
    baseFertilizeDays: 14,
    idealTempDayRangeC: [20, 28],
    idealTempNightRangeC: [15, 20],
    bloomDeltaTempC: 5.5,
    idealHumidityRangePct: [50, 75],
    preferredLight: ['sombra_luminosa', 'luz_filtrada_brillante', 'luz_artificial_led'],
    preferredSubstrates: ['corteza_pino', 'mixto_corteza_musgo', 'arcilla_expandida'],
    droughtTolerance: 0.55,
    rotSensitivity: 0.72,
    requiresWinterRest: false,
    velamenNote:
      'Sus raíces fotosintetizan: riega solo cuando el velamen pase de verde brillante a gris plateado y evita agua acumulada en la corona central.',
    bloomTriggerSummary:
      'Descenso nocturno a 15–17 °C durante 3 a 4 semanas con diferencial día/noche ≥ 5 °C y buena luz filtrada sin sol directo.',
    expertTips: [
      'Usa maceta transparente con ranuras laterales para vigilar el cambio del velamen a tono plateado.',
      'Seca con papel absorbente cualquier gota atrapada en el centro (corona) para evitar pudrición bacteriana.',
      'No cortes una vara floral mientras siga verde: puede ramificar desde un nudo dormido.',
    ],
  },
  Cattleya: {
    genus: 'Cattleya',
    commonName: 'Reina de las Orquídeas',
    growthHabit: 'simpodial',
    hasPseudobulbs: true,
    baseWaterDays: 7,
    baseFertilizeDays: 14,
    idealTempDayRangeC: [22, 30],
    idealTempNightRangeC: [13, 18],
    bloomDeltaTempC: 7,
    idealHumidityRangePct: [50, 70],
    preferredLight: ['luz_filtrada_brillante', 'sol_matutino_suave'],
    preferredSubstrates: ['corteza_pino', 'piedra_volcanica', 'montada_corcho'],
    droughtTolerance: 0.82,
    rotSensitivity: 0.78,
    requiresWinterRest: true,
    velamenNote:
      'Necesita ciclo seco-húmedo marcado: el sustrato debe secarse por completo entre riegos para proteger su velamen grueso.',
    bloomTriggerSummary:
      'Luz brillante (hojas verde manzana claro, nunca verde muy oscuro) + marcado diferencial térmico día/noche de 7–9 °C al madurar el nuevo pseudobulbo.',
    expertTips: [
      'Si las hojas son verde botella muy oscuro, le falta luz y difícilmente florecerá.',
      'Trasplanta únicamente cuando veas brotar puntas de raíces nuevas en la base del pseudobulbo delantero.',
      'Utiliza corteza gruesa o roca volcánica de drenaje rápido; detesta el sustrato viejo compactado.',
    ],
  },
  Dendrobium: {
    genus: 'Dendrobium',
    commonName: 'Orquídea de Caña (Nobile / Phalaenopsis)',
    growthHabit: 'simpodial',
    hasPseudobulbs: true,
    baseWaterDays: 7,
    baseFertilizeDays: 14,
    idealTempDayRangeC: [18, 28],
    idealTempNightRangeC: [10, 17],
    bloomDeltaTempC: 7.5,
    idealHumidityRangePct: [50, 70],
    preferredLight: ['luz_filtrada_brillante', 'sol_matutino_suave'],
    preferredSubstrates: ['corteza_pino', 'arcilla_expandida', 'montada_corcho'],
    droughtTolerance: 0.8,
    rotSensitivity: 0.68,
    requiresWinterRest: true,
    velamenNote:
      'Raíces finas que prefieren macetas pequeñas y ajustadas; exceso de espacio retiene humedad peligrosa.',
    bloomTriggerSummary:
      'Reducción de riegos y suspensión de nitrógeno en otoño-invierno junto con noches frescas (10–14 °C) para evitar keikis en vez de flores.',
    expertTips: [
      'Si abonas con nitrógeno en invierno, producirá hijuelos (keikis) en las cañas en lugar de botones florales.',
      'No elimines las cañas antiguas sin hojas: funcionan como reserva energética e hídrica.',
      'Mantén macetas estrechas para que las raíces sequen en 48–72 horas.',
    ],
  },
  Oncidium: {
    genus: 'Oncidium',
    commonName: 'Dama Danzante / Lluvia de Oro',
    growthHabit: 'simpodial',
    hasPseudobulbs: true,
    baseWaterDays: 5,
    baseFertilizeDays: 12,
    idealTempDayRangeC: [19, 27],
    idealTempNightRangeC: [13, 18],
    bloomDeltaTempC: 6,
    idealHumidityRangePct: [55, 75],
    preferredLight: ['luz_filtrada_brillante', 'sombra_luminosa'],
    preferredSubstrates: ['mixto_corteza_musgo', 'corteza_pino'],
    droughtTolerance: 0.45,
    rotSensitivity: 0.65,
    requiresWinterRest: false,
    velamenNote:
      'Raíces muy delgadas: riega cuando el sustrato esté casi seco pero antes de que los pseudobulbos se arruguen.',
    bloomTriggerSummary:
      'Maduración completa del pseudobulbo nuevo con luz brillante filtrada y humedad constante sin sequías severas.',
    expertTips: [
      'Hojas nuevas plegadas en acordeón indican falta de riego o baja humedad durante el crecimiento.',
      'Las manchas diminutas negras en algunas alianzas Oncidium bajo luz alta pueden ser pigmentación natural, pero vigila si tienen halo amarillo.',
      'Cambia a fertilizante rico en fósforo y potasio cuando el nuevo pseudobulbo empiece a engrosar.',
    ],
  },
  Vanda: {
    genus: 'Vanda',
    commonName: 'Orquídea Aérea Vanda',
    growthHabit: 'monopodial',
    hasPseudobulbs: false,
    baseWaterDays: 2,
    baseFertilizeDays: 7,
    idealTempDayRangeC: [23, 32],
    idealTempNightRangeC: [16, 22],
    bloomDeltaTempC: 6,
    idealHumidityRangePct: [65, 85],
    preferredLight: ['sol_matutino_suave', 'luz_filtrada_brillante'],
    preferredSubstrates: ['montada_corcho', 'corteza_pino', 'piedra_volcanica'],
    droughtTolerance: 0.5,
    rotSensitivity: 0.45,
    requiresWinterRest: false,
    velamenNote:
      'Cultivada a raíz desnuda o en canasta muy aireada: requiere remojos frecuentes (diarios en verano) con ventilación alta.',
    bloomTriggerSummary:
      'Alta intensidad lumínica, calor diurno, alta humedad ambiental (≥ 65%) y nutrición débil pero frecuente ("weakly, weekly").',
    expertTips: [
      'Riega por la mañana para que las raíces y axilas foliares estén secas al anochecer.',
      'Sumerge las raíces 15–20 minutos en agua tibia en días secos para saturar bien el velamen.',
      'Requiere mucha más luz y circulación de aire que una Phalaenopsis.',
    ],
  },
  Miltoniopsis: {
    genus: 'Miltoniopsis',
    commonName: 'Orquídea Pensamiento',
    growthHabit: 'simpodial',
    hasPseudobulbs: true,
    baseWaterDays: 4,
    baseFertilizeDays: 14,
    idealTempDayRangeC: [17, 24],
    idealTempNightRangeC: [12, 16],
    bloomDeltaTempC: 5,
    idealHumidityRangePct: [65, 80],
    preferredLight: ['sombra_luminosa', 'luz_artificial_led'],
    preferredSubstrates: ['mixto_corteza_musgo', 'musgo_sphagnum'],
    droughtTolerance: 0.25,
    rotSensitivity: 0.75,
    requiresWinterRest: false,
    velamenNote:
      'Raíces sensibles a sales y sequía: nunca dejes secar al 100% el sustrato y usa agua baja en minerales.',
    bloomTriggerSummary:
      'Ambiente fresco (< 25 °C), humedad ambiental alta con ventilación constante y luz suave uniforme.',
    expertTips: [
      'Es muy sensible a la acumulación de sales: aplica fertilizante a 1/4 de dosis y lava el sustrato con agua pura una vez al mes.',
      'Evita temperaturas mayores a 27 °C y aire seco, que frenan la floración y pliegan las hojas.',
      'Trasplanta cada 12–15 meses con corteza fina fresca y hebras de sphagnum.',
    ],
  },
  Paphiopedilum: {
    genus: 'Paphiopedilum',
    commonName: 'Zapatito de Dama',
    growthHabit: 'simpodial',
    hasPseudobulbs: false,
    baseWaterDays: 5,
    baseFertilizeDays: 18,
    idealTempDayRangeC: [18, 26],
    idealTempNightRangeC: [13, 18],
    bloomDeltaTempC: 5.5,
    idealHumidityRangePct: [55, 75],
    preferredLight: ['sombra_luminosa', 'sombra_baja', 'luz_artificial_led'],
    preferredSubstrates: ['mixto_corteza_musgo', 'corteza_pino'],
    droughtTolerance: 0.28,
    rotSensitivity: 0.76,
    requiresWinterRest: false,
    velamenNote:
      'Terrestre/litófita sin pseudobulbos: sus raíces peludas marrones son normales y necesitan humedad ligera constante sin encharcar.',
    bloomTriggerSummary:
      'Maduración de un abanico foliar nuevo + ligero descenso nocturno de otoño durante 3–4 semanas y aporte regular de calcio/magnesio.',
    expertTips: [
      'A diferencia de Phalaenopsis, las raíces sanas de Paphiopedilum son café claro con vellosidades absorbentes, no plateadas/verdes.',
      'Como carece de pseudobulbos, nunca debe quedarse completamente seco por varios días.',
      'Agradece suplementos suaves de calcio y magnesio para fortalecer nuevas rosetas.',
    ],
  },
  Cymbidium: {
    genus: 'Cymbidium',
    commonName: 'Orquídea Barco / Cymbidium',
    growthHabit: 'simpodial',
    hasPseudobulbs: true,
    baseWaterDays: 6,
    baseFertilizeDays: 12,
    idealTempDayRangeC: [16, 25],
    idealTempNightRangeC: [7, 14],
    bloomDeltaTempC: 9,
    idealHumidityRangePct: [45, 70],
    preferredLight: ['sol_matutino_suave', 'luz_filtrada_brillante'],
    preferredSubstrates: ['corteza_pino', 'mixto_corteza_musgo'],
    droughtTolerance: 0.65,
    rotSensitivity: 0.58,
    requiresWinterRest: true,
    velamenNote:
      'Sistema radicular vigoroso y carnoso: requiere macetas profundas, buen riego en verano y menos agua en invierno fresco.',
    bloomTriggerSummary:
      'Gran salto térmico día/noche (8–12 °C) a fines de verano/otoño con noches frescas (8–12 °C) y luz exterior intensa filtrada.',
    expertTips: [
      'El error #1 por el que no florece un Cymbidium es mantenerlo todo el año dentro de casa con noches cálidas (> 16 °C).',
      'En primavera-verano consume abundante agua y fertilizante equilibrado; en otoño cambia a bajo nitrógeno.',
      'Protege las varas florales en formación de babosas y cambios bruscos de calor interior.',
    ],
  },
};

export const SUBSTRATE_RETENTION_FACTOR: Record<
  SubstrateType,
  { label: string; factor: number; maxRecommendedMonths: number; description: string }
> = {
  corteza_pino: {
    label: 'Corteza de pino',
    factor: 1.0,
    maxRecommendedMonths: 22,
    description: 'Aireación alta y drenaje equilibrado. Ideal para epífitas.',
  },
  musgo_sphagnum: {
    label: 'Musgo Sphagnum',
    factor: 1.65,
    maxRecommendedMonths: 12,
    description: 'Alta retención de humedad. Exige espaciar riegos y buena ventilación.',
  },
  mixto_corteza_musgo: {
    label: 'Mixto (Corteza + Sphagnum)',
    factor: 1.28,
    maxRecommendedMonths: 18,
    description: 'Balance entre aireación y humedad sostenida.',
  },
  arcilla_expandida: {
    label: 'Arcilla expandida (LECA)',
    factor: 0.85,
    maxRecommendedMonths: 36,
    description: 'Inerte, no se pudre y ofrece alta oxigenación radicular.',
  },
  montada_corcho: {
    label: 'Montada en tronco / corcho',
    factor: 0.42,
    maxRecommendedMonths: 48,
    description: 'Secado ultrarrápido a raíz expuesta; requiere riegos muy frecuentes.',
  },
  piedra_volcanica: {
    label: 'Piedra volcánica / carbón',
    factor: 0.72,
    maxRecommendedMonths: 36,
    description: 'Drenaje muy rápido, excelente para Cattleya y Vanda en canasta.',
  },
};

export const LIGHT_LABELS: Record<LightLevel, { label: string; intensityScore: number }> = {
  sombra_baja: { label: 'Sombra baja (lejos de ventana)', intensityScore: 0.2 },
  sombra_luminosa: { label: 'Sombra luminosa (ventana Este/Norte suave)', intensityScore: 0.5 },
  luz_filtrada_brillante: { label: 'Luz filtrada brillante (cortina traslúcida)', intensityScore: 0.75 },
  luz_artificial_led: { label: 'Luz de cultivo LED (12–14 h)', intensityScore: 0.72 },
  sol_matutino_suave: { label: 'Sol matutino suave directo (1–2 h)', intensityScore: 0.88 },
  sol_directo_fuerte: { label: 'Sol directo intenso de mediodía', intensityScore: 1.0 },
};

export const VENTILATION_LABELS: Record<VentilationLevel, { label: string; score: number }> = {
  baja: { label: 'Baja (espacio cerrado)', score: 0.2 },
  media: { label: 'Media (ventilación diaria)', score: 0.6 },
  alta: { label: 'Alta (flujo continuo suave)', score: 1.0 },
};

export const ROOT_CONDITION_LABELS: Record<RootCondition, string> = {
  verdes_hidratadas: 'Verdes / turgentes (hidratadas)',
  plateadas_secas: 'Plateadas / grises (listas para regar)',
  puntas_activas: 'Con puntas verdes/rojizas de crecimiento activo',
  marrones_blandas: 'Marrones o blandas (alerta pudrición)',
  deshidratadas_finas: 'Secas, huecas o arrugadas (falta de agua)',
};

export const LEAF_CONDITION_LABELS: Record<LeafCondition, string> = {
  firmes_verdes: 'Firmes color verde manzana saludable',
  verde_oscuro_largo: 'Verde muy oscuro y alargadas (poca luz)',
  amarillentas_clorosis: 'Amarillentas / clorosis',
  rojizas_antocianina: 'Bordes rojizos/púrpura (luz alta)',
  arrugadas_flacidas: 'Arrugadas, blandas o en acordeón',
  manchas_oscuras: 'Con manchas oscuras o quemaduras',
};

export const PSEUDOBULB_LABELS: Record<PseudobulbCondition, string> = {
  no_aplica: 'No aplica (monopodial sin pseudobulbos)',
  turgentes_llenos: 'Turgentes, lisos y rellenos',
  ligeramente_arrugados: 'Con surcos ligeros',
  muy_arrugados: 'Muy arrugados o desinflados',
};

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  vegetativo: 'Crecimiento vegetativo (hojas/brotes)',
  enraizamiento: 'Brote activo de raíces',
  vara_floral: 'Desarrollo de vara floral / botones',
  floracion: 'En plena floración',
  reposo: 'Reposo estacional post-floración',
  recuperacion: 'En terapia / recuperación radicular',
};

export const WATERING_METHOD_LABELS: Record<WateringMethod, string> = {
  ninguno: 'Sin riego',
  inmersion: 'Inmersión 10–15 min',
  riego_superior: 'Riego por arriba (drenaje libre)',
  nebulizacion: 'Nebulización foliar/radicular',
  lluvia_natural: 'Agua de lluvia recolectada',
};

export const FERTILIZER_LABELS: Record<FertilizerType, string> = {
  ninguno: 'Sin fertilizante',
  equilibrado_20_20_20: 'Equilibrado NPK 20-20-20',
  floracion_10_30_20: 'Inductor Floración NPK 10-30-20',
  crecimiento_30_10_10: 'Crecimiento Vegetativo NPK 30-10-10',
  calcio_magnesio: 'Suplemento Calcio + Magnesio',
  organico_algas: 'Extracto de algas / bioestimulante',
};

export const FERTILIZER_DOSE_LABELS: Record<FertilizerDose, string> = {
  ninguna: 'Sin dosis',
  cuarto: '1/4 de dosis (suave semanal)',
  media: '1/2 dosis (quincenal)',
  completa: 'Dosis completa',
};

