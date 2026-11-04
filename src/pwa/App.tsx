import React, { useEffect, useState, useCallback } from 'react';
import { Flower2, Sparkles, Share, CheckCircle2, Brain, BookOpen, HardDriveDownload, Plus, RefreshCw } from 'lucide-react';
import { BottomNav, TabKey } from './components/BottomNav';
import { CollectionView } from './views/CollectionView';
import { MLInsightsView } from './views/MLInsightsView';
import { CatalogView } from './views/CatalogView';
import { SettingsView } from './views/SettingsView';
import { OrchidDetailModal } from './modals/OrchidDetailModal';
import { NewOrchidModal } from './modals/NewOrchidModal';
import { NewCareLogModal } from './modals/NewCareLogModal';
import {
  deleteCareLog,
  deleteOrchid,
  getAllLogs,
  getAllOrchids,
  getAllTipFeedback,
  getLogsForOrchid,
  recordTipFeedback,
  saveCareLog,
  saveOrchid,
} from '../db/indexedDb';
import { computeGlobalMLStats, predictOrchidNeeds } from '../ml/adaptiveEngine';
import { AdaptiveTip, CareLog, GlobalMLCollectionStats, Orchid, OrchidMLPrediction, TipFeedbackValue } from '../types/orchid';
import '../styles/pwa.css';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabKey>('collection');
  const [orchids, setOrchids] = useState<Orchid[]>([]);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [predictionsMap, setPredictionsMap] = useState<Record<string, OrchidMLPrediction>>({});
  const [stats, setStats] = useState<GlobalMLCollectionStats | null>(null);
  const [activeTips, setActiveTips] = useState<AdaptiveTip[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [detailOrchid, setDetailOrchid] = useState<Orchid | null>(null);
  const [detailLogs, setDetailLogs] = useState<CareLog[]>([]);
  const [showNewOrchid, setShowNewOrchid] = useState(false);
  const [editingOrchid, setEditingOrchid] = useState<Orchid | null>(null);
  const [showNewLog, setShowNewLog] = useState(false);
  const [targetLogOrchidId, setTargetLogOrchidId] = useState<string | undefined>(undefined);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Detectar si está en Safari normal para sugerir instalación
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [showIOSBanner, setShowIOSBanner] = useState(isIOS && !isStandalone);
  const [updateReady, setUpdateReady] = useState(false);
  const [refreshingApp, setRefreshingApp] = useState(false);

  useEffect(() => {
    const handler = () => setUpdateReady(true);
    window.addEventListener('orquiml-update-ready', handler);
    return () => window.removeEventListener('orquiml-update-ready', handler);
  }, []);

  const handleForceReload = async () => {
    setRefreshingApp(true);
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.update();
        }
      }
    } catch (e) {
      console.error('Error buscando actualizaciones:', e);
    }
    window.location.reload();
  };

  const loadAllData = useCallback(async () => {
    try {
      const [allOrchids, allLogs, allFeedback] = await Promise.all([
        getAllOrchids(),
        getAllLogs(),
        getAllTipFeedback(),
      ]);

      setOrchids(allOrchids);
      setLogs(allLogs);

      const preds: Record<string, OrchidMLPrediction> = {};
      const tipsAcc: AdaptiveTip[] = [];

      for (const orchid of allOrchids) {
        const orchidLogs = allLogs.filter((l) => l.orchidId === orchid.id);
        const pred = predictOrchidNeeds(orchid, orchidLogs, allLogs, allFeedback);
        preds[orchid.id] = pred;
        tipsAcc.push(...pred.tips);
      }

      setPredictionsMap(preds);

      const calculatedStats = computeGlobalMLStats(allOrchids, allLogs, allFeedback);
      setStats(calculatedStats);

      tipsAcc.sort((a, b) => {
        const pMap = { urgente: 3, alta: 2, normal: 1 };
        return pMap[b.priority] - pMap[a.priority];
      });
      setActiveTips(tipsAcc.slice(0, 10));
    } catch (e) {
      console.error('Error cargando datos en PWA:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (isMounted) {
        await loadAllData();
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [loadAllData]);

  // Si cambia la orquídea en detalle, recargar sus logs
  useEffect(() => {
    if (detailOrchid) {
      getLogsForOrchid(detailOrchid.id).then((l) => setDetailLogs(l));
    }
  }, [detailOrchid]);

  // Manejadores de Orquídeas
  const handleOpenDetail = async (orchid: Orchid) => {
    const orchidLogs = await getLogsForOrchid(orchid.id);
    setDetailOrchid(orchid);
    setDetailLogs(orchidLogs);
  };

  const handleSaveOrchid = async (orchid: Orchid) => {
    await saveOrchid(orchid);
    setShowNewOrchid(false);
    setEditingOrchid(null);
    showToast(`¡${orchid.name} guardada!`);
    await loadAllData();
  };

  const handleDeleteOrchid = async (id: string) => {
    if (confirm('¿Eliminar esta orquídea y su historial de bitácora?')) {
      await deleteOrchid(id);
      setDetailOrchid(null);
      showToast('Orquídea eliminada.');
      await loadAllData();
    }
  };

  // Manejadores de Bitácora
  const handleQuickLog = (orchid: Orchid) => {
    setTargetLogOrchidId(orchid.id);
    setShowNewLog(true);
  };

  const handleSaveCareLog = async (log: CareLog) => {
    await saveCareLog(log);
    setShowNewLog(false);
    showToast('¡Registro guardado y modelo reentrenado!');
    await loadAllData();
  };

  const handleDeleteLog = async (logId: string) => {
    if (confirm('¿Eliminar esta entrada de la bitácora?')) {
      await deleteCareLog(logId);
      showToast('Registro eliminado.');
      await loadAllData();
    }
  };

  // Calibración de tips
  const handleTipFeedback = async (tipKey: string, feedback: TipFeedbackValue) => {
    const tip = activeTips.find((t) => t.tipKey === tipKey);
    if (tip) {
      await recordTipFeedback(tip.orchidId, tipKey, tip.category, feedback, 7);
      showToast('¡Feedback registrado en el motor Bayesiano!');
      await loadAllData();
    }
  };

  const collectionItems = orchids.map((orchid) => ({
    orchid,
    prediction: predictionsMap[orchid.id] || predictOrchidNeeds(orchid, [], logs, []),
  }));

  // Ordenar colección: las que requieren riego o atención primero
  collectionItems.sort(
    (a, b) => a.prediction.daysUntilNextWatering - b.prediction.daysUntilNextWatering
  );

  return (
    <div className="app-container">
      {/* Encabezado fijo adaptativo */}
      <header className="app-header">
        <div className="header-left">
          <div className="app-header-title">
            <Flower2 size={24} color="var(--color-primary)" />
            <span>OrquiML</span>
          </div>
          <span className="badge badge-primary">PWA Offline</span>
          <button
            onClick={handleForceReload}
            title="Buscar actualizaciones y recargar"
            style={{
              background: '#FFF',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--color-primary-dark)',
              marginLeft: 2,
            }}
          >
            <RefreshCw size={14} style={{ animation: refreshingApp ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>

        {/* Navegación para Pantallas Grandes (Tablet / Desktop) */}
        <nav className="desktop-nav">
          <button
            className={`desktop-nav-btn ${currentTab === 'collection' ? 'active' : ''}`}
            onClick={() => setCurrentTab('collection')}
          >
            <Flower2 size={17} />
            <span>Orquídeas</span>
          </button>
          <button
            className={`desktop-nav-btn ${currentTab === 'insights' ? 'active' : ''}`}
            onClick={() => setCurrentTab('insights')}
          >
            <Brain size={17} />
            <span>IA & Tips</span>
          </button>
          <button
            className={`desktop-nav-btn ${currentTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setCurrentTab('catalog')}
          >
            <BookOpen size={17} />
            <span>Catálogo</span>
          </button>
          <button
            className={`desktop-nav-btn ${currentTab === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentTab('settings')}
          >
            <HardDriveDownload size={17} />
            <span>Respaldo</span>
          </button>
        </nav>

        {/* Botón de acción rápida Desktop */}
        <div className="desktop-actions">
          <button
            className="btn-primary desktop-new-btn"
            onClick={() => {
              setEditingOrchid(null);
              setShowNewOrchid(true);
            }}
          >
            <Plus size={16} />
            <span>Nueva Orquídea</span>
          </button>
        </div>
      </header>

      {/* Banner de Actualización Disponible */}
      {updateReady && (
        <div
          style={{
            backgroundColor: '#134937',
            color: '#FFF',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #4ADE80',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
            <Sparkles size={16} color="#4ADE80" />
            <span>¡Nueva versión disponible (Fotos HD y Zoom)!</span>
          </div>
          <button
            onClick={handleForceReload}
            style={{
              backgroundColor: '#4ADE80',
              color: '#134937',
              border: 'none',
              borderRadius: 8,
              padding: '6px 12px',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            Actualizar ahora
          </button>
        </div>
      )}

      {/* Banner sugerencia instalación iOS */}
      {showIOSBanner && (
        <div
          style={{
            backgroundColor: '#FAFDFB',
            borderBottom: '1px solid #D4E6DC',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 12,
            color: 'var(--color-primary-dark)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Share size={14} />
            <span>Toca <strong>Compartir</strong> &gt; <strong>{'\u201C'}Agregar a pantalla de inicio{'\u201D'}</strong> para usar como app sin PC.</span>
          </div>
          <button
            onClick={() => setShowIOSBanner(false)}
            style={{ background: 'none', border: 'none', fontSize: 14, color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Contenido principal según la pestaña activa */}
      <main className="main-content">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-secondary)' }}>
            <Sparkles size={32} color="var(--color-primary)" style={{ animation: 'spin 2s linear infinite', margin: '0 auto 12px auto' }} />
            <div>Iniciando base de datos IndexedDB y modelos ML...</div>
          </div>
        ) : (
          <>
            {currentTab === 'collection' && (
              <CollectionView
                items={collectionItems}
                onOpenDetail={handleOpenDetail}
                onQuickLog={handleQuickLog}
                onAddNewOrchid={() => {
                  setEditingOrchid(null);
                  setShowNewOrchid(true);
                }}
              />
            )}

            {currentTab === 'insights' && stats && (
              <MLInsightsView
                stats={stats}
                activeTips={activeTips}
                onTipFeedback={handleTipFeedback}
              />
            )}

            {currentTab === 'catalog' && <CatalogView />}

            {currentTab === 'settings' && (
              <SettingsView onDataChanged={loadAllData} showToast={showToast} />
            )}
          </>
        )}
      </main>

      {/* Barra de Navegación Inferior */}
      <BottomNav currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 60,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'var(--color-primary-dark)',
            color: '#FFF',
            padding: '10px 18px',
            borderRadius: 24,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 120,
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <CheckCircle2 size={16} color="var(--color-primary-light)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modales */}
      {detailOrchid && predictionsMap[detailOrchid.id] && (
        <OrchidDetailModal
          orchid={detailOrchid}
          prediction={predictionsMap[detailOrchid.id]}
          logs={detailLogs}
          onClose={() => setDetailOrchid(null)}
          onEdit={(orc) => {
            setEditingOrchid(orc);
            setShowNewOrchid(true);
          }}
          onDelete={handleDeleteOrchid}
          onAddLog={(orc) => {
            setTargetLogOrchidId(orc.id);
            setShowNewLog(true);
          }}
          onDeleteLog={handleDeleteLog}
          onTipFeedback={handleTipFeedback}
        />
      )}

      {showNewOrchid && (
        <NewOrchidModal
          initialOrchid={editingOrchid}
          onClose={() => {
            setShowNewOrchid(false);
            setEditingOrchid(null);
          }}
          onSave={handleSaveOrchid}
        />
      )}

      {showNewLog && orchids.length > 0 && (
        <NewCareLogModal
          orchids={orchids}
          initialOrchidId={targetLogOrchidId}
          onClose={() => setShowNewLog(false)}
          onSave={handleSaveCareLog}
        />
      )}
    </div>
  );
};

