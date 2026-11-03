import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'orchid' | 'water' | 'amber' | 'danger' | 'success' | 'neutral';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Badge({
  label,
  variant = 'neutral',
  style,
  textStyle,
  icon,
}: BadgeProps) {
  const colorMap = {
    primary: { bg: COLORS.primaryLight, text: COLORS.primaryDark },
    orchid: { bg: COLORS.orchidLight, text: COLORS.orchidDeep },
    water: { bg: COLORS.waterLight, text: COLORS.water },
    amber: { bg: COLORS.amberLight, text: COLORS.amber },
    danger: { bg: COLORS.dangerLight, text: COLORS.danger },
    success: { bg: COLORS.successLight, text: COLORS.success },
    neutral: { bg: '#EAEFEA', text: COLORS.textSecondary },
  };

  const current = colorMap[variant] || colorMap.neutral;

  return (
    <View style={[styles.badge, { backgroundColor: current.bg }, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.text, { color: current.text }, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

