import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'flat' | 'outlined';
}

export function Card({ children, style, variant = 'elevated' }: CardProps) {
  return <View style={[styles.card, styles[variant], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    backgroundColor: COLORS.surface,
  },
  elevated: {
    shadowColor: '#16241E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EDF2EE',
  },
  flat: {
    backgroundColor: COLORS.surfaceAlt,
  },
  outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
});

