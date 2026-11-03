import React, { useState } from 'react';
import {
  X,
  Droplet,
  PlusCircle,
  Trash2,
  Edit,
  AlertTriangle,
  Flower2,
  Camera,
  Calendar,
  Sparkles,
  Beaker,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { CareLog, Orchid, OrchidMLPrediction, TipFeedbackValue } from '../../types/orchid';
import {
  FERTILIZER_DOSE_LABELS,
  FERTILIZER_LABELS,
  GROWTH_STAGE_LABELS,
  ROOT_CONDITION_LABELS,
  SUBSTRATE_RETENTION_FACTOR,
  WATERING_METHOD_LABELS,
} from '../../data/orchidCatalog';
import { MLAttributionBar } from '../components/MLAttributionBar';
import { TipCard } from '../components/TipCard';

interface Props {
  orchid: Orchid;
  prediction: OrchidMLPrediction;
  logs: CareLog[];
  onClose: () => void;
  onEdit: (orchid: Orchid) => void;
  onDelete: (id: string) => void;
  onAddLog: (orchid: Orchid) => void;
  onDeleteLog: (logId: string) => void;
  onTipFeedback: (tipKey: string, feedback: TipFeedbackValue) => void;
}

type DetailTab = 'photos' | 'watering' | 'fertilizer' | 'ml';

export const OrchidDetailModal: React.FC<Props> = ({
  orchid,
  prediction,
  logs,
  onClose,
  onEdit,
  onDelete,
  onAddLog,
  onDeleteLog,
  onTipFeedback,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('photos');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'raices' | 'hojas'>('all');
  const [zoomedPhoto, setZoomedPhoto] = useState<{ uri: string; date: string; title: string } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showComparison, setShowComparison] = useState(false);

  const handleOpenZoom = (photo: { uri: string; date: string; title: string }) => {
    setZoomedPhoto(photo);
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoomScale((s) => Math.min(3.5, Number((s + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomScale((s) => {
      const next = Math.max(1, Number((s - 0.5).toFixed(1)));
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    setZoomScale((s) => {
      if (s > 1) {
        setPanOffset({ x: 0, y: 0 });
        return 1;
      }
      return 2;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoomScale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    const touch = e.touches[0];
    setPanOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const handleTouchEnd = () => setIsDragging(false);

  const isWaterDue = prediction.daysUntilNextWatering <= 0;
  const isUrgent = prediction.daysUntilNextWatering <= -2;

  // Filtrado y ordenación de fotos (de más reciente a más antigua)
  const logsWithPhotos = logs
    .filter((l) => Boolean(l.photoUri))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const filteredPhotos = logsWithPhotos.filter((l) => {
    if (photoFilter === 'all') return true;
    if (photoFilter === 'raices') return l.photoTargetPart === 'raices' || l.photoMetrics?.targetPart === 'raices';
    if (photoFilter === 'hojas') return l.photoTargetPart === 'hojas' || l.photoMetrics?.targetPart === 'hojas' || l.photoTargetPart === 'planta_completa';
    return true;
  });

  // Logs de riego y atomización
  const wateringLogs = logs
    .filter((l) => l.watered || l.misted || l.wateringMethod !== 'ninguno')
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  // Logs de fertilización
  const fertilizerLogs = logs
    .filter((l) => l.fertilized)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  // Foto más antigua vs más reciente para comparar crecimiento
  const earliestPhotoLog = logsWithPhotos.length > 1 ? logsWithPhotos[logsWithPhotos.length - 1] : null;
  const latestPhotoLog = logsWithPhotos.length > 0 ? logsWithPhotos[0] : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet modal-sheet-large" onClick={(e) => e.stopPropagation()}>
        {/* Encabezado del Modal */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Flower2 size={20} color="var(--color-primary)" />
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Seguimiento Botánico: {orchid.name}</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tarjeta de Resumen Superior */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              backgroundColor: '#FAFDFB',
              padding: 14,
              borderRadius: 16,
              border: '1px solid #D9E8DE',
              marginBottom: 14,
              flexWrap: 'wrap',
            }}
          >
            <div
              onClick={() => {
                if (orchid.coverPhotoUri) {
                  handleOpenZoom({
                    uri: orchid.coverPhotoUri,
                    date: new Date(orchid.createdAt).toLocaleDateString(),
                    title: `${orchid.name} • Portada`,
                  });
                }
              }}
              style={{
                width: 70,
                height: 70,
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid #D5E5DA',
                position: 'relative',
                cursor: orchid.coverPhotoUri ? 'pointer' : 'default',
              }}
              title={orchid.coverPhotoUri ? 'Toca para ampliar foto de portada' : undefined}
            >
              {orchid.coverPhotoUri ? (
                <>
                  <img src={orchid.coverPhotoUri} alt={orchid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 3,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      borderRadius: 6,
                      padding: '2px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ZoomIn size={10} color="#FFF" />
                  </div>
                </>
              ) : (
                <Flower2 size={34} color="var(--color-primary)" />
              )}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-text)' }}>{orchid.name}</h2>
                <span className="badge badge-orchid">{orchid.genus}</span>
                <span className="badge badge-primary">{GROWTH_STAGE_LABELS[orchid.currentStage] || orchid.currentStage}</span>
              </div>
              <div style={{ fontSize: 12.5, fontStyle: 'italic', color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {orchid.speciesOrHybrid || orchid.genus} • {orchid.locationName}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 4 }}>
                Sustrato: <strong>{SUBSTRATE_RETENTION_FACTOR[orchid.substrate]?.label}</strong> • Maceta: <strong>{orchid.potSizeCm} cm</strong>
              </div>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => onAddLog(orchid)}
                style={{ width: 'auto', padding: '9px 14px', fontSize: 12.5, borderRadius: 10 }}
              >
                <PlusCircle size={15} />
                <span>+ Registrar Foto / Riego</span>
              </button>
              <button
                onClick={() => onEdit(orchid)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Editar planta"
              >
                <Edit size={15} color="var(--color-text-secondary)" />
              </button>
              <button
                onClick={() => onDelete(orchid.id)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: '1px solid #F8D7D7',
                  backgroundColor: '#FFF',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Eliminar planta"
              >
                <Trash2 size={15} color="var(--color-danger)" />
              </button>
            </div>
          </div>

          {/* Selector de Pestañas Interiores */}
          <div
            style={{
              display: 'flex',
              gap: 4,
              backgroundColor: '#EDF4EF',
              padding: 4,
              borderRadius: 12,
              marginBottom: 16,
              overflowX: 'auto',
              scrollbarWidth: 'none',
            }}
          >
            <button
              onClick={() => setActiveTab('photos')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: activeTab === 'photos' ? '#FFF' : 'transparent',
                color: activeTab === 'photos' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'photos' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: activeTab === 'photos' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Camera size={14} />
              <span>Fotos & Raíces ({logsWithPhotos.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('watering')}
              style={{
                flex: 1,
                minWidth: 120,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: activeTab === 'watering' ? '#FFF' : 'transparent',
                color: activeTab === 'watering' ? 'var(--color-water)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'watering' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: activeTab === 'watering' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Droplet size={14} />
              <span>Riegos & Atomización ({wateringLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('fertilizer')}
              style={{
                flex: 1,
                minWidth: 110,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: activeTab === 'fertilizer' ? '#FFF' : 'transparent',
                color: activeTab === 'fertilizer' ? 'var(--color-orchid)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'fertilizer' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: activeTab === 'fertilizer' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Beaker size={14} />
              <span>Fertilización ({fertilizerLogs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ml')}
              style={{
                flex: 1,
                minWidth: 90,
                padding: '8px 10px',
                borderRadius: 10,
                border: 'none',
                backgroundColor: activeTab === 'ml' ? '#FFF' : 'transparent',
                color: activeTab === 'ml' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontWeight: activeTab === 'ml' ? 700 : 600,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                boxShadow: activeTab === 'ml' ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <Sparkles size={14} />
              <span>IA & Tips</span>
            </button>
          </div>

          {/* ========================================================= */}
          {/* PESTAÑA 1: REGISTRO DE FOTOS CON FECHA (CRECIMIENTO Y RAÍCES) */}
          {/* ========================================================= */}
          {activeTab === 'photos' && (
            <div>
              {/* Controles de la Galería */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                {/* Filtro por tipo de foto */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setPhotoFilter('all')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 16,
                      border: '1px solid',
                      borderColor: photoFilter === 'all' ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: photoFilter === 'all' ? 'var(--color-primary)' : '#FFF',
                      color: photoFilter === 'all' ? '#FFF' : 'var(--color-text-secondary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Todas ({logsWithPhotos.length})
                  </button>

                  <button
                    onClick={() => setPhotoFilter('raices')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 16,
                      border: '1px solid',
                      borderColor: photoFilter === 'raices' ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: photoFilter === 'raices' ? 'var(--color-primary)' : '#FFF',
                      color: photoFilter === 'raices' ? '#FFF' : 'var(--color-text-secondary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🌱 Raíces & Velamen
                  </button>

                  <button
                    onClick={() => setPhotoFilter('hojas')}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 16,
                      border: '1px solid',
                      borderColor: photoFilter === 'hojas' ? 'var(--color-primary)' : 'var(--color-border)',
                      backgroundColor: photoFilter === 'hojas' ? 'var(--color-primary)' : '#FFF',
                      color: photoFilter === 'hojas' ? '#FFF' : 'var(--color-text-secondary)',
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    🌿 Hojas & Follaje
                  </button>
                </div>

                {/* Botón Comparar Antes y Después (si hay al menos 2 fotos) */}
                {logsWithPhotos.length >= 2 && (
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--color-primary)',
                      backgroundColor: showComparison ? 'var(--color-primary-light)' : '#FFF',
                      color: 'var(--color-primary-dark)',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span>{showComparison ? 'Ocultar Comparativa' : 'Comparar Antes y Después'}</span>
                  </button>
                )}
              </div>

              {/* Vista Comparativa de Crecimiento (Antes vs Ahora) */}
              {showComparison && earliestPhotoLog && latestPhotoLog && (
                <div className="card" style={{ backgroundColor: '#FAFDFB', borderColor: '#C4E1D0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 8, fontSize: 13 }}>
                    <Sparkles size={16} />
                    <span>Evolución de Crecimiento Botánico</span>
                  </div>
                  <div className="form-row-2col">
                    {/* Foto más antigua */}
                    <div
                      style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 8, border: '1px solid #E5EDE7', cursor: 'pointer' }}
                      onClick={() =>
                        handleOpenZoom({
                          uri: earliestPhotoLog.photoUri!,
                          date: new Date(earliestPhotoLog.recordedAt).toLocaleDateString(),
                          title: `${orchid.name} • Primer Registro`,
                        })
                      }
                      title="Toca para ampliar foto"
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>PRIMER REGISTRO: {new Date(earliestPhotoLog.recordedAt).toLocaleDateString()}</span>
                        <ZoomIn size={12} color="var(--color-primary)" />
                      </div>
                      <img
                        src={earliestPhotoLog.photoUri!}
                        alt="Primer registro"
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
                      />
                      {earliestPhotoLog.photoMetrics && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                          Vigor: <strong>{earliestPhotoLog.photoMetrics.greenVigorScore}%</strong> • Velamen:{' '}
                          <strong>{earliestPhotoLog.photoMetrics.velamenHydrationScore}%</strong>
                        </div>
                      )}
                    </div>

                    {/* Foto más reciente */}
                    <div
                      style={{ backgroundColor: '#FFF', borderRadius: 12, padding: 8, border: '1px solid #E5EDE7', cursor: 'pointer' }}
                      onClick={() =>
                        handleOpenZoom({
                          uri: latestPhotoLog.photoUri!,
                          date: new Date(latestPhotoLog.recordedAt).toLocaleDateString(),
                          title: `${orchid.name} • Registro Actual`,
                        })
                      }
                      title="Toca para ampliar foto"
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary-dark)', marginBottom: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>REGISTRO ACTUAL: {new Date(latestPhotoLog.recordedAt).toLocaleDateString()}</span>
                        <ZoomIn size={12} color="var(--color-primary)" />
                      </div>
                      <img
                        src={latestPhotoLog.photoUri!}
                        alt="Registro actual"
                        style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 8 }}
                      />
                      {latestPhotoLog.photoMetrics && (
                        <div style={{ fontSize: 11, color: 'var(--color-primary-dark)', marginTop: 4 }}>
                          Vigor: <strong>{latestPhotoLog.photoMetrics.greenVigorScore}%</strong> • Velamen:{' '}
                          <strong>{latestPhotoLog.photoMetrics.velamenHydrationScore}%</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Fotos en Rejilla Responsiva */}
              {filteredPhotos.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)' }}>
                  <Camera size={36} color="var(--color-text-muted)" style={{ margin: '0 auto 8px auto' }} />
                  <p style={{ margin: '0 0 12px 0', fontSize: 13 }}>
                    Aún no hay fotos registradas para este filtro. Toma fotos periódicas para ver el crecimiento de hojas y raíces.
                  </p>
                  <button
                    className="btn-primary"
                    onClick={() => onAddLog(orchid)}
                    style={{ width: 'auto', margin: '0 auto', padding: '8px 18px', fontSize: 13 }}
                  >
                    <Camera size={15} />
                    <span>Tomar Primera Foto</span>
                  </button>
                </div>
              ) : (
                <div className="responsive-grid-2">
                  {filteredPhotos.map((log) => {
                    const isRoot = log.photoTargetPart === 'raices' || log.photoMetrics?.targetPart === 'raices';
                    const targetLabel = isRoot ? '🌱 Raíces & Velamen' : '🌿 Crecimiento Follaje';
                    const logDate = new Date(log.recordedAt);

                    return (
                      <div key={log.id} className="card" style={{ padding: 12, margin: 0 }}>
                        {/* Cabecera de la foto con Fecha */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={14} color="var(--color-primary)" />
                            <strong style={{ fontSize: 13, color: 'var(--color-text)' }}>
                              {logDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </strong>
                          </div>
                          <span className={`badge ${isRoot ? 'badge-primary' : 'badge-orchid'}`}>
                            {targetLabel}
                          </span>
                        </div>

                        {/* Imagen con botón para ampliar */}
                        <div
                          style={{
                            position: 'relative',
                            borderRadius: 12,
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            height: 200,
                            cursor: 'pointer',
                          }}
                          onClick={() =>
                            handleOpenZoom({
                              uri: log.photoUri!,
                              date: logDate.toLocaleDateString(),
                              title: `${orchid.name} (${targetLabel})`,
                            })
                          }
                        >
                          <img
                            src={log.photoUri!}
                            alt="Foto de crecimiento"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: '#FFF',
                              borderRadius: 8,
                              padding: '4px 8px',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <ZoomIn size={12} />
                            <span>Ver grande</span>
                          </div>
                        </div>

                        {/* Diagnóstico de Visión Canvas */}
                        {log.photoMetrics && (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: '#FAFDFB', borderRadius: 8, border: '1px solid #E5EDE7', fontSize: 11.5 }}>
                            <div style={{ color: 'var(--color-text)', marginBottom: 4, fontWeight: 600 }}>
                              {log.photoMetrics.summary}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                              <span>Clorofila: <strong style={{ color: 'var(--color-success)' }}>{log.photoMetrics.greenVigorScore}%</strong></span>
                              <span>Velamen: <strong style={{ color: 'var(--color-water)' }}>{log.photoMetrics.velamenHydrationScore}%</strong></span>
                            </div>
                          </div>
                        )}

                        {/* Anotaciones botánicas del registro */}
                        {log.notes && (
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: '16px' }}>
                            “{log.notes}”
                          </div>
                        )}

                        {/* Pie con botón eliminar registro */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, paddingTop: 6, borderTop: '1px solid #EDF2EE' }}>
                          <button
                            onClick={() => onDeleteLog(log.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger)',
                              fontSize: 11.5,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Eliminar foto</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 2: ESPACIO PARA RIEGO Y ATOMIZACIÓN */}
          {/* ========================================================= */}
          {activeTab === 'watering' && (
            <div>
              {/* Resumen del Ciclo de Riego Actual */}
              <div
                className="card"
                style={{
                  borderLeft: `4px solid ${isUrgent ? 'var(--color-danger)' : isWaterDue ? 'var(--color-amber)' : 'var(--color-primary)'}`,
                  backgroundColor: '#FAFDFB',
                  marginBottom: 14,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 14, color: 'var(--color-primary-dark)' }}>
                    <Droplet size={17} />
                    <span>Ciclo de Riego Predictivo</span>
                  </div>
                  <span className="badge badge-orchid">{prediction.personalWeightPct}% adaptado</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text)', marginBottom: 2 }}>
                  {isUrgent
                    ? `¡Riego atrasado ${Math.abs(prediction.daysUntilNextWatering)} días!`
                    : isWaterDue
                    ? '¡Turno de regar hoy según ML!'
                    : `Próximo riego estimado en ~${prediction.daysUntilNextWatering} días`}
                </div>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Intervalo proyectado: <strong>{prediction.predictedWaterIntervalDays} días</strong> (base del género: {prediction.botanicalPriorWaterDays} días).
                </p>
              </div>

              {/* Lista de Registros de Riego y Atomización */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.8px', marginBottom: 8 }}>
                HISTORIAL DE RIEGOS Y ATOMIZACIONES ({wateringLogs.length})
              </div>

              {wateringLogs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No hay registros de riego o atomización guardados aún.
                </div>
              ) : (
                wateringLogs.map((log) => {
                  const logDate = new Date(log.recordedAt);
                  return (
                    <div key={log.id} className="card" style={{ padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>
                            {logDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          {log.watered && <span className="badge badge-water">💧 Regada</span>}
                          {log.misted && <span className="badge badge-primary">💨 Atomizada</span>}
                        </div>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Detalles del método y raíces */}
                      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        {log.watered && (
                          <div>Método: <strong>{WATERING_METHOD_LABELS[log.wateringMethod] || log.wateringMethod}</strong></div>
                        )}
                        <div>Estado radicular: <strong>{ROOT_CONDITION_LABELS[log.rootCondition]}</strong></div>
                      </div>

                      {/* Anotaciones de Riego y Atomización */}
                      {(log.mistingNotes || log.notes) && (
                        <div style={{ backgroundColor: '#F8FAF9', padding: '8px 10px', borderRadius: 8, border: '1px solid #EAEFEA', fontSize: 12, marginTop: 6 }}>
                          {log.mistingNotes && (
                            <div style={{ color: 'var(--color-primary-dark)', marginBottom: 2 }}>
                              <strong>Atomización:</strong> {log.mistingNotes}
                            </div>
                          )}
                          {log.notes && (
                            <div style={{ color: 'var(--color-text)' }}>
                              <strong>Notas:</strong> {log.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 3: ESPACIO PARA FERTILIZACIÓN */}
          {/* ========================================================= */}
          {activeTab === 'fertilizer' && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.8px', marginBottom: 8 }}>
                HISTORIAL DE FERTILIZACIÓN Y NUTRIENTES ({fertilizerLogs.length})
              </div>

              {fertilizerLogs.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: 13 }}>
                  No se han registrado fertilizaciones todavía.
                </div>
              ) : (
                fertilizerLogs.map((log) => {
                  const logDate = new Date(log.recordedAt);
                  return (
                    <div key={log.id} className="card" style={{ padding: 12, marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>
                            {logDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="badge badge-orchid">🧪 Fertilizada</span>
                        </div>
                        <button
                          onClick={() => onDeleteLog(log.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2 }}
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12, marginBottom: 6 }}>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: 11 }}>Fórmula:</span>
                          <strong>{FERTILIZER_LABELS[log.fertilizerType] || log.fertilizerType}</strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: 11 }}>Dosis:</span>
                          <strong>{FERTILIZER_DOSE_LABELS[log.fertilizerDose] || log.fertilizerDose}</strong>
                        </div>
                      </div>

                      {log.fertilizerNotes && (
                        <div style={{ backgroundColor: '#FAF5FA', padding: '8px 10px', borderRadius: 8, border: '1px solid #EEDCEE', fontSize: 12, color: 'var(--color-orchid-deep)' }}>
                          <strong>Anotaciones de dosis:</strong> {log.fertilizerNotes}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* PESTAÑA 4: INTELIGENCIA ARTIFICIAL & TIPS BOTÁNICOS */}
          {/* ========================================================= */}
          {activeTab === 'ml' && (
            <div>
              {/* Riesgos Fisiológicos Detectados */}
              {prediction.risks.length > 0 && (
                <div className="card" style={{ backgroundColor: '#FDF7F7', borderColor: '#F8DCDC', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: 'var(--color-danger)', marginBottom: 8 }}>
                    <AlertTriangle size={18} />
                    <span>Riesgos Fisiológicos Detectados</span>
                  </div>
                  {prediction.risks.map((risk) => (
                    <div key={risk.riskId} style={{ marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #F5E4E4' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <strong style={{ fontSize: 13, color: 'var(--color-danger)' }}>{risk.title}</strong>
                        <span className={`badge ${risk.severity === 'alto' ? 'badge-danger' : 'badge-amber'}`}>
                          {Math.round(risk.probability * 100)}% prob.
                        </span>
                      </div>
                      {risk.signals.map((sig, i) => (
                        <div key={i} style={{ fontSize: 11.5, color: 'var(--color-text-secondary)' }}>• {sig}</div>
                      ))}
                      <div style={{ fontSize: 11.5, color: 'var(--color-text)', marginTop: 4 }}>
                        <strong>Acción recomendada:</strong> {risk.correctiveAction}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Atribución de Factores */}
              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
                  Factores que calibran el intervalo de riego:
                </div>
                <MLAttributionBar attributions={prediction.waterAttributions} />
              </div>

              {/* Tips Adaptativos Calibrados */}
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.8px', marginBottom: 8 }}>
                TIPS DE MANEJO CALIBRADOS
              </div>
              {prediction.tips.map((tip) => (
                <TipCard key={tip.id} tip={tip} onFeedback={onTipFeedback} />
              ))}
            </div>
          )}

          {/* Modal de Zoom de Foto a Pantalla Completa con Controles Interactivos */}
          {zoomedPhoto && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.95)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 14px 20px 14px',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: zoomScale > 1 ? 'none' : 'auto',
              }}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Barra Superior con Título y Controles */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 820,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  color: '#FFF',
                  zIndex: 210,
                  backgroundColor: 'rgba(20,28,24,0.85)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.12)',
                  gap: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {zoomedPhoto.title}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#A0B4AA' }}>{zoomedPhoto.date}</div>
                </div>

                {/* Controles de Zoom */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    disabled={zoomScale <= 1}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: zoomScale <= 1 ? '#666' : '#FFF',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: zoomScale <= 1 ? 'default' : 'pointer',
                    }}
                    title="Alejar (-)"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResetZoom();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#4ADE80',
                      minWidth: 42,
                      textAlign: 'center',
                      cursor: 'pointer',
                      padding: '4px 6px',
                    }}
                    title="Click para restablecer 100%"
                  >
                    {Math.round(zoomScale * 100)}%
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    disabled={zoomScale >= 3.5}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: zoomScale >= 3.5 ? '#666' : '#FFF',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: zoomScale >= 3.5 ? 'default' : 'pointer',
                    }}
                    title="Acercar (+)"
                  >
                    <ZoomIn size={16} />
                  </button>

                  {zoomScale > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetZoom();
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.15)',
                        border: 'none',
                        color: '#FFF',
                        borderRadius: 8,
                        padding: '6px 8px',
                        fontSize: 11,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                        cursor: 'pointer',
                      }}
                      title="Restablecer vista a 1x"
                    >
                      <RotateCcw size={12} />
                      <span>1x</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setZoomedPhoto(null);
                      handleResetZoom();
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.25)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#FFF',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      fontSize: 16,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      marginLeft: 4,
                    }}
                    title="Cerrar visor"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Visor Central de la Imagen con Soporte de Arrastre y Doble Toque */}
              <div
                style={{
                  flex: 1,
                  width: '100%',
                  maxWidth: 900,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'relative',
                  cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onDoubleClick={handleDoubleTap}
              >
                <img
                  src={zoomedPhoto.uri}
                  alt={zoomedPhoto.title}
                  draggable={false}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '75vh',
                    borderRadius: 10,
                    objectFit: 'contain',
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    imageRendering: 'auto',
                  }}
                />
              </div>

              {/* Barra de Instrucciones Inferior */}
              <div
                style={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 11.5,
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  padding: '6px 14px',
                  borderRadius: 20,
                  zIndex: 210,
                }}
              >
                {zoomScale > 1
                  ? 'Arrastra para moverte • Doble toque para volver a 100%'
                  : 'Doble toque o usa (+) para ampliar raíces y hojas con nitidez'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
