import React from 'react';
import { FeatureAttribution } from '../../types/orchid';

interface Props {
  attributions: FeatureAttribution[];
}

export const MLAttributionBar: React.FC<Props> = ({ attributions }) => {
  return (
    <div style={{ margin: '8px 0' }}>
      {attributions.map((attr, idx) => {
        const isPositive = attr.impactScore >= 0;
        const absVal = Math.min(100, Math.round(Math.abs(attr.impactScore) * 100));
        return (
          <div key={`${attr.featureName}_${idx}`} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{attr.label}</span>
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>{attr.humanValue}</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: '#E2ECE5', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${absVal}%`,
                  backgroundColor: isPositive ? 'var(--color-primary)' : 'var(--color-amber)',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

