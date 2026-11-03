import React, { useRef, useState } from 'react';
import { X, Camera, Eye, CheckCircle, Droplet, Sparkles, Beaker, Calendar, Image as ImageIcon } from 'lucide-react';
import {
  CareEventType,
  CareLog,
  FertilizerDose,
  FertilizerType,
  GrowthStage,
  LeafCondition,
  Orchid,
  PhotoTargetPart,
  PhotoVisionMetrics,
  PseudobulbCondition,
  RootCondition,
  SubstrateType,
  WateringMethod,
} from '../../types/orchid';
import {
  FERTILIZER_DOSE_LABELS,
  FERTILIZER_LABELS,
  LEAF_CONDITION_LABELS,
  ROOT_CONDITION_LABELS,
  WATERING_METHOD_LABELS,
} from '../../data/orchidCatalog';
import { analyzePhotoInBrowser } from '../../ml/photoVisionWeb';

interface Props {
  orchids: Orchid[];
  initialOrchidId?: string;
  onClose: () => void;
  onSave: (log: CareLog) => void;
}

export const NewCareLogModal: React.FC<Props> = ({
  orchids,
  initialOrchidId,
  onClose,
  onSave,
}) => {
  const fileCameraRef = useRef<HTMLInputElement>(null);
  const fileGalleryRef = useRef<HTMLInputElement>(null);

  const [selectedOrchidId, setSelectedOrchidId] = useState(initialOrchidId || orchids[0]?.id || '');
  const selectedOrchid = orchids.find((o) => o.id === selectedOrchidId);

  // Fecha del registro (editable, default hoy)
  const [recordedDate, setRecordedDate] = useState(() => new Date().toISOString().substring(0, 10));

  // 1. Riego
  const [watered, setWatered] = useState(true);
  const [wateringMethod, setWateringMethod] = useState<WateringMethod>('inmersion');
  const [wateringNotes, setWateringNotes] = useState('');

  // 2. Atomización / Pulverización
  const [misted, setMisted] = useState(false);
  const [mistingNotes, setMistingNotes] = useState('');

  // 3. Fertilización
  const [fertilized, setFertilized] = useState(false);
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>('equilibrado_20_20_20');
  const [fertilizerDose, setFertilizerDose] = useState<FertilizerDose>('cuarto');
  const [fertilizerNotes, setFertilizerNotes] = useState('');

  // 4. Trasplante o poda
  const repotted = false;
  const newSubstrate: SubstrateType = selectedOrchid?.substrate || 'corteza_pino';
  const pruned = false;

  // 5. Morfología & Crecimiento
  const [rootCondition, setRootCondition] = useState<RootCondition>('plateadas_secas');
  const [leafCondition, setLeafCondition] = useState<LeafCondition>('firmes_verdes');
  const pseudobulbCondition: PseudobulbCondition = 'no_aplica';
  const growthStage: GrowthStage = selectedOrchid?.currentStage || 'vegetativo';
  const [leafCount, setLeafCount] = useState('4');
  const [spikeCount, setSpikeCount] = useState('0');
  const bloomCount = '0';
  const [healthScore, setHealthScore] = useState('85');

  // Ambiente
  const [tempDay, setTempDay] = useState(selectedOrchid?.baselineTempDayC?.toString() || '23');
  const tempNight = selectedOrchid?.baselineTempNightC?.toString() || '18';
  const humidity = selectedOrchid?.baselineHumidityPct?.toString() || '60';

  // Foto y Visión Local
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoTargetPart, setPhotoTargetPart] = useState<PhotoTargetPart>('raices');
  const [photoMetrics, setPhotoMetrics] = useState<PhotoVisionMetrics | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);
  const [rawFile, setRawFile] = useState<File | null>(null);

  // Notas generales
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePhotoFile = async (file: File) => {
    setRawFile(file);
    try {
      setAnalyzingPhoto(true);
      const { metrics, previewDataUrl } = await analyzePhotoInBrowser(file, photoTargetPart);
      setPhotoUri(previewDataUrl);
      setPhotoMetrics(metrics);
      setHealthScore(metrics.greenVigorScore.toString());
      if (photoTargetPart === 'raices') {
        if (metrics.velamenHydrationScore <= 40) {
          setRootCondition('plateadas_secas');
        } else if (metrics.velamenHydrationScore >= 65) {
          setRootCondition('verdes_hidratadas');
        }
      }
    } catch (e: any) {
      alert(`Error al analizar foto: ${e.message}`);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleTargetPartChange = async (target: PhotoTargetPart) => {
    setPhotoTargetPart(target);
    if (rawFile) {
      try {
        setAnalyzingPhoto(true);
        const { metrics } = await analyzePhotoInBrowser(rawFile, target);
        setPhotoMetrics(metrics);
      } catch (err) {
        console.error(err);
      } finally {
        setAnalyzingPhoto(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrchidId) {
      alert('Por favor selecciona una orquídea.');
      return;
    }

    setSaving(true);
    let eventType: CareEventType = 'inspeccion';
    if (watered && fertilized) eventType = 'riego_y_abono';
    else if (watered) eventType = 'riego';
    else if (fertilized) eventType = 'fertilizacion';
    else if (repotted) eventType = 'trasplante';
    else if (pruned) eventType = 'poda';

    // Fecha con timestamp
    const logDate = recordedDate ? new Date(`${recordedDate}T12:00:00`).toISOString() : new Date().toISOString();

    // Notas consolidadas
    const noteParts: string[] = [];
    if (wateringNotes.trim()) noteParts.push(`[Riego] ${wateringNotes.trim()}`);
    if (mistingNotes.trim()) noteParts.push(`[Atomización] ${mistingNotes.trim()}`);
    if (fertilizerNotes.trim()) noteParts.push(`[Fertilización] ${fertilizerNotes.trim()}`);
    if (notes.trim()) noteParts.push(notes.trim());

    const logToSave: CareLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      orchidId: selectedOrchidId,
      recordedAt: logDate,
      eventType,
      watered,
      wateringMethod: watered ? wateringMethod : 'ninguno',
      misted,
      mistingNotes: mistingNotes.trim() || undefined,
      fertilized,
      fertilizerType: fertilized ? fertilizerType : 'ninguno',
      fertilizerDose: fertilized ? fertilizerDose : 'ninguna',
      fertilizerNotes: fertilizerNotes.trim() || undefined,
      repotted,
      newSubstrate: repotted ? newSubstrate : null,
      pruned,
      leafCount: parseInt(leafCount, 10) || 4,
      newLeafCount: 0,
      spikeCount: parseInt(spikeCount, 10) || 0,
      bloomCount: parseInt(bloomCount, 10) || 0,
      rootCondition,
      leafCondition,
      pseudobulbCondition,
      growthStage,
      healthScore: parseFloat(healthScore) || 85.0,
      tempDayC: parseFloat(tempDay) || 23.0,
      tempNightC: parseFloat(tempNight) || 18.0,
      humidityPct: parseFloat(humidity) || 60.0,
      lightLevel: selectedOrchid?.defaultLight || 'luz_filtrada_brillante',
      ventilation: selectedOrchid?.defaultVentilation || 'media',
      photoUri,
      photoTargetPart,
      photoMetrics,
      notes: noteParts.join(' | '),
    };

    onSave(logToSave);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet modal-sheet-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Droplet size={20} color="var(--color-primary)" />
            <h3>Nuevo Registro de Avance y Cuidados</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Fila 1: Orquídea y Fecha del Registro */}
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Orquídea *</label>
              <select
                className="form-input"
                value={selectedOrchidId}
                onChange={(e) => setSelectedOrchidId(e.target.value)}
              >
                {orchids.map((orc) => (
                  <option key={orc.id} value={orc.id}>
                    {orc.name} ({orc.genus})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={13} />
                  Fecha de la Observación / Foto *
                </span>
              </label>
              <input
                type="date"
                className="form-input"
                value={recordedDate}
                onChange={(e) => setRecordedDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* SECCIÓN 1: FOTO CON FECHA (CRECIMIENTO DE PLANTA O RAÍCES) */}
          <div className="card" style={{ backgroundColor: '#FAFDFB', borderColor: '#D4E6DC', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5, color: 'var(--color-primary-dark)' }}>
                <Camera size={16} />
                <span>Foto de Crecimiento (Planta o Raíces)</span>
              </div>
              <span className="badge badge-primary">Visión Offline</span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 10px 0', lineHeight: '16px' }}>
              Guarda fotos periódicas con fecha para comparar el desarrollo de nuevas hojas y la salud del velamen de las raíces.
            </p>

            {/* Selector de Objetivo de la Foto */}
            <div style={{ marginBottom: 10 }}>
              <label className="form-label">¿Qué parte estás fotografiando?</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleTargetPartChange('raices')}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: photoTargetPart === 'raices' ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: photoTargetPart === 'raices' ? 'var(--color-primary-light)' : '#FFF',
                    color: photoTargetPart === 'raices' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🌱 Raíces / Velamen
                </button>

                <button
                  type="button"
                  onClick={() => handleTargetPartChange('hojas')}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: photoTargetPart === 'hojas' ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: photoTargetPart === 'hojas' ? 'var(--color-primary-light)' : '#FFF',
                    color: photoTargetPart === 'hojas' ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🌿 Crecimiento Follaje
                </button>

                <button
                  type="button"
                  onClick={() => handleTargetPartChange('flores')}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: photoTargetPart === 'flores' ? 'var(--color-orchid)' : 'var(--color-border)',
                    backgroundColor: photoTargetPart === 'flores' ? 'var(--color-orchid-light)' : '#FFF',
                    color: photoTargetPart === 'flores' ? 'var(--color-orchid-deep)' : 'var(--color-text-secondary)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  🌸 Flores / Vara
                </button>
              </div>
            </div>

            {/* Botones de Captura */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => fileCameraRef.current?.click()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--color-primary)',
                  backgroundColor: '#FFF',
                  color: 'var(--color-primary)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <Camera size={16} />
                <span>Tomar Foto</span>
              </button>

              <button
                type="button"
                onClick={() => fileGalleryRef.current?.click()}
                style={{
                  flex: 1,
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid var(--color-border)',
                  backgroundColor: '#FFF',
                  color: 'var(--color-text-secondary)',
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <ImageIcon size={16} />
                <span>Subir de Galería</span>
              </button>

              <input
                ref={fileCameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoFile(f);
                }}
              />
              <input
                ref={fileGalleryRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoFile(f);
                }}
              />
            </div>

            {/* Vista previa y Métricas de la Foto */}
            {analyzingPhoto && (
              <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: 'var(--color-primary-dark)' }}>
                <Sparkles size={16} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
                Analizando clorofila e hidratación del velamen...
              </div>
            )}

            {photoUri && (
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)', backgroundColor: '#000' }}>
                <img src={photoUri} alt="Vista previa" style={{ width: '100%', maxHeight: 220, objectFit: 'contain', display: 'block' }} />
                {photoMetrics && (
                  <div style={{ padding: 10, backgroundColor: '#FAFDFB', borderTop: '1px solid #DFECE4', fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <strong style={{ color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Eye size={14} />
                        {photoTargetPart === 'raices' ? 'Diagnóstico Radicular' : 'Diagnóstico de Follaje'}
                      </strong>
                      <span className="badge badge-primary">{recordedDate}</span>
                    </div>
                    <div style={{ color: 'var(--color-text)', marginBottom: 6 }}>{photoMetrics.summary}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11.5 }}>
                      <div style={{ backgroundColor: '#FFF', padding: '6px 8px', borderRadius: 8, border: '1px solid #E5EDE7' }}>
                        <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Vigor de Clorofila:</span>
                        <strong style={{ color: 'var(--color-success)' }}>{photoMetrics.greenVigorScore} / 100</strong>
                      </div>
                      <div style={{ backgroundColor: '#FFF', padding: '6px 8px', borderRadius: 8, border: '1px solid #E5EDE7' }}>
                        <span style={{ color: 'var(--color-text-secondary)', display: 'block' }}>Hidratación Velamen:</span>
                        <strong style={{ color: 'var(--color-water)' }}>{photoMetrics.velamenHydrationScore} / 100</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECCIÓN 2: ESPACIO PARA RIEGO & ATOMIZACIÓN */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5, color: 'var(--color-water)', marginBottom: 10 }}>
              <Droplet size={17} />
              <span>Anotaciones de Riego y Atomización</span>
            </div>

            {/* Switches de Riego y Atomización en 2 columnas */}
            <div className="form-row-2col" style={{ marginBottom: 12 }}>
              {/* Opción 1: Riego */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: watered ? 'var(--color-water-light)' : '#F6FAF7',
                  border: '1px solid',
                  borderColor: watered ? 'var(--color-water)' : 'var(--color-border)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={watered}
                    onChange={(e) => setWatered(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-water)' }}
                  />
                  <span>¿Regaste hoy?</span>
                </label>

                {watered && (
                  <div style={{ marginTop: 8 }}>
                    <label className="form-label" style={{ fontSize: 11 }}>Método de Riego:</label>
                    <select
                      className="form-input"
                      value={wateringMethod}
                      onChange={(e) => setWateringMethod(e.target.value as WateringMethod)}
                      style={{ fontSize: 12.5, padding: '7px 10px' }}
                    >
                      {Object.entries(WATERING_METHOD_LABELS)
                        .filter(([k]) => k !== 'ninguno')
                        .map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Opción 2: Atomización / Nebulización */}
              <div
                style={{
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: misted ? '#EDF5FD' : '#F6FAF7',
                  border: '1px solid',
                  borderColor: misted ? '#60A5FA' : 'var(--color-border)',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={misted}
                    onChange={(e) => setMisted(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: '#2563EB' }}
                  />
                  <span>¿Atomizaste / Pulverizaste?</span>
                </label>
                <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: '6px 0 0 0' }}>
                  Pulverización fina en raíces aéreas o follaje matutino.
                </p>
              </div>
            </div>

            {/* Espacios de texto dedicados para anotaciones de riego y atomización */}
            <div className="form-row-2col">
              <div className="form-group" style={{ marginBottom: 6 }}>
                <label className="form-label">Anotaciones de Riego:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Drenado completo, sustrato seco al tacto..."
                  value={wateringNotes}
                  onChange={(e) => setWateringNotes(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 6 }}>
                <label className="form-label">Anotaciones de Atomización:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: Rocío suave solo en raíces externas, 8:00 AM..."
                  value={mistingNotes}
                  onChange={(e) => setMistingNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: ESPACIO PARA FERTILIZACIÓN */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5, color: 'var(--color-orchid)', marginBottom: 10 }}>
              <Beaker size={17} />
              <span>Registro de Fertilización y Nutrición</span>
            </div>

            <div
              style={{
                padding: 12,
                borderRadius: 12,
                backgroundColor: fertilized ? 'var(--color-orchid-light)' : '#FBF9FB',
                border: '1px solid',
                borderColor: fertilized ? 'var(--color-orchid)' : 'var(--color-border)',
                marginBottom: 10,
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={fertilized}
                  onChange={(e) => setFertilized(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--color-orchid)' }}
                />
                <span>¿Aplicaste fertilizante en esta fecha?</span>
              </label>

              {fertilized && (
                <div className="form-row-2col" style={{ marginTop: 10 }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Fórmula / Tipo:</label>
                    <select
                      className="form-input"
                      value={fertilizerType}
                      onChange={(e) => setFertilizerType(e.target.value as FertilizerType)}
                      style={{ fontSize: 12.5, padding: '7px 10px' }}
                    >
                      {Object.entries(FERTILIZER_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 11 }}>Dosis Utilizada:</label>
                    <select
                      className="form-input"
                      value={fertilizerDose}
                      onChange={(e) => setFertilizerDose(e.target.value as FertilizerDose)}
                      style={{ fontSize: 12.5, padding: '7px 10px' }}
                    >
                      {Object.entries(FERTILIZER_DOSE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 4 }}>
              <label className="form-label">Anotaciones de Fertilización:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 1/4 cucharadita x litro, dilución baja semanal..."
                value={fertilizerNotes}
                onChange={(e) => setFertilizerNotes(e.target.value)}
              />
            </div>
          </div>

          {/* SECCIÓN 4: ESTADO RADICULAR Y CRECIMIENTO VEGETATIVO */}
          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13.5, color: 'var(--color-primary-dark)', marginBottom: 10 }}>
              <Sparkles size={17} />
              <span>Desarrollo de Raíces, Hojas y Clima</span>
            </div>

            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">Estado de las Raíces:</label>
                <select
                  className="form-input"
                  value={rootCondition}
                  onChange={(e) => setRootCondition(e.target.value as RootCondition)}
                >
                  {Object.entries(ROOT_CONDITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Estado del Follaje:</label>
                <select
                  className="form-input"
                  value={leafCondition}
                  onChange={(e) => setLeafCondition(e.target.value as LeafCondition)}
                >
                  {Object.entries(LEAF_CONDITION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row-3col">
              <div className="form-group">
                <label className="form-label">Hojas Totales:</label>
                <input
                  type="number"
                  className="form-input"
                  value={leafCount}
                  onChange={(e) => setLeafCount(e.target.value)}
                  min="1"
                  max="40"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Varas Florales:</label>
                <input
                  type="number"
                  className="form-input"
                  value={spikeCount}
                  onChange={(e) => setSpikeCount(e.target.value)}
                  min="0"
                  max="10"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temperatura (°C):</label>
                <input
                  type="number"
                  className="form-input"
                  value={tempDay}
                  onChange={(e) => setTempDay(e.target.value)}
                />
              </div>
            </div>

            {/* Anotaciones generales libres */}
            <div className="form-group" style={{ marginBottom: 4 }}>
              <label className="form-label">Observaciones y Notas Generales:</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Ej: Nueva punta de raíz activa verde asomando, hoja apical creciendo rápido..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Botón Guardar */}
          <button type="submit" className="btn-primary" disabled={saving}>
            <CheckCircle size={18} />
            <span>{saving ? 'Guardando...' : 'Guardar Registro'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
