import React from 'react';
import { Brain, Cpu, Flower } from 'lucide-react';
import { AdaptiveTip, GlobalMLCollectionStats, TipFeedbackValue } from '../../types/orchid';
import { MLAttributionBar } from '../components/MLAttributionBar';
import { TipCard } from '../components/TipCard';

interface Props {
  stats: GlobalMLCollectionStats;
  activeTips: AdaptiveTip[];
  onTipFeedback: (tipKey: string, feedback: TipFeedbackValue) => void;
}

export const MLInsightsView: React.FC<Props> = ({ stats, activeTips, onTipFeedback }) => {
  return (
    <div>
      {/* Rejilla de 2 columnas para Métricas y Explicabilidad en Tablet/Desktop */}
      <div className="responsive-grid-2" style={{ marginBottom: 14 }}>
        {/* Tarjeta de Madurez del Modelo */}
        <div className="card" style={{ backgroundColor: '#FAFDFB', borderColor: '#D4E6DC', margin: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '0.8px' }}>
                MOTOR COGNITIVO LOCAL
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--color-text)', marginTop: 2 }}>
                {stats.maturityLevel}
              </div>
            </div>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Brain size={24} color="var(--color-primary-dark)" />
            </div>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: '18px', margin: '0 0 14px 0' }}>
            {stats.maturityDescription}
          </p>

          {/* Medidores de Confianza y Personalización */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Confianza General</span>
                <strong style={{ color: 'var(--color-text)' }}>{stats.overallModelConfidencePct}%</strong>
              </div>
              <div style={{ height: 7, borderRadius: 4, backgroundColor: '#E5EDE7', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats.overallModelConfidencePct}%`,
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>Personalización en Teléfono</span>
                <strong style={{ color: 'var(--color-orchid-deep)' }}>{stats.personalizationRatioPct}%</strong>
              </div>
              <div style={{ height: 7, borderRadius: 4, backgroundColor: '#E5EDE7', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${stats.personalizationRatioPct}%`,
                    backgroundColor: 'var(--color-orchid)',
                    borderRadius: 4,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contadores SQLite / IndexedDB */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#F0F6F2',
              borderRadius: 12,
              padding: '10px 4px',
              textAlign: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-dark)' }}>{stats.totalOrchids}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>Plantas</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #DFE8E2' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-dark)' }}>{stats.totalLogs}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>Registros</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #DFE8E2' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-dark)' }}>{stats.totalPhotosAnalyzed}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>Fotos Visión</div>
            </div>
            <div style={{ flex: 1, borderLeft: '1px solid #DFE8E2' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-dark)' }}>{stats.totalFeedbackSignals}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>Feedbacks</div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Explicabilidad y Floración */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Explicabilidad de la IA */}
          <div className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Cpu size={19} color="var(--color-primary)" />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>¿Cómo aprende la IA en tu teléfono?</h4>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: '19px', margin: '0 0 10px 0' }}>
              La app combina <strong>priors botánicos de referencia</strong> con una{' '}
              <strong>regresión lineal adaptativa Bayesiana Ridge</strong> ejecutada en el chip de tu móvil:
            </p>
            <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12.5, color: 'var(--color-text)', lineHeight: '18px' }}>
              <li style={{ marginBottom: 6 }}>
                <strong>Cada riego registrado</strong> mide la velocidad real de secado según tu tipo de sustrato y humedad ambiental.
              </li>
              <li style={{ marginBottom: 6 }}>
                <strong>La cámara en el navegador</strong> segmenta el velamen (verde turgente vs plateado seco) y clorofila foliar con Canvas offscreen.
              </li>
              <li>
                <strong>Tus calificaciones ({'\u201C'}Exacto{'\u201D'}, {'\u201C'}Muy pronto{'\u201D'})</strong> reajustan la curva matemática para los avisos siguientes.
              </li>
            </ul>
          </div>

          {/* Floración */}
          <div className="card" style={{ margin: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Flower size={19} color="var(--color-orchid)" />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Optimización de Floración</h4>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              Factores con mayor impacto aprendido para inducir varas florales en tu colección:
            </div>
            <MLAttributionBar attributions={stats.bloomTriggerRankings} />
          </div>
        </div>
      </div>

      {/* Tips adaptativos del momento en rejilla responsiva */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tips Adaptativos del Momento</h4>
          <span className="badge badge-primary">{activeTips.length} activos</span>
        </div>

        {activeTips.length === 0 ? (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', padding: '20px 0' }}>
            No hay advertencias urgentes hoy. ¡Tus orquídeas están en óptimas condiciones!
          </p>
        ) : (
          <div className="responsive-tips-grid">
            {activeTips.map((tip) => (
              <TipCard key={tip.id} tip={tip} onFeedback={onTipFeedback} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

