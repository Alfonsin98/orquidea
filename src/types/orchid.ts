export type OrchidGenus =
  | 'Phalaenopsis'
  | 'Cattleya'
  | 'Dendrobium'
  | 'Oncidium'
  | 'Vanda'
  | 'Miltoniopsis'
  | 'Paphiopedilum'
  | 'Cymbidium';

export type SubstrateType =
  | 'corteza_pino'
  | 'musgo_sphagnum'
  | 'mixto_corteza_musgo'
  | 'arcilla_expandida'
  | 'montada_corcho'
  | 'piedra_volcanica';

export type LightLevel =
  | 'sombra_baja'
  | 'sombra_luminosa'
  | 'luz_filtrada_brillante'
  | 'sol_matutino_suave'
  | 'luz_artificial_led'
  | 'sol_directo_fuerte';

export type VentilationLevel = 'baja' | 'media' | 'alta';

export type RootCondition =
  | 'verdes_hidratadas'
  | 'plateadas_secas'
  | 'puntas_activas'
  | 'marrones_blandas'
  | 'deshidratadas_finas';

export type LeafCondition =
  | 'firmes_verdes'
  | 'verde_oscuro_largo'
  | 'amarillentas_clorosis'
  | 'rojizas_antocianina'
  | 'arrugadas_flacidas'
  | 'manchas_oscuras';

export type PseudobulbCondition =
  | 'no_aplica'
  | 'turgentes_llenos'
  | 'ligeramente_arrugados'
  | 'muy_arrugados';

export type GrowthStage =
  | 'vegetativo'
  | 'enraizamiento'
  | 'vara_floral'
  | 'floracion'
  | 'reposo'
  | 'recuperacion';

export type CareEventType =
  | 'riego'
  | 'fertilizacion'
  | 'riego_y_abono'
  | 'inspeccion'
  | 'trasplante'
  | 'floracion'
  | 'poda';

export type WateringMethod =
  | 'ninguno'
  | 'inmersion'
  | 'riego_superior'
  | 'nebulizacion'
  | 'lluvia_natural';

export type FertilizerType =
  | 'ninguno'
  | 'equilibrado_20_20_20'
  | 'floracion_10_30_20'
  | 'crecimiento_30_10_10'
  | 'calcio_magnesio'
  | 'organico_algas';

export type FertilizerDose = 'ninguna' | 'cuarto' | 'media' | 'completa';

export type PhotoTargetPart = 'hojas' | 'raices' | 'planta_completa' | 'flores';

export interface PhotoVisionMetrics {
  targetPart: PhotoTargetPart;
  greenVigorScore: number; // 0..100: proporción y saturación saludable de clorofila
  velamenHydrationScore: number; // 0..100: 15-35 = plateado/seco listo para regar, 75+ = verde hidratado
  chlorosisRatio: number; // 0..1: proporción de tonos amarillentos
  necrosisRatio: number; // 0..1: proporción de manchas café oscuro/negro
  anthocyaninRatio: number; // 0..1: pigmentación rojiza/púrpura por luz alta
  bloomPigmentRatio: number; // 0..1: cromas florales vibrantes
  brightnessMean: number; // 0..1
  analyzedPixels: number;
  summary: string;
  detectedSignals: string[];
}

export interface Orchid {
  id: string;
  name: string;
  genus: OrchidGenus;
  speciesOrHybrid: string;
  acquiredAt: string; // ISO date
  lastRepottedAt: string; // ISO date
  substrate: SubstrateType;
  potTransparent: boolean;
  potSizeCm: number;
  locationName: string;
  defaultLight: LightLevel;
  defaultVentilation: VentilationLevel;
  baselineTempDayC: number;
  baselineTempNightC: number;
  baselineHumidityPct: number;
  currentStage: GrowthStage;
  coverPhotoUri: string | null;
  notes: string;
  isDemo: boolean;
  createdAt: string;
}

export interface CareLog {
  id: string;
  orchidId: string;
  recordedAt: string; // ISO timestamp
  eventType: CareEventType;
  watered: boolean;
  wateringMethod: WateringMethod;
  misted?: boolean; // Atomización / Pulverización foliar o de raíces aéreas
  mistingNotes?: string;
  fertilized: boolean;
  fertilizerType: FertilizerType;
  fertilizerDose: FertilizerDose;
  fertilizerNotes?: string;
  repotted: boolean;
  newSubstrate: SubstrateType | null;
  pruned: boolean;
  // Morfología
  leafCount: number;
  newLeafCount: number;
  spikeCount: number;
  bloomCount: number;
  rootCondition: RootCondition;
  leafCondition: LeafCondition;
  pseudobulbCondition: PseudobulbCondition;
  growthStage: GrowthStage;
  healthScore: number; // 1..100
  // Microclima registrado
  tempDayC: number;
  tempNightC: number;
  humidityPct: number;
  lightLevel: LightLevel;
  ventilation: VentilationLevel;
  // Foto y visión en el dispositivo
  photoUri: string | null;
  photoTargetPart?: PhotoTargetPart; // 'hojas' | 'raices' | 'planta_completa' | 'flores'
  photoMetrics: PhotoVisionMetrics | null;
  notes: string;
}

export type TipCategory =
  | 'riego'
  | 'fertilizacion'
  | 'salud_raices'
  | 'luz_microclima'
  | 'floracion'
  | 'sustrato';

export type TipFeedbackValue = 'helpful' | 'too_early' | 'too_late' | 'not_applicable';

export interface TipFeedbackRecord {
  id: string;
  orchidId: string;
  tipKey: string;
  category: TipCategory;
  feedback: TipFeedbackValue;
  recordedIntervalDays: number | null;
  createdAt: string;
}

export interface FeatureAttribution {
  featureName: string;
  label: string;
  impactScore: number; // -1..+1 (positivo alarga intervalo o favorece floración; negativo acorta o incrementa riesgo)
  humanValue: string;
}

export interface HealthRiskPrediction {
  riskId: 'root_rot' | 'dehydration' | 'light_stress' | 'substrate_nutrient';
  title: string;
  probability: number; // 0..1
  severity: 'bajo' | 'moderado' | 'alto';
  signals: string[];
  correctiveAction: string;
}

export interface AdaptiveTip {
  id: string;
  tipKey: string;
  orchidId: string;
  orchidName: string;
  category: TipCategory;
  priority: 'urgente' | 'alta' | 'normal';
  title: string;
  recommendation: string;
  scientificReason: string;
  mlExplanation: string;
  confidencePct: number; // 0..100
  personalDataWeightPct: number; // % de peso aportado por la DB local vs prior botánico
}

export interface BloomOptimizationInsight {
  readinessProbability: number; // 0..1
  optimalDayNightDeltaC: number;
  currentDayNightDeltaC: number;
  matchedSuccessPatterns: number;
  limitingFactors: string[];
  actionPlan: string[];
  featureAttributions: FeatureAttribution[];
}

export interface OrchidMLPrediction {
  orchidId: string;
  predictedWaterIntervalDays: number;
  botanicalPriorWaterDays: number;
  daysSinceLastWatering: number | null;
  daysUntilNextWatering: number;
  nextWaterDateISO: string;
  predictedFertilizeIntervalDays: number;
  recommendedFertilizer: FertilizerType;
  recommendedFertilizerDose: FertilizerDose;
  daysSinceLastFertilizing: number | null;
  daysUntilNextFertilizing: number;
  nextFertilizeDateISO: string;
  healthIndexEstimate: number; // 0..100
  healthTrendDelta: number; // cambio reciente
  confidencePct: number;
  localSamplesUsed: number;
  personalWeightPct: number;
  waterAttributions: FeatureAttribution[];
  risks: HealthRiskPrediction[];
  bloomInsight: BloomOptimizationInsight;
  tips: AdaptiveTip[];
}

export interface GlobalMLCollectionStats {
  totalOrchids: number;
  totalLogs: number;
  totalPhotosAnalyzed: number;
  totalFeedbackSignals: number;
  overallModelConfidencePct: number;
  personalizationRatioPct: number;
  estimatedWateringErrorDays: number; // MAE estimado por validación leave-one-out
  learnedRidgeWeights: Record<string, number>;
  bloomTriggerRankings: FeatureAttribution[];
  maturityLevel: 'Semilla Botánica' | 'Aprendizaje Inicial' | 'Modelo Calibrado' | 'Experto Personalizado';
  maturityDescription: string;
}

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  appName: string;
  orchids: Orchid[];
  careLogs: CareLog[];
  tipFeedback: TipFeedbackRecord[];
}

