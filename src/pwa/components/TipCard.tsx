import React, { useState } from 'react';
import { Microscope, Brain, ChevronDown, ChevronUp, Check, Clock, AlertTriangle } from 'lucide-react';
import { AdaptiveTip, TipFeedbackValue } from '../../types/orchid';

interface Props {
  tip: AdaptiveTip;
  onFeedback: (tipKey: string, feedback: TipFeedbackValue) => void;
}

export const TipCard: React.FC<Props> = ({ tip, onFeedback }) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<TipFeedbackValue | null>(null);

  const handleFeedback = (val: TipFeedbackValue) => {
    setSubmittedFeedback(val);
    onFeedback(tip.tipKey, val);
  };

  const getPriorityBadgeClass = () => {
    if (tip.priority === 'urgente') return 'badge badge-danger';
    if (tip.priority === 'alta') return 'badge badge-amber';
    return 'badge badge-primary';
  };

  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span className={`badge ${tip.category === 'floracion' ? 'badge-orchid' : tip.category === 'riego' ? 'badge-water' : 'badge-primary'}`}>
            {tip.category.toUpperCase()}
          </span>
          {tip.priority !== 'normal' && (
            <span className={getPriorityBadgeClass()}>
              {tip.priority.toUpperCase()}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
          {tip.confidencePct}% conf.
        </span>
      </div>

      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', marginBottom: 6 }}>
        {tip.title}
      </div>

      <div style={{ fontSize: 13, lineHeight: '19px', color: 'var(--color-text)', marginBottom: 10 }}>
        {tip.recommendation}
      </div>

      {/* Razón científica */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          backgroundColor: '#F3F8F5',
          padding: '8px 10px',
          borderRadius: 10,
          marginBottom: 10,
          fontSize: 12,
          fontStyle: 'italic',
          color: 'var(--color-primary-dark)',
          lineHeight: '17px',
        }}
      >
        <Microscope size={16} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{tip.scientificReason}</span>
      </div>

      {/* Explicabilidad de Machine Learning */}
      <button
        onClick={() => setShowExplanation(!showExplanation)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          color: 'var(--color-orchid)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Brain size={15} />
          {showExplanation ? 'Ocultar lógica del modelo' : '¿Por qué la IA da este tip?'}
        </span>
        {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showExplanation && (
        <div
          style={{
            backgroundColor: '#FAF5FB',
            borderRadius: 10,
            padding: 10,
            marginTop: 6,
            marginBottom: 10,
            borderLeft: '3px solid var(--color-orchid)',
            fontSize: 12,
            color: 'var(--color-orchid-deep)',
            lineHeight: '18px',
          }}
        >
          <div>{tip.mlExplanation}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: '1px solid #EED9EE', fontSize: 11 }}>
            <span>Peso de tus datos locales:</span>
            <strong>{tip.personalDataWeightPct}%</strong>
          </div>
        </div>
      )}

      {/* Calibración interactiva */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-divider)' }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
          Califica para calibrar la IA en tu teléfono:
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => handleFeedback('helpful')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 8,
              border: '1px solid #DFE7E2',
              backgroundColor: submittedFeedback === 'helpful' ? 'var(--color-primary-light)' : '#F5F7F6',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Check size={13} color="var(--color-primary)" />
            <span>Exacto</span>
          </button>

          <button
            onClick={() => handleFeedback('too_early')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 8,
              border: '1px solid #DFE7E2',
              backgroundColor: submittedFeedback === 'too_early' ? 'var(--color-primary-light)' : '#F5F7F6',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <Clock size={13} color="var(--color-amber)" />
            <span>Muy pronto</span>
          </button>

          <button
            onClick={() => handleFeedback('too_late')}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 8,
              border: '1px solid #DFE7E2',
              backgroundColor: submittedFeedback === 'too_late' ? 'var(--color-primary-light)' : '#F5F7F6',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <AlertTriangle size={13} color="var(--color-danger)" />
            <span>Muy tarde</span>
          </button>
        </div>
        {submittedFeedback && (
          <div style={{ fontSize: 11, color: 'var(--color-primary-dark)', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>
            ✨ ¡Guardado en IndexedDB! El modelo reajustó los pesos.
          </div>
        )}
      </div>
    </div>
  );
};

