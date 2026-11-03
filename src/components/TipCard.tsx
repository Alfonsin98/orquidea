import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { AdaptiveTip, TipFeedbackValue } from '../types/orchid';
import { Badge } from './Badge';

interface TipCardProps {
  tip: AdaptiveTip;
  onFeedback: (tipKey: string, feedback: TipFeedbackValue) => void;
}

export function TipCard({ tip, onFeedback }: TipCardProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<TipFeedbackValue | null>(null);

  const handleFeedback = (val: TipFeedbackValue) => {
    setSubmittedFeedback(val);
    onFeedback(tip.tipKey, val);
  };

  const getPriorityVariant = (priority: AdaptiveTip['priority']) => {
    switch (priority) {
      case 'urgente':
        return 'danger';
      case 'alta':
        return 'amber';
      default:
        return 'primary';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <Badge
            label={tip.category.toUpperCase()}
            variant={tip.category === 'floracion' ? 'orchid' : tip.category === 'riego' ? 'water' : 'primary'}
          />
          {tip.priority !== 'normal' && (
            <Badge
              label={tip.priority === 'urgente' ? 'URGENTE' : 'PRIORIDAD'}
              variant={getPriorityVariant(tip.priority)}
              style={styles.priorityBadge}
            />
          )}
        </View>
        <View style={styles.confidenceBadge}>
          <Text style={styles.confidenceText}>{tip.confidencePct}% conf.</Text>
        </View>
      </View>

      <Text style={styles.title}>{tip.title}</Text>
      <Text style={styles.recommendation}>{tip.recommendation}</Text>

      {/* Razón científica botánica */}
      <View style={styles.scientificBox}>
        <MaterialCommunityIcons name="microscope" size={16} color={COLORS.primaryDark} style={styles.scIcon} />
        <Text style={styles.scientificText}>{tip.scientificReason}</Text>
      </View>

      {/* Explicabilidad de Machine Learning */}
      <TouchableOpacity
        style={styles.expandMLBtn}
        onPress={() => setShowExplanation(!showExplanation)}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="brain"
          size={16}
          color={COLORS.orchid}
          style={{ marginRight: 6 }}
        />
        <Text style={styles.expandMLText}>
          {showExplanation ? 'Ocultar lógica del modelo' : '¿Por qué la app te da este tip?'}
        </Text>
        <MaterialCommunityIcons
          name={showExplanation ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.orchid}
        />
      </TouchableOpacity>

      {showExplanation && (
        <View style={styles.mlBox}>
          <Text style={styles.mlText}>{tip.mlExplanation}</Text>
          <View style={styles.personalWeightRow}>
            <Text style={styles.personalWeightLabel}>Influencia de tus datos locales:</Text>
            <Text style={styles.personalWeightVal}>{tip.personalDataWeightPct}%</Text>
          </View>
        </View>
      )}

      {/* Barra de retroalimentación para alimentar la IA */}
      <View style={styles.feedbackSection}>
        <Text style={styles.feedbackTitle}>Califica este tip para calibrar la IA local:</Text>
        <View style={styles.feedbackBtnRow}>
          <TouchableOpacity
            style={[
              styles.fbBtn,
              submittedFeedback === 'helpful' && styles.fbBtnActive,
            ]}
            onPress={() => handleFeedback('helpful')}
          >
            <Text style={styles.fbBtnEmoji}>👍</Text>
            <Text style={styles.fbBtnText}>Exacto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fbBtn,
              submittedFeedback === 'too_early' && styles.fbBtnActive,
            ]}
            onPress={() => handleFeedback('too_early')}
          >
            <Text style={styles.fbBtnEmoji}>⏳</Text>
            <Text style={styles.fbBtnText}>Muy pronto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.fbBtn,
              submittedFeedback === 'too_late' && styles.fbBtnActive,
            ]}
            onPress={() => handleFeedback('too_late')}
          >
            <Text style={styles.fbBtnEmoji}>🍂</Text>
            <Text style={styles.fbBtnText}>Muy tarde</Text>
          </TouchableOpacity>
        </View>
        {submittedFeedback && (
          <Text style={styles.feedbackSavedNote}>
            ✨ ¡Guardado en SQLite! El modelo ajustará los pesos automáticamente.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E6ECE8',
    shadowColor: '#16241E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityBadge: {
    marginLeft: 6,
  },
  confidenceBadge: {
    backgroundColor: '#F0F5F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  recommendation: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
    marginBottom: 10,
  },
  scientificBox: {
    flexDirection: 'row',
    backgroundColor: '#F3F8F5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  scIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  scientificText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.primaryDark,
    fontStyle: 'italic',
  },
  expandMLBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  expandMLText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.orchid,
    flex: 1,
  },
  mlBox: {
    backgroundColor: '#FAF5FB',
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.orchid,
  },
  mlText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.orchidDeep,
    marginBottom: 6,
  },
  personalWeightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EED9EE',
    paddingTop: 6,
    marginTop: 4,
  },
  personalWeightLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  personalWeightVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.orchidDeep,
  },
  feedbackSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF2EF',
    paddingTop: 10,
  },
  feedbackTitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 8,
    fontWeight: '500',
  },
  feedbackBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fbBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F7F6',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E1E8E3',
  },
  fbBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  fbBtnEmoji: {
    fontSize: 13,
    marginRight: 4,
  },
  fbBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  feedbackSavedNote: {
    fontSize: 11,
    color: COLORS.primaryDark,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});

