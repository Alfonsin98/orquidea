import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import {
  BackupPayload,
  CareLog,
  Orchid,
  OrchidGenus,
  TipCategory,
  TipFeedbackRecord,
  TipFeedbackValue,
} from '../types/orchid';

const DB_NAME = 'orquidea_ml.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
    await initDatabase(dbInstance);
  }
  return dbInstance;
}

export async function initDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS orchids (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      genus TEXT NOT NULL,
      speciesOrHybrid TEXT NOT NULL,
      acquiredAt TEXT NOT NULL,
      lastRepottedAt TEXT NOT NULL,
      substrate TEXT NOT NULL,
      potTransparent INTEGER NOT NULL DEFAULT 1,
      potSizeCm REAL NOT NULL DEFAULT 12.0,
      locationName TEXT NOT NULL DEFAULT 'Interior luminoso',
      defaultLight TEXT NOT NULL DEFAULT 'luz_filtrada_brillante',
      defaultVentilation TEXT NOT NULL DEFAULT 'media',
      baselineTempDayC REAL NOT NULL DEFAULT 23.0,
      baselineTempNightC REAL NOT NULL DEFAULT 18.0,
      baselineHumidityPct REAL NOT NULL DEFAULT 60.0,
      currentStage TEXT NOT NULL DEFAULT 'vegetativo',
      coverPhotoUri TEXT,
      notes TEXT DEFAULT '',
      isDemo INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS care_logs (
      id TEXT PRIMARY KEY NOT NULL,
      orchidId TEXT NOT NULL,
      recordedAt TEXT NOT NULL,
      eventType TEXT NOT NULL,
      watered INTEGER NOT NULL DEFAULT 0,
      wateringMethod TEXT NOT NULL DEFAULT 'inmersion',
      fertilized INTEGER NOT NULL DEFAULT 0,
      fertilizerType TEXT NOT NULL DEFAULT 'ninguno',
      fertilizerDose TEXT NOT NULL DEFAULT 'ninguna',
      repotted INTEGER NOT NULL DEFAULT 0,
      newSubstrate TEXT,
      pruned INTEGER NOT NULL DEFAULT 0,
      leafCount INTEGER NOT NULL DEFAULT 4,
      newLeafCount INTEGER NOT NULL DEFAULT 0,
      spikeCount INTEGER NOT NULL DEFAULT 0,
      bloomCount INTEGER NOT NULL DEFAULT 0,
      rootCondition TEXT NOT NULL DEFAULT 'verdes_hidratadas',
      leafCondition TEXT NOT NULL DEFAULT 'firmes_verdes',
      pseudobulbCondition TEXT NOT NULL DEFAULT 'no_aplica',
      growthStage TEXT NOT NULL DEFAULT 'vegetativo',
      healthScore REAL NOT NULL DEFAULT 85.0,
      tempDayC REAL NOT NULL DEFAULT 23.0,
      tempNightC REAL NOT NULL DEFAULT 18.0,
      humidityPct REAL NOT NULL DEFAULT 60.0,
      lightLevel TEXT NOT NULL DEFAULT 'luz_filtrada_brillante',
      ventilation TEXT NOT NULL DEFAULT 'media',
      photoUri TEXT,
      photoMetricsJson TEXT,
      notes TEXT DEFAULT '',
      FOREIGN KEY (orchidId) REFERENCES orchids(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tip_feedback (
      id TEXT PRIMARY KEY NOT NULL,
      orchidId TEXT NOT NULL,
      tipKey TEXT NOT NULL,
      category TEXT NOT NULL,
      feedback TEXT NOT NULL,
      recordedIntervalDays REAL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (orchidId) REFERENCES orchids(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_logs_orchid ON care_logs(orchidId, recordedAt);
    CREATE INDEX IF NOT EXISTS idx_feedback_orchid ON tip_feedback(orchidId);
  `);

  // Sembrar datos de ejemplo si la base de datos está vacía para que el usuario pueda probar el ML de inmediato
  const countRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM orchids'
  );
  if (!countRow || countRow.count === 0) {
    await seedDemoOrchids(db);
  }
}

function parseOrchidRow(row: any): Orchid {
  return {
    id: row.id,
    name: row.name,
    genus: row.genus as OrchidGenus,
    speciesOrHybrid: row.speciesOrHybrid,
    acquiredAt: row.acquiredAt,
    lastRepottedAt: row.lastRepottedAt,
    substrate: row.substrate,
    potTransparent: Boolean(row.potTransparent),
    potSizeCm: Number(row.potSizeCm),
    locationName: row.locationName,
    defaultLight: row.defaultLight,
    defaultVentilation: row.defaultVentilation,
    baselineTempDayC: Number(row.baselineTempDayC),
    baselineTempNightC: Number(row.baselineTempNightC),
    baselineHumidityPct: Number(row.baselineHumidityPct),
    currentStage: row.currentStage,
    coverPhotoUri: row.coverPhotoUri,
    notes: row.notes ?? '',
    isDemo: Boolean(row.isDemo),
    createdAt: row.createdAt,
  };
}

function parseCareLogRow(row: any): CareLog {
  let extraMetrics: any = null;
  if (row.photoMetricsJson) {
    try {
      extraMetrics = JSON.parse(row.photoMetricsJson);
    } catch {
      extraMetrics = null;
    }
  }

  return {
    id: row.id,
    orchidId: row.orchidId,
    recordedAt: row.recordedAt,
    eventType: row.eventType,
    watered: Boolean(row.watered),
    wateringMethod: row.wateringMethod,
    misted: extraMetrics?.misted ?? Boolean(row.notes && row.notes.includes('[Atomización]')),
    mistingNotes: extraMetrics?.mistingNotes,
    fertilized: Boolean(row.fertilized),
    fertilizerType: row.fertilizerType,
    fertilizerDose: row.fertilizerDose,
    fertilizerNotes: extraMetrics?.fertilizerNotes,
    repotted: Boolean(row.repotted),
    newSubstrate: row.newSubstrate,
    pruned: Boolean(row.pruned),
    leafCount: Number(row.leafCount),
    newLeafCount: Number(row.newLeafCount),
    spikeCount: Number(row.spikeCount),
    bloomCount: Number(row.bloomCount),
    rootCondition: row.rootCondition,
    leafCondition: row.leafCondition,
    pseudobulbCondition: row.pseudobulbCondition,
    growthStage: row.growthStage,
    healthScore: Number(row.healthScore),
    tempDayC: Number(row.tempDayC),
    tempNightC: Number(row.tempNightC),
    humidityPct: Number(row.humidityPct),
    lightLevel: row.lightLevel,
    ventilation: row.ventilation,
    photoUri: row.photoUri,
    photoTargetPart: extraMetrics?.targetPart,
    photoMetrics: extraMetrics,
    notes: row.notes ?? '',
  };
}

export async function getAllOrchids(): Promise<Orchid[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM orchids ORDER BY createdAt DESC');
  return rows.map(parseOrchidRow);
}

export async function getOrchidById(id: string): Promise<Orchid | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync('SELECT * FROM orchids WHERE id = ?', id);
  return row ? parseOrchidRow(row) : null;
}

export async function saveOrchid(orchid: Orchid): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO orchids (
      id, name, genus, speciesOrHybrid, acquiredAt, lastRepottedAt,
      substrate, potTransparent, potSizeCm, locationName,
      defaultLight, defaultVentilation, baselineTempDayC, baselineTempNightC,
      baselineHumidityPct, currentStage, coverPhotoUri, notes, isDemo, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      genus = excluded.genus,
      speciesOrHybrid = excluded.speciesOrHybrid,
      acquiredAt = excluded.acquiredAt,
      lastRepottedAt = excluded.lastRepottedAt,
      substrate = excluded.substrate,
      potTransparent = excluded.potTransparent,
      potSizeCm = excluded.potSizeCm,
      locationName = excluded.locationName,
      defaultLight = excluded.defaultLight,
      defaultVentilation = excluded.defaultVentilation,
      baselineTempDayC = excluded.baselineTempDayC,
      baselineTempNightC = excluded.baselineTempNightC,
      baselineHumidityPct = excluded.baselineHumidityPct,
      currentStage = excluded.currentStage,
      coverPhotoUri = excluded.coverPhotoUri,
      notes = excluded.notes,
      isDemo = excluded.isDemo;`,
    [
      orchid.id,
      orchid.name,
      orchid.genus,
      orchid.speciesOrHybrid,
      orchid.acquiredAt,
      orchid.lastRepottedAt,
      orchid.substrate,
      orchid.potTransparent ? 1 : 0,
      orchid.potSizeCm,
      orchid.locationName,
      orchid.defaultLight,
      orchid.defaultVentilation,
      orchid.baselineTempDayC,
      orchid.baselineTempNightC,
      orchid.baselineHumidityPct,
      orchid.currentStage,
      orchid.coverPhotoUri,
      orchid.notes,
      orchid.isDemo ? 1 : 0,
      orchid.createdAt,
    ]
  );
}

export async function deleteOrchid(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM orchids WHERE id = ?', id);
}

export async function getLogsForOrchid(orchidId: string): Promise<CareLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync(
    'SELECT * FROM care_logs WHERE orchidId = ? ORDER BY recordedAt DESC',
    orchidId
  );
  return rows.map(parseCareLogRow);
}

export async function getAllLogs(): Promise<CareLog[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM care_logs ORDER BY recordedAt DESC');
  return rows.map(parseCareLogRow);
}

export async function saveCareLog(log: CareLog): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO care_logs (
      id, orchidId, recordedAt, eventType, watered, wateringMethod,
      fertilized, fertilizerType, fertilizerDose, repotted, newSubstrate,
      pruned, leafCount, newLeafCount, spikeCount, bloomCount,
      rootCondition, leafCondition, pseudobulbCondition, growthStage,
      healthScore, tempDayC, tempNightC, humidityPct, lightLevel,
      ventilation, photoUri, photoMetricsJson, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      eventType = excluded.eventType,
      watered = excluded.watered,
      wateringMethod = excluded.wateringMethod,
      fertilized = excluded.fertilized,
      fertilizerType = excluded.fertilizerType,
      fertilizerDose = excluded.fertilizerDose,
      repotted = excluded.repotted,
      newSubstrate = excluded.newSubstrate,
      pruned = excluded.pruned,
      leafCount = excluded.leafCount,
      newLeafCount = excluded.newLeafCount,
      spikeCount = excluded.spikeCount,
      bloomCount = excluded.bloomCount,
      rootCondition = excluded.rootCondition,
      leafCondition = excluded.leafCondition,
      pseudobulbCondition = excluded.pseudobulbCondition,
      growthStage = excluded.growthStage,
      healthScore = excluded.healthScore,
      tempDayC = excluded.tempDayC,
      tempNightC = excluded.tempNightC,
      humidityPct = excluded.humidityPct,
      lightLevel = excluded.lightLevel,
      ventilation = excluded.ventilation,
      photoUri = excluded.photoUri,
      photoMetricsJson = excluded.photoMetricsJson,
      notes = excluded.notes;`,
    [
      log.id,
      log.orchidId,
      log.recordedAt,
      log.eventType,
      log.watered ? 1 : 0,
      log.wateringMethod,
      log.fertilized ? 1 : 0,
      log.fertilizerType,
      log.fertilizerDose,
      log.repotted ? 1 : 0,
      log.newSubstrate,
      log.pruned ? 1 : 0,
      log.leafCount,
      log.newLeafCount,
      log.spikeCount,
      log.bloomCount,
      log.rootCondition,
      log.leafCondition,
      log.pseudobulbCondition,
      log.growthStage,
      log.healthScore,
      log.tempDayC,
      log.tempNightC,
      log.humidityPct,
      log.lightLevel,
      log.ventilation,
      log.photoUri,
      log.photoMetrics || log.photoTargetPart || log.misted || log.fertilizerNotes
        ? JSON.stringify({
            ...(log.photoMetrics || {}),
            targetPart: log.photoTargetPart || log.photoMetrics?.targetPart || 'raices',
            misted: log.misted,
            mistingNotes: log.mistingNotes,
            fertilizerNotes: log.fertilizerNotes,
          })
        : null,
      log.notes,
    ]
  );

  // Actualizar el estado de crecimiento actual de la orquídea
  await db.runAsync('UPDATE orchids SET currentStage = ? WHERE id = ?', [
    log.growthStage,
    log.orchidId,
  ]);
}

export async function deleteCareLog(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM care_logs WHERE id = ?', id);
}

export async function recordTipFeedback(
  orchidId: string,
  tipKey: string,
  category: TipCategory,
  feedback: TipFeedbackValue,
  recordedIntervalDays: number | null
): Promise<void> {
  const db = await getDatabase();
  const id = `fb_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.runAsync(
    `INSERT INTO tip_feedback (id, orchidId, tipKey, category, feedback, recordedIntervalDays, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      orchidId,
      tipKey,
      category,
      feedback,
      recordedIntervalDays,
      new Date().toISOString(),
    ]
  );
}

export async function getAllTipFeedback(): Promise<TipFeedbackRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    orchidId: string;
    tipKey: string;
    category: TipCategory;
    feedback: TipFeedbackValue;
    recordedIntervalDays: number | null;
    createdAt: string;
  }>('SELECT * FROM tip_feedback ORDER BY createdAt DESC');
  return rows.map((r) => ({
    id: r.id,
    orchidId: r.orchidId,
    tipKey: r.tipKey,
    category: r.category,
    feedback: r.feedback,
    recordedIntervalDays: r.recordedIntervalDays,
    createdAt: r.createdAt,
  }));
}

/**
 * Genera un archivo JSON de respaldo con todas las orquídeas, bitácora y retroalimentación ML,
 * y activa el diálogo nativo de compartir para guardarlo en archivos del teléfono o enviarlo.
 */
export async function exportDatabaseBackup(): Promise<string> {
  const orchids = await getAllOrchids();
  const logs = await getAllLogs();
  const tipFeedback = await getAllTipFeedback();

  const backupPayload: BackupPayload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appName: 'OrquiML',
    orchids,
    careLogs: logs,
    tipFeedback,
  };

  const jsonString = JSON.stringify(backupPayload, null, 2);
  const fileName = `OrquiML_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, fileName);
  await file.write(jsonString);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar respaldo OrquiML',
      UTI: 'public.json',
    });
  }

  return file.uri;
}

/**
 * Restaura la base de datos a partir de un archivo JSON seleccionado por el usuario.
 */
export async function importDatabaseBackup(): Promise<{
  orchidsRestored: number;
  logsRestored: number;
}> {
  const docResult = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/json', '*/*'],
    copyToCacheDirectory: true,
  });

  if (docResult.canceled || !docResult.assets || docResult.assets.length === 0) {
    throw new Error('Selección cancelada');
  }

  const fileUri = docResult.assets[0].uri;
  const pickedFile = new File(fileUri);
  const content = await pickedFile.text();
  const parsed = JSON.parse(content) as BackupPayload;

  if (!parsed.orchids || !Array.isArray(parsed.orchids)) {
    throw new Error('El archivo seleccionado no tiene el formato de respaldo de OrquiML.');
  }

  const db = await getDatabase();
  await db.execAsync('BEGIN TRANSACTION;');
  try {
    for (const orchid of parsed.orchids) {
      await saveOrchid(orchid);
    }
    if (parsed.careLogs && Array.isArray(parsed.careLogs)) {
      for (const log of parsed.careLogs) {
        await saveCareLog(log);
      }
    }
    if (parsed.tipFeedback && Array.isArray(parsed.tipFeedback)) {
      for (const fb of parsed.tipFeedback) {
        await recordTipFeedback(
          fb.orchidId,
          fb.tipKey,
          fb.category,
          fb.feedback,
          fb.recordedIntervalDays
        );
      }
    }
    await db.execAsync('COMMIT;');
  } catch (err) {
    await db.execAsync('ROLLBACK;');
    throw err;
  }

  return {
    orchidsRestored: parsed.orchids.length,
    logsRestored: parsed.careLogs?.length ?? 0,
  };
}

/**
 * Resetea y reinserta los datos de prueba botánicos.
 */
export async function resetToDemoData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DELETE FROM tip_feedback;
    DELETE FROM care_logs;
    DELETE FROM orchids;
  `);
  await seedDemoOrchids(db);
}

async function seedDemoOrchids(db: SQLite.SQLiteDatabase): Promise<void> {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const demoPhalaenopsis: Orchid = {
    id: 'demo_phalaenopsis_1',
    name: 'Phalaenopsis Blanca "Aura"',
    genus: 'Phalaenopsis',
    speciesOrHybrid: 'Phal. aphrodite híbrido',
    acquiredAt: new Date(now - 75 * dayMs).toISOString(),
    lastRepottedAt: new Date(now - 45 * dayMs).toISOString(),
    substrate: 'corteza_pino',
    potTransparent: true,
    potSizeCm: 12,
    locationName: 'Ventana Este (cortina fina)',
    defaultLight: 'luz_filtrada_brillante',
    defaultVentilation: 'media',
    baselineTempDayC: 23,
    baselineTempNightC: 17.5,
    baselineHumidityPct: 62,
    currentStage: 'vara_floral',
    coverPhotoUri: null,
    notes: 'Orquídea vigorosa con dos varas anteriores ramificadas.',
    isDemo: true,
    createdAt: new Date(now - 75 * dayMs).toISOString(),
  };

  const demoCattleya: Orchid = {
    id: 'demo_cattleya_1',
    name: 'Cattleya Púrpura "Reina"',
    genus: 'Cattleya',
    speciesOrHybrid: 'Cattleya labiata híbrido',
    acquiredAt: new Date(now - 120 * dayMs).toISOString(),
    lastRepottedAt: new Date(now - 90 * dayMs).toISOString(),
    substrate: 'piedra_volcanica',
    potTransparent: false,
    potSizeCm: 14,
    locationName: 'Balcón protegido',
    defaultLight: 'sol_matutino_suave',
    defaultVentilation: 'alta',
    baselineTempDayC: 25,
    baselineTempNightC: 16,
    baselineHumidityPct: 55,
    currentStage: 'vegetativo',
    coverPhotoUri: null,
    notes: 'Brote nuevo engrosando el pseudobulbo con buena luz solar filtrada.',
    isDemo: true,
    createdAt: new Date(now - 120 * dayMs).toISOString(),
  };

  await saveOrchid(demoPhalaenopsis);
  await saveOrchid(demoCattleya);

  // Historial de riegos y morfología para calibrar el ML
  const logsToInsert: CareLog[] = [
    {
      id: 'demo_log_phal_1',
      orchidId: demoPhalaenopsis.id,
      recordedAt: new Date(now - 28 * dayMs).toISOString(),
      eventType: 'riego',
      watered: true,
      wateringMethod: 'inmersion',
      fertilized: true,
      fertilizerType: 'equilibrado_20_20_20',
      fertilizerDose: 'cuarto',
      repotted: false,
      newSubstrate: null,
      pruned: false,
      leafCount: 4,
      newLeafCount: 0,
      spikeCount: 0,
      bloomCount: 0,
      rootCondition: 'plateadas_secas',
      leafCondition: 'firmes_verdes',
      pseudobulbCondition: 'no_aplica',
      growthStage: 'vegetativo',
      healthScore: 88,
      tempDayC: 22.5,
      tempNightC: 17.5,
      humidityPct: 60,
      lightLevel: 'luz_filtrada_brillante',
      ventilation: 'media',
      photoUri: null,
      photoMetrics: {
        targetPart: 'raices',
        greenVigorScore: 82,
        velamenHydrationScore: 32,
        chlorosisRatio: 0.04,
        necrosisRatio: 0.05,
        anthocyaninRatio: 0.02,
        bloomPigmentRatio: 0.0,
        brightnessMean: 0.62,
        analyzedPixels: 9216,
        summary: 'Velamen plateado seco listo para inmersión',
        detectedSignals: ['Velamen gris/plateado dominante: raíces secas listas para próximo riego'],
      },
      notes: 'Riego con inmersión de 10 min.',
    },
    {
      id: 'demo_log_phal_2',
      orchidId: demoPhalaenopsis.id,
      recordedAt: new Date(now - 19 * dayMs).toISOString(),
      eventType: 'riego',
      watered: true,
      wateringMethod: 'inmersion',
      fertilized: false,
      fertilizerType: 'ninguno',
      fertilizerDose: 'ninguna',
      repotted: false,
      newSubstrate: null,
      pruned: false,
      leafCount: 4,
      newLeafCount: 1,
      spikeCount: 0,
      bloomCount: 0,
      rootCondition: 'plateadas_secas',
      leafCondition: 'firmes_verdes',
      pseudobulbCondition: 'no_aplica',
      growthStage: 'vegetativo',
      healthScore: 92,
      tempDayC: 23,
      tempNightC: 17,
      humidityPct: 62,
      lightLevel: 'luz_filtrada_brillante',
      ventilation: 'media',
      photoUri: null,
      photoMetrics: null,
      notes: 'Hoja central nueva creciendo sana.',
    },
    {
      id: 'demo_log_phal_3',
      orchidId: demoPhalaenopsis.id,
      recordedAt: new Date(now - 10 * dayMs).toISOString(),
      eventType: 'riego_y_abono',
      watered: true,
      wateringMethod: 'inmersion',
      fertilized: true,
      fertilizerType: 'floracion_10_30_20',
      fertilizerDose: 'cuarto',
      repotted: false,
      newSubstrate: null,
      pruned: false,
      leafCount: 5,
      newLeafCount: 1,
      spikeCount: 1,
      bloomCount: 0,
      rootCondition: 'plateadas_secas',
      leafCondition: 'firmes_verdes',
      pseudobulbCondition: 'no_aplica',
      growthStage: 'vara_floral',
      healthScore: 95,
      tempDayC: 23.5,
      tempNightC: 17,
      humidityPct: 65,
      lightLevel: 'luz_filtrada_brillante',
      ventilation: 'media',
      photoUri: null,
      photoMetrics: {
        targetPart: 'hojas',
        greenVigorScore: 90,
        velamenHydrationScore: 40,
        chlorosisRatio: 0.02,
        necrosisRatio: 0.03,
        anthocyaninRatio: 0.05,
        bloomPigmentRatio: 0.0,
        brightnessMean: 0.68,
        analyzedPixels: 9216,
        summary: 'Tonalidad verde manzana óptima con asomo de punta de vara floral',
        detectedSignals: ['Tonalidad verde manzana óptima: excelente balance entre luz e hidratación'],
      },
      notes: 'Apareció pequeña punta de vara floral entre el 3er y 4to par de hojas!',
    },
    {
      id: 'demo_log_cat_1',
      orchidId: demoCattleya.id,
      recordedAt: new Date(now - 14 * dayMs).toISOString(),
      eventType: 'riego',
      watered: true,
      wateringMethod: 'riego_superior',
      fertilized: true,
      fertilizerType: 'equilibrado_20_20_20',
      fertilizerDose: 'cuarto',
      repotted: false,
      newSubstrate: null,
      pruned: false,
      leafCount: 4,
      newLeafCount: 1,
      spikeCount: 0,
      bloomCount: 0,
      rootCondition: 'plateadas_secas',
      leafCondition: 'firmes_verdes',
      pseudobulbCondition: 'turgentes_llenos',
      growthStage: 'vegetativo',
      healthScore: 88,
      tempDayC: 26,
      tempNightC: 16.5,
      humidityPct: 52,
      lightLevel: 'sol_matutino_suave',
      ventilation: 'alta',
      photoUri: null,
      photoMetrics: null,
      notes: 'Drenaje rápido en piedra volcánica.',
    },
    {
      id: 'demo_log_cat_2',
      orchidId: demoCattleya.id,
      recordedAt: new Date(now - 6 * dayMs).toISOString(),
      eventType: 'riego',
      watered: true,
      wateringMethod: 'riego_superior',
      fertilized: false,
      fertilizerType: 'ninguno',
      fertilizerDose: 'ninguna',
      repotted: false,
      newSubstrate: null,
      pruned: false,
      leafCount: 4,
      newLeafCount: 1,
      spikeCount: 0,
      bloomCount: 0,
      rootCondition: 'puntas_activas',
      leafCondition: 'rojizas_antocianina',
      pseudobulbCondition: 'turgentes_llenos',
      growthStage: 'vegetativo',
      healthScore: 90,
      tempDayC: 25.5,
      tempNightC: 16,
      humidityPct: 56,
      lightLevel: 'sol_matutino_suave',
      ventilation: 'alta',
      photoUri: null,
      photoMetrics: null,
      notes: 'Bordes rojizos saludables por sol matutino.',
    },
  ];

  for (const log of logsToInsert) {
    await saveCareLog(log);
  }

  // Registrar un feedback de ejemplo para entrenar los pesos
  await recordTipFeedback(
    demoPhalaenopsis.id,
    'water_due',
    'riego',
    'helpful',
    9.0
  );
}

