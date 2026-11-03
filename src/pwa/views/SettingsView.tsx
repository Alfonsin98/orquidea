import React, { useRef, useState } from 'react';
import { Download, Upload, RefreshCw, ShieldCheck, Share, Smartphone, Check } from 'lucide-react';
import { exportDatabaseBackup, importDatabaseBackup, resetToDemoData } from '../../db/indexedDb';

interface Props {
  onDataChanged: () => void;
  showToast: (msg: string) => void;
}

export const SettingsView: React.FC<Props> = ({ onDataChanged, showToast }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const filename = await exportDatabaseBackup();
      showToast(`¡Respaldo descargado: ${filename}!`);
    } catch (e: any) {
      alert(`Error al exportar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const res = await importDatabaseBackup(text);
      showToast(`¡Restauradas ${res.orchidsRestored} orquídeas y ${res.logsRestored} bitácoras!`);
      onDataChanged();
    } catch (e: any) {
      alert(`Error al importar respaldo: ${e.message}`);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleReset = async () => {
    if (confirm('¿Deseas reiniciar la base de datos con las orquídeas y bitácoras botánicas de demostración?')) {
      try {
        setLoading(true);
        await resetToDemoData();
        showToast('¡Datos de prueba restablecidos con éxito!');
        onDataChanged();
      } catch (e: any) {
        alert(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <div className="responsive-grid-2">
        {/* Columna 1: Respaldo JSON y Operaciones */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.8px', margin: '0 0 8px 4px' }}>
            RESPALDO Y BASE DE DATOS LOCAL
          </div>
          <div className="card">
            <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: '18px', margin: '0 0 12px 0' }}>
              Tus datos se guardan en el almacenamiento interno de tu teléfono (IndexedDB). Puedes
              descargar una copia de seguridad o transferirla entre dispositivos:
            </p>

            <button
              onClick={handleExport}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #EDF2EE',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Download size={20} color="var(--color-primary)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Exportar Respaldo (JSON)</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Descargar archivo con tu colección y fotos</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 0',
                background: 'none',
                border: 'none',
                borderBottom: '1px solid #EDF2EE',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Upload size={20} color="var(--color-orchid)" />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>Importar Respaldo (JSON)</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Restaurar archivo anterior</div>
                </div>
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 0 4px 0',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <RefreshCw size={18} color="var(--color-amber)" />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-amber)' }}>Restablecer Datos de Prueba</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Cargar orquídeas y bitácoras botánicas iniciales</div>
              </div>
            </button>
          </div>

          {/* Privacidad 100% Offline */}
          <div className="card" style={{ backgroundColor: '#FAFDFB', borderColor: '#D4E6DC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <ShieldCheck size={20} color="var(--color-success)" />
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Privacidad y Almacenamiento 100% Local
              </h4>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: '17px', margin: 0 }}>
              Todas tus fotos, bitácoras y cálculos de inteligencia artificial corren dentro de tu propio
              dispositivo. No enviamos datos a servidores externos ni requieres cuentas para usar la app.
            </p>
          </div>
        </div>

        {/* Columna 2: Guía de Instalación Móvil */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.8px', margin: '0 0 8px 4px' }}>
            ACCESO COMO APLICACIÓN NATIVA
          </div>
          <div className="card" style={{ backgroundColor: '#FAFDFB', borderColor: '#D4E6DC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Smartphone size={20} color="var(--color-primary)" />
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                Cómo instalar como App en tu iPhone / Android
              </h4>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--color-text-secondary)', lineHeight: '18px', margin: '0 0 10px 0' }}>
              Para tenerla en la pantalla de inicio de tu teléfono y que funcione sin internet ni PC:
            </p>
            <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: 'var(--color-text)', lineHeight: '22px' }}>
              <li>Abre esta página en <strong>Safari</strong> (iPhone) o <strong>Chrome</strong> (Android).</li>
              <li>En iPhone toca el botón <strong>Compartir</strong> (icono <Share size={12} style={{ display: 'inline' }} />). En Android toca los tres puntos (⋮).</li>
              <li>Selecciona <strong>{'\u201C'}Agregar a pantalla de inicio{'\u201D'}</strong>.</li>
              <li>Toca <strong>{'\u201C'}Agregar{'\u201D'}</strong> arriba a la derecha.</li>
            </ol>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11.5, color: 'var(--color-primary-dark)', fontWeight: 600 }}>
              <Check size={14} />
              <span>¡Quedará instalada como app nativa a pantalla completa y 100% offline!</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 24 }}>
        OrquiML PWA Offline • Motor Bayesiano Ridge & Canvas Vision Local
      </div>
    </div>
  );
};

