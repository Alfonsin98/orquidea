import React from 'react';
import { Droplet, AlertCircle, CheckCircle2, ChevronRight, PlusCircle, Flower2 } from 'lucide-react';
import { Orchid, OrchidMLPrediction } from '../../types/orchid';
import { GROWTH_STAGE_LABELS, SUBSTRATE_RETENTION_FACTOR } from '../../data/orchidCatalog';

interface Props {
  orchid: Orchid;
  prediction: OrchidMLPrediction;
  onOpenDetail: (orchid: Orchid) => void;
  onQuickLog: (orchid: Orchid) => void;
}

export const OrchidCard: React.FC<Props> = ({ orchid, prediction, onOpenDetail, onQuickLog }) => {
  const isWaterDue = prediction.daysUntilNextWatering <= 0;
  const isUrgent = prediction.daysUntilNextWatering <= -2;

  const getStatusBannerStyle = () => {
    if (isUrgent) {
      return { bg: 'var(--color-danger-light)', color: 'var(--color-danger)', icon: <AlertCircle size={17} /> };
    }
    if (isWaterDue) {
      return { bg: 'var(--color-amber-light)', color: '#92400E', icon: <Droplet size={17} /> };
    }
    return { bg: 'var(--color-primary-light)', color: 'var(--color-primary-dark)', icon: <CheckCircle2 size={17} /> };
  };

  const status = getStatusBannerStyle();

  return (
    <div className="card" style={{ padding: 14 }}>
      {/* Cabecera de la orquídea */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, cursor: 'pointer' }} onClick={() => onOpenDetail(orchid)}>
        <div
          style={{
            width: 62,
            height: 62,
            borderRadius: 14,
            overflow: 'hidden',
            backgroundColor: 'var(--color-primary-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {orchid.coverPhotoUri ? (
            <img src={orchid.coverPhotoUri} alt={orchid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <Flower2 size={30} color="var(--color-primary)" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {orchid.name}
            </h4>
            {orchid.isDemo && <span className="badge badge-neutral" style={{ fontSize: 9 }}>DEMO</span>}
          </div>

          <div style={{ fontSize: 12, fontStyle: 'italic', color: 'var(--color-text-secondary)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {orchid.speciesOrHybrid || orchid.genus}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-orchid">{orchid.genus}</span>
            <span className="badge badge-primary">{GROWTH_STAGE_LABELS[orchid.currentStage] || orchid.currentStage}</span>
          </div>
        </div>
      </div>

      {/* Banner de Riego y Machine Learning */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          borderRadius: 10,
          backgroundColor: status.bg,
          color: status.color,
          marginBottom: 10,
          fontSize: 12.5,
          fontWeight: 700,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {status.icon}
          <span>
            {isUrgent
              ? `Riego atrasado (${Math.abs(prediction.daysUntilNextWatering)}d)`
              : isWaterDue
              ? 'Toca regar hoy según ML'
              : `Próximo riego en ~${prediction.daysUntilNextWatering} días`}
          </span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>
          Ciclo: {prediction.predictedWaterIntervalDays}d
        </span>
      </div>

      {/* Métricas rápidas */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#FAFDFB',
          borderRadius: 10,
          padding: '8px 10px',
          border: '1px solid #EDF2EE',
          marginBottom: 10,
          fontSize: 11.5,
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Salud ML</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <div style={{ flex: 1, height: 5, backgroundColor: '#E2ECE6', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${prediction.healthIndexEstimate}%`,
                  backgroundColor: prediction.healthIndexEstimate > 75 ? 'var(--color-success)' : 'var(--color-amber)',
                }}
              />
            </div>
            <strong style={{ fontSize: 11 }}>{prediction.healthIndexEstimate}%</strong>
          </div>
        </div>

        <div style={{ flex: 1, paddingLeft: 10, borderLeft: '1px solid #EEF4F0' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>Sustrato</div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-secondary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {SUBSTRATE_RETENTION_FACTOR[orchid.substrate]?.label}
          </div>
        </div>

        <div style={{ flex: 1, paddingLeft: 10, borderLeft: '1px solid #EEF4F0' }}>
          <div style={{ color: 'var(--color-text-muted)', fontSize: 10, textTransform: 'uppercase', fontWeight: 600 }}>IA Local</div>
          <div style={{ fontWeight: 600, color: 'var(--color-orchid-deep)', marginTop: 2 }}>
            {prediction.personalWeightPct}% personal
          </div>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => onOpenDetail(orchid)}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 10,
            border: '1px solid var(--color-primary)',
            backgroundColor: 'transparent',
            color: 'var(--color-primary)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span>Ver Tips & ML</span>
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => onQuickLog(orchid)}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 10,
            border: 'none',
            backgroundColor: 'var(--color-primary)',
            color: '#FFF',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <PlusCircle size={14} />
          <span>Registrar Riego</span>
        </button>
      </div>
    </div>
  );
};

