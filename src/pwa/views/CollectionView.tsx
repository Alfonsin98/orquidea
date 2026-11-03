import React, { useState } from 'react';
import { Search, Plus, Sparkles, X } from 'lucide-react';
import { Orchid, OrchidMLPrediction } from '../../types/orchid';
import { OrchidCard } from '../components/OrchidCard';

interface Props {
  items: { orchid: Orchid; prediction: OrchidMLPrediction }[];
  onOpenDetail: (orchid: Orchid) => void;
  onQuickLog: (orchid: Orchid) => void;
  onAddNewOrchid: () => void;
}

const GENUS_FILTERS = ['todos', 'Phalaenopsis', 'Cattleya', 'Dendrobium', 'Oncidium', 'Vanda'];

export const CollectionView: React.FC<Props> = ({
  items,
  onOpenDetail,
  onQuickLog,
  onAddNewOrchid,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGenus, setSelectedGenus] = useState('todos');

  const filteredItems = items.filter(({ orchid }) => {
    const matchGenus = selectedGenus === 'todos' || orchid.genus === selectedGenus;
    const q = search.toLowerCase().trim();
    const matchQuery =
      !q ||
      orchid.name.toLowerCase().includes(q) ||
      orchid.speciesOrHybrid.toLowerCase().includes(q) ||
      orchid.locationName.toLowerCase().includes(q);
    return matchGenus && matchQuery;
  });

  return (
    <div>
      {/* Barra de búsqueda */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#FFF',
          borderRadius: 14,
          padding: '8px 12px',
          border: '1px solid var(--color-border)',
          marginBottom: 10,
          gap: 8,
        }}
      >
        <Search size={18} color="var(--color-text-muted)" />
        <input
          type="text"
          placeholder="Buscar por nombre, especie o ubicación..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            border: 'none',
            background: 'none',
            outline: 'none',
            width: '100%',
            fontSize: 13,
            color: 'var(--color-text)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
          >
            <X size={16} color="var(--color-text-muted)" />
          </button>
        )}
      </div>

      {/* Píldoras de filtro */}
      <div className="filters-container">
        {GENUS_FILTERS.map((g) => {
          const isActive = selectedGenus === g;
          return (
            <button
              key={g}
              onClick={() => setSelectedGenus(g)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
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
              {g === 'todos' ? 'Todas' : g}
            </button>
          );
        })}
      </div>

      {/* Lista de tarjetas en rejilla responsiva */}
      {filteredItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <Sparkles size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px auto' }} />
          <h4 style={{ margin: '0 0 6px 0', fontSize: 16 }}>No se encontraron orquídeas</h4>
          <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {search ? 'Prueba con otro término de búsqueda.' : 'Agrega tu primera orquídea para que la IA comience a aprender.'}
          </p>
          <button
            className="btn-primary"
            onClick={onAddNewOrchid}
            style={{ width: 'auto', margin: '0 auto', padding: '10px 20px' }}
          >
            <Plus size={16} />
            <span>Agregar Orquídea</span>
          </button>
        </div>
      ) : (
        <div className="orchids-grid">
          {filteredItems.map(({ orchid, prediction }) => (
            <OrchidCard
              key={orchid.id}
              orchid={orchid}
              prediction={prediction}
              onOpenDetail={onOpenDetail}
              onQuickLog={onQuickLog}
            />
          ))}
        </div>
      )}

      {/* Botón flotante para móvil */}
      <button className="fab fab-mobile-only" onClick={onAddNewOrchid}>
        <Plus size={18} />
        <span>Nueva Planta</span>
      </button>
    </div>
  );
};

