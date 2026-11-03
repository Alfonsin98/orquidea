import React, { useState } from 'react';
import { Droplet, Sun, Moon, ThermometerSnowflake, Layers, Flower2 } from 'lucide-react';
import { ORCHID_CATALOG, SUBSTRATE_RETENTION_FACTOR } from '../../data/orchidCatalog';
import { OrchidGenus } from '../../types/orchid';

const GENERA_KEYS = Object.keys(ORCHID_CATALOG) as OrchidGenus[];

export const CatalogView: React.FC = () => {
  const [mode, setMode] = useState<'generos' | 'sustratos'>('generos');
  const [selectedGenus, setSelectedGenus] = useState<OrchidGenus>('Phalaenopsis');

  const profile = ORCHID_CATALOG[selectedGenus];

  return (
    <div>
      {/* Switch superior */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#E4EDE7',
          borderRadius: 12,
          padding: 3,
          marginBottom: 14,
        }}
      >
        <button
          onClick={() => setMode('generos')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: mode === 'generos' ? 'var(--color-primary)' : 'transparent',
            color: mode === 'generos' ? '#FFF' : 'var(--color-text-secondary)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Flower2 size={16} />
          <span>Géneros</span>
        </button>

        <button
          onClick={() => setMode('sustratos')}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '8px 0',
            borderRadius: 10,
            border: 'none',
            backgroundColor: mode === 'sustratos' ? 'var(--color-primary)' : 'transparent',
            color: mode === 'sustratos' ? '#FFF' : 'var(--color-text-secondary)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Layers size={16} />
          <span>Sustratos</span>
        </button>
      </div>

      {mode === 'generos' ? (
        <div>
          {/* Píldoras horizontales de géneros */}
          <div className="filters-container">
            {GENERA_KEYS.map((g) => {
              const isActive = selectedGenus === g;
              return (
                <button
                  key={g}
                  onClick={() => setSelectedGenus(g)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 18,
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: isActive ? 'var(--color-primary)' : '#FFF',
                    color: isActive ? '#FFF' : 'var(--color-text-secondary)',
                    fontSize: 12,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* Ficha técnica del género */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>{profile.genus}</h3>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontStyle: 'italic', marginTop: 2 }}>
                  {profile.commonName}
                </div>
              </div>
              <span className="badge badge-primary">{profile.growthHabit.toUpperCase()}</span>
            </div>

            {/* Cuadrícula de parámetros */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                backgroundColor: '#F3F8F5',
                borderRadius: 12,
                padding: 10,
                marginBottom: 14,
                textAlign: 'center',
              }}
            >
              <div style={{ padding: 6 }}>
                <Droplet size={18} color="var(--color-water)" style={{ margin: '0 auto 2px auto' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>~{profile.baseWaterDays} días</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Riego base</div>
              </div>

              <div style={{ padding: 6 }}>
                <Sun size={18} color="var(--color-amber)" style={{ margin: '0 auto 2px auto' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {profile.idealTempDayRangeC[0]}–{profile.idealTempDayRangeC[1]}°C
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Día ideal</div>
              </div>

              <div style={{ padding: 6 }}>
                <Moon size={18} color="var(--color-orchid)" style={{ margin: '0 auto 2px auto' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {profile.idealTempNightRangeC[0]}–{profile.idealTempNightRangeC[1]}°C
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Noche ideal</div>
              </div>

              <div style={{ padding: 6 }}>
                <ThermometerSnowflake size={18} color="var(--color-primary)" style={{ margin: '0 auto 2px auto' }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>≥ {profile.bloomDeltaTempC}°C</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>Salto térmico flor</div>
              </div>
            </div>

            {/* Diagnóstico de raíces */}
            <div style={{ marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid #EDF2EE' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
                🌿 Diagnóstico de Raíces y Velamen
              </div>
              <div style={{ fontSize: 12.5, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>
                {profile.velamenNote}
              </div>
            </div>

            {/* Estímulo de Floración */}
            <div style={{ marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #EDF2EE' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-orchid-deep)', marginBottom: 4 }}>
                🌸 Inducción de Floración
              </div>
              <div style={{ fontSize: 12.5, lineHeight: '18px', color: 'var(--color-text-secondary)' }}>
                {profile.bloomTriggerSummary}
              </div>
            </div>

            {/* Tips de cultivo */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
                Consejos Clave de Experto:
              </div>
              {profile.expertTips.map((tip, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12.5, lineHeight: '17px' }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {idx + 1}
                  </span>
                  <span style={{ color: 'var(--color-text)' }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: '18px', margin: '0 0 12px 0' }}>
            El sustrato es el factor #1 que determina cuántos días tarda en secar la maceta. El
            motor de Machine Learning aplica un factor de retención sobre cada riego registrado:
          </p>

          <div className="responsive-grid-3">
            {Object.entries(SUBSTRATE_RETENTION_FACTOR).map(([key, item]) => (
              <div key={key} className="card" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{item.label}</h4>
                  <span
                    className={`badge ${item.factor > 1.2 ? 'badge-water' : item.factor < 0.8 ? 'badge-amber' : 'badge-primary'}`}
                  >
                    Retención x{item.factor.toFixed(2)}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: '17px', marginBottom: 8 }}>
                  {item.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #EEF4F0', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Vida útil recomendada:</span>
                  <strong style={{ color: 'var(--color-primary-dark)' }}>{item.maxRecommendedMonths} meses</strong>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

