import React, { useRef, useState } from 'react';
import { X, Camera, Save } from 'lucide-react';
import { GrowthStage, LightLevel, Orchid, OrchidGenus, SubstrateType, VentilationLevel } from '../../types/orchid';
import { GROWTH_STAGE_LABELS, LIGHT_LABELS, SUBSTRATE_RETENTION_FACTOR } from '../../data/orchidCatalog';

interface Props {
  initialOrchid?: Orchid | null;
  onClose: () => void;
  onSave: (orchid: Orchid) => void;
}

const GENERA: OrchidGenus[] = [
  'Phalaenopsis',
  'Cattleya',
  'Dendrobium',
  'Oncidium',
  'Vanda',
  'Miltoniopsis',
  'Paphiopedilum',
  'Cymbidium',
];

const SUBSTRATES: SubstrateType[] = [
  'corteza_pino',
  'musgo_sphagnum',
  'mixto_corteza_musgo',
  'arcilla_expandida',
  'montada_corcho',
  'piedra_volcanica',
];

const STAGES: GrowthStage[] = [
  'vegetativo',
  'enraizamiento',
  'vara_floral',
  'floracion',
  'reposo',
  'recuperacion',
];

export const NewOrchidModal: React.FC<Props> = ({ initialOrchid, onClose, onSave }) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initialOrchid?.name || '');
  const [genus, setGenus] = useState<OrchidGenus>(initialOrchid?.genus || 'Phalaenopsis');
  const [speciesOrHybrid, setSpeciesOrHybrid] = useState(initialOrchid?.speciesOrHybrid || '');
  const [substrate, setSubstrate] = useState<SubstrateType>(initialOrchid?.substrate || 'corteza_pino');
  const [potTransparent, setPotTransparent] = useState(initialOrchid?.potTransparent ?? true);
  const [potSizeCm, setPotSizeCm] = useState(initialOrchid?.potSizeCm?.toString() || '12');
  const [locationName, setLocationName] = useState(initialOrchid?.locationName || 'Interior luminoso');
  const [defaultLight, setDefaultLight] = useState<LightLevel>(initialOrchid?.defaultLight || 'luz_filtrada_brillante');
  const defaultVentilation: VentilationLevel = initialOrchid?.defaultVentilation || 'media';
  const [tempDay, setTempDay] = useState(initialOrchid?.baselineTempDayC?.toString() || '23');
  const [tempNight, setTempNight] = useState(initialOrchid?.baselineTempNightC?.toString() || '18');
  const [humidity, setHumidity] = useState(initialOrchid?.baselineHumidityPct?.toString() || '60');
  const [currentStage, setCurrentStage] = useState<GrowthStage>(initialOrchid?.currentStage || 'vegetativo');
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(initialOrchid?.coverPhotoUri || null);
  const [notes, setNotes] = useState(initialOrchid?.notes || '');

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCoverPhotoUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para tu orquídea.');
      return;
    }

    const orchidToSave: Orchid = {
      id: initialOrchid?.id || `orchid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      genus,
      speciesOrHybrid: speciesOrHybrid.trim() || genus,
      acquiredAt: initialOrchid?.acquiredAt || new Date().toISOString(),
      lastRepottedAt: initialOrchid?.lastRepottedAt || new Date().toISOString(),
      substrate,
      potTransparent,
      potSizeCm: parseFloat(potSizeCm) || 12.0,
      locationName: locationName.trim() || 'Interior',
      defaultLight,
      defaultVentilation,
      baselineTempDayC: parseFloat(tempDay) || 23.0,
      baselineTempNightC: parseFloat(tempNight) || 18.0,
      baselineHumidityPct: parseFloat(humidity) || 60.0,
      currentStage,
      coverPhotoUri,
      notes: notes.trim(),
      isDemo: false,
      createdAt: initialOrchid?.createdAt || new Date().toISOString(),
    };

    onSave(orchidToSave);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet modal-sheet-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialOrchid ? 'Editar Orquídea' : 'Nueva Orquídea'}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Foto de Portada */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                width: 76,
                height: 76,
                borderRadius: 14,
                border: '1.5px dashed var(--color-border)',
                backgroundColor: '#FAFDFB',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              {coverPhotoUri ? (
                <img src={coverPhotoUri} alt="Portada" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <Camera size={22} color="var(--color-primary)" />
                  <span style={{ fontSize: 9, color: 'var(--color-primary-dark)', fontWeight: 600, marginTop: 2 }}>Foto</span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />

            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Foto de Portada</div>
              <div style={{ fontSize: 11.5, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                Toca el recuadro para tomar una foto o elegirla de tu galería.
              </div>
            </div>
          </div>

          {/* Nombre y Especie en fila de 2 columnas */}
          <div className="form-row-2col">
            <div className="form-group">
              <label className="form-label">Nombre de la Planta *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Phalaenopsis Cascada Blanca"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Especie o Híbrido (Opcional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Phal. aphrodite, Cattleya walkeriana"
                value={speciesOrHybrid}
                onChange={(e) => setSpeciesOrHybrid(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Género Botánico</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {GENERA.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGenus(g)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: genus === g ? 'var(--color-primary)' : '#DFE7E2',
                    backgroundColor: genus === g ? 'var(--color-primary)' : '#F0F5F2',
                    color: genus === g ? '#FFF' : 'var(--color-text-secondary)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Etapa de Crecimiento</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STAGES.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setCurrentStage(s)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: currentStage === s ? 'var(--color-primary)' : '#DFE7E2',
                    backgroundColor: currentStage === s ? 'var(--color-primary)' : '#F0F5F2',
                    color: currentStage === s ? '#FFF' : 'var(--color-text-secondary)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {GROWTH_STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Sustrato y Maceta */}
          <div className="form-group">
            <label className="form-label">Tipo de Sustrato</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SUBSTRATES.map((sub) => (
                <button
                  type="button"
                  key={sub}
                  onClick={() => setSubstrate(sub)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: substrate === sub ? 'var(--color-primary)' : '#DFE7E2',
                    backgroundColor: substrate === sub ? 'var(--color-primary)' : '#F0F5F2',
                    color: substrate === sub ? '#FFF' : 'var(--color-text-secondary)',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {SUBSTRATE_RETENTION_FACTOR[sub]?.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Maceta Transparente</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Permite fotosíntesis en raíces</div>
            </div>
            <input
              type="checkbox"
              checked={potTransparent}
              onChange={(e) => setPotTransparent(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="form-group">
              <label className="form-label">Diámetro Maceta (cm)</label>
              <input
                type="number"
                className="form-input"
                value={potSizeCm}
                onChange={(e) => setPotSizeCm(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Ubicación</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Ventana Este"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nivel de Luz</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(Object.keys(LIGHT_LABELS) as LightLevel[]).map((l) => (
                <button
                  type="button"
                  key={l}
                  onClick={() => setDefaultLight(l)}
                  style={{
                    padding: '5px 8px',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: defaultLight === l ? 'var(--color-primary)' : '#DFE7E2',
                    backgroundColor: defaultLight === l ? 'var(--color-primary)' : '#F0F5F2',
                    color: defaultLight === l ? '#FFF' : 'var(--color-text-secondary)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {LIGHT_LABELS[l]?.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="form-group">
              <label className="form-label">Temp Día (°C)</label>
              <input
                type="number"
                className="form-input"
                value={tempDay}
                onChange={(e) => setTempDay(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Temp Noche (°C)</label>
              <input
                type="number"
                className="form-input"
                value={tempNight}
                onChange={(e) => setTempNight(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Humedad (%)</label>
              <input
                type="number"
                className="form-input"
                value={humidity}
                onChange={(e) => setHumidity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas</label>
            <textarea
              className="form-input"
              rows={2}
              placeholder="Ej: Comprada en vivero, brotando raíz nueva..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary" style={{ marginTop: 10 }}>
            <Save size={18} />
            <span>{initialOrchid ? 'Actualizar Orquídea' : 'Guardar en Teléfono'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

