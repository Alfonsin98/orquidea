import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { FeatureAttribution } from '../types/orchid';

interface MLAttributionBarProps {
  attributions: FeatureAttribution[];
}

export function MLAttributionBar({ attributions }: MLAttributionBarProps) {
  return (
    <View style={styles.container}>
      {attributions.map((attr, idx) => {
        const isPositive = attr.impactScore >= 0;
        const absVal = Math.min(100, Math.round(Math.abs(attr.impactScore) * 100));
        return (
          <View key={`${attr.featureName}_${idx}`} style={styles.itemRow}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{attr.label}</Text>
              <Text style={styles.valueText}>{attr.humanValue}</Text>
            </View>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    width: `${absVal}%`,
                    backgroundColor: isPositive ? COLORS.primary : COLORS.amber,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  itemRow: {
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  valueText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5ECE8',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
});

