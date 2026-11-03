import {
  BackupPayload,
  CareLog,
  Orchid,
  TipCategory,
  TipFeedbackRecord,
  TipFeedbackValue,
} from '../types/orchid';

const DB_NAME = 'orquidea_ml_pwa';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function getIndexedDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('orchids')) {
        db.createObjectStore('orchids', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('care_logs')) {
        const logStore = db.createObjectStore('care_logs', { keyPath: 'id' });
        logStore.createIndex('orchidId', 'orchidId', { unique: false });
        logStore.createIndex('recordedAt', 'recordedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('tip_feedback')) {
        const fbStore = db.createObjectStore('tip_feedback', { keyPath: 'id' });
        fbStore.createIndex('orchidId', 'orchidId', { unique: false });
      }
    };

    request.onsuccess = async () => {
      const db = request.result;
      // Verificar si está vacía para sembrar orquídeas de ejemplo
      const orchids = await getAllOrchidsFromDb(db);
      if (orchids.length === 0) {
        await seedDemoData(db);
      }
      resolve(db);
    };

    request.onerror = () => {
      reject(new Error(`Error al abrir IndexedDB: ${request.error?.message}`));
    };
  });

  return dbPromise;
}

function getAllOrchidsFromDb(db: IDBDatabase): Promise<Orchid[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('orchids', 'readonly');
    const store = tx.objectStore('orchids');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllOrchids(): Promise<Orchid[]> {
  const db = await getIndexedDb();
  return getAllOrchidsFromDb(db);
}

export async function getOrchidById(id: string): Promise<Orchid | null> {
  const db = await getIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('orchids', 'readonly');
    const store = tx.objectStore('orchids');
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function saveOrchid(orchid: Orchid): Promise<void> {
  const db = await getIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('orchids', 'readwrite');
    const store = tx.objectStore('orchids');
    const req = store.put(orchid);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOrchid(id: string): Promise<void> {
  const db = await getIndexedDb();
  // Borrar orquídea y sus logs asociados
  const logs = await getLogsForOrchid(id);
  const tx = db.transaction(['orchids', 'care_logs', 'tip_feedback'], 'readwrite');
  const orchidStore = tx.objectStore('orchids');
  const logStore = tx.objectStore('care_logs');

  orchidStore.delete(id);
  for (const log of logs) {
    logStore.delete(log.id);
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getAllLogs(): Promise<CareLog[]> {
  const db = await getIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('care_logs', 'readonly');
    const store = tx.objectStore('care_logs');
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []) as CareLog[];
      list.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getLogsForOrchid(orchidId: string): Promise<CareLog[]> {
  const db = await getIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('care_logs', 'readonly');
    const store = tx.objectStore('care_logs');
    const index = store.index('orchidId');
    const req = index.getAll(orchidId);
    req.onsuccess = () => {
      const list = (req.result || []) as CareLog[];
      list.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveCareLog(log: CareLog): Promise<void> {
  const db = await getIndexedDb();
  const tx = db.transaction(['care_logs', 'orchids'], 'readwrite');
  const logStore = tx.objectStore('care_logs');
  const orchidStore = tx.objectStore('orchids');

  logStore.put(log);

  // Actualizar etapa de la orquídea
  const orchidReq = orchidStore.get(log.orchidId);
  orchidReq.onsuccess = () => {
    const orc = orchidReq.result as Orchid;
    if (orc) {
      orc.currentStage = log.growthStage;
      orchidStore.put(orc);
    }
  };

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCareLog(id: string): Promise<void> {
  const db = await getIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('care_logs', 'readwrite');
    const store = tx.objectStore('care_logs');
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function recordTipFeedback(
  orchidId: string,
  tipKey: string,
  category: TipCategory,
  feedback: TipFeedbackValue,
  recordedIntervalDays: number | null
): Promise<void> {
  const db = await getIndexedDb();
  const record: TipFeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orchidId,
    tipKey,
    category,
    feedback,
    recordedIntervalDays,
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('tip_feedback', 'readwrite');
    const store = tx.objectStore('tip_feedback');
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getAllTipFeedback(): Promise<TipFeedbackRecord[]> {
  const db = await getIndexedDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('tip_feedback', 'readonly');
    const store = tx.objectStore('tip_feedback');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function exportDatabaseBackup(): Promise<string> {
  const orchids = await getAllOrchids();
  const logs = await getAllLogs();
  const tipFeedback = await getAllTipFeedback();

  const backup: BackupPayload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    appName: 'OrquiML PWA',
    orchids,
    careLogs: logs,
    tipFeedback,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const fileName = `OrquiML_Backup_${new Date().toISOString().slice(0, 10)}.json`;

  // Descarga directa en navegador / iOS
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return fileName;
}

export async function importDatabaseBackup(jsonString: string): Promise<{
  orchidsRestored: number;
  logsRestored: number;
}> {
  const parsed = JSON.parse(jsonString) as BackupPayload;
  if (!parsed.orchids || !Array.isArray(parsed.orchids)) {
    throw new Error('El archivo no tiene el formato de respaldo de OrquiML.');
  }

  const db = await getIndexedDb();
  const tx = db.transaction(['orchids', 'care_logs', 'tip_feedback'], 'readwrite');
  const orchidStore = tx.objectStore('orchids');
  const logStore = tx.objectStore('care_logs');
  const fbStore = tx.objectStore('tip_feedback');

  for (const orchid of parsed.orchids) {
    orchidStore.put(orchid);
  }
  if (parsed.careLogs) {
    for (const log of parsed.careLogs) {
      logStore.put(log);
    }
  }
  if (parsed.tipFeedback) {
    for (const fb of parsed.tipFeedback) {
      fbStore.put(fb);
    }
  }

  return new Promise((resolve, reject) => {
    tx.oncomplete = () =>
      resolve({
        orchidsRestored: parsed.orchids.length,
        logsRestored: parsed.careLogs?.length || 0,
      });
    tx.onerror = () => reject(tx.error);
  });
}

export async function resetToDemoData(): Promise<void> {
  const db = await getIndexedDb();
  const tx = db.transaction(['orchids', 'care_logs', 'tip_feedback'], 'readwrite');
  tx.objectStore('orchids').clear();
  tx.objectStore('care_logs').clear();
  tx.objectStore('tip_feedback').clear();

  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  await seedDemoData(db);
}

async function seedDemoData(db: IDBDatabase): Promise<void> {
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

  const logs: CareLog[] = [
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
        summary: 'Tonalidad verde manzana óptima con punta de vara floral',
        detectedSignals: ['Tonalidad verde manzana óptima: excelente balance entre luz e hidratación'],
      },
      notes: 'Apareció pequeña punta de vara floral!',
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
      notes: 'Bordes rojizos por sol matutino.',
    },
  ];

  const tx = db.transaction(['orchids', 'care_logs', 'tip_feedback'], 'readwrite');
  const orchidStore = tx.objectStore('orchids');
  const logStore = tx.objectStore('care_logs');
  const fbStore = tx.objectStore('tip_feedback');

  orchidStore.put(demoPhalaenopsis);
  orchidStore.put(demoCattleya);

  for (const log of logs) {
    logStore.put(log);
  }

  const fb: TipFeedbackRecord = {
    id: 'demo_fb_1',
    orchidId: demoPhalaenopsis.id,
    tipKey: 'water_due',
    category: 'riego',
    feedback: 'helpful',
    recordedIntervalDays: 9,
    createdAt: new Date().toISOString(),
  };
  fbStore.put(fb);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

