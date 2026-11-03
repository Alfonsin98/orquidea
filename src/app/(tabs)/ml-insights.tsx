import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { MLAttributionBar } from '../../components/MLAttributionBar';
import { TipCard } from '../../components/TipCard';
import { getAllLogs, getAllOrchids, getAllTipFeedback, recordTipFeedback } from '../../db/orchidDatabase';
import { computeGlobalMLStats, predictOrchidNeeds } from '../../ml/adaptiveEngine';
import { COLORS } from '../../theme/colors';
import { AdaptiveTip, GlobalMLCollectionStats, TipFeedbackValue } from '../../types/orchid';

export default function MLInsightsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [stats, setStats] = useState<GlobalMLCollectionStats | null>(null);
  const [activeTips, setActiveTips] = useState<AdaptiveTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      const [orchids, logs, feedback] = await Promise.all([
        getAllOrchids(),
        getAllLogs(),
        getAllTipFeedback(),
      ]);

      const globalStats = computeGlobalMLStats(orchids, logs, feedback);
      setStats(globalStats);

      // Recopilar los mejores tips adaptativos de todas las orquídeas
      const tipsAcc: AdaptiveTip[] = [];
      for (const orchid of orchids) {
        const orchidLogs = logs.filter((l) => l.orchidId === orchid.id);
        const prediction = predictOrchidNeeds(orchid, orchidLogs, logs, feedback);
        tipsAcc.push(...prediction.tips);
      }

      // Ordenar por prioridad (urgentes primero)
      tipsAcc.sort((a, b) => {
        const pMap = { urgente: 3, alta: 2, normal: 1 };
        return pMap[b.priority] - pMap[a.priority];
      });

      setActiveTips(tipsAcc.slice(0, 10)); // Top 10 tips
    } catch (e) {
      console.error('Error cargando estadísticas ML:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadInsights();
    }, [loadInsights])
  );

  const handleFeedback = async (tipKey: string, feedback: TipFeedbackValue) => {
    // Localizar a qué orquídea corresponde
    const tip = activeTips.find((t) => t.tipKey === tipKey);
    if (tip) {
      await recordTipFeedback(tip.orchidId, tipKey, tip.category, feedback, 7.0);
      loadInsights();
    }
  };

  if (loading || !stats) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analizando modelos de Machine Learning local...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isTablet && { maxWidth: 960, alignSelf: 'center', width: '100%' }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadInsights();
          }}
          colors={[COLORS.primary]}
        />
      }
    >
      {/* Tarjeta de Madurez del Modelo */}
      <Card style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroSubtitle}>ESTADO DEL MOTOR COGNITIVO</Text>
            <Text style={styles.heroTitle}>{stats.maturityLevel}</Text>
          </View>
          <View style={styles.badgeCircle}>
            <MaterialCommunityIcons name="brain" size={28} color={COLORS.primary} />
          </View>
        </View>

        <Text style={styles.maturityDescription}>{stats.maturityDescription}</Text>

        {/* Barras de confianza y personalización */}
        <View style={styles.metricRow}>
          <View style={styles.metricBlock}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricName}>Confianza General</Text>
              <Text style={styles.metricVal}>{stats.overallModelConfidencePct}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  { width: `${stats.overallModelConfidencePct}%`, backgroundColor: COLORS.primary },
                ]}
              />
            </View>
          </View>

          <View style={styles.metricBlock}>
            <View style={styles.metricHeader}>
              <Text style={styles.metricName}>Personalización DB Local</Text>
              <Text style={styles.metricVal}>{stats.personalizationRatioPct}%</Text>
            </View>
            <View style={styles.meterTrack}>
              <View
                style={[
                  styles.meterFill,
                  { width: `${stats.personalizationRatioPct}%`, backgroundColor: COLORS.orchid },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Contadores SQLite */}
        <View style={styles.countersGrid}>
          <View style={styles.counterBox}>
            <Text style={styles.counterNumber}>{stats.totalOrchids}</Text>
            <Text style={styles.counterLabel}>Plantas</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterNumber}>{stats.totalLogs}</Text>
            <Text style={styles.counterLabel}>Registros</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterNumber}>{stats.totalPhotosAnalyzed}</Text>
            <Text style={styles.counterLabel}>Fotos Visión</Text>
          </View>
          <View style={styles.counterBox}>
            <Text style={styles.counterNumber}>{stats.totalFeedbackSignals}</Text>
            <Text style={styles.counterLabel}>Feedbacks</Text>
          </View>
        </View>
      </Card>

      {/* Explicabilidad: ¿Cómo aprende la app? */}
      <Card style={styles.infoCard}>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="cog-sync" size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>¿Cómo aprende la IA dentro de tu teléfono?</Text>
        </View>
        <Text style={styles.infoParagraph}>
          A diferencia de apps comunes con calendarios fijos, OrquiML combina{' '}
          <Text style={{ fontWeight: '700' }}>priors botánicos científicos</Text> con una{' '}
          <Text style={{ fontWeight: '700' }}>regresión adaptativa Bayesiana en SQLite</Text>.
        </Text>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: '600' }}>Cada riego registrado</Text> enseña la velocidad real de secado según tu tipo de maceta y microclima.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: '600' }}>La cámara en el teléfono</Text> segmenta el tono del velamen (verde hidratado vs plateado seco) y clorofila foliar sin subir fotos a internet.
          </Text>
        </View>
        <View style={styles.bulletItem}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>
            <Text style={{ fontWeight: '600' }}>Tus calificaciones ({'\u201C'}Exacto{'\u201D'}, {'\u201C'}Muy pronto{'\u201D'})</Text> ajustan la función matemática para afinar los siguientes avisos.
          </Text>
        </View>
      </Card>

      {/* Factores Clave de Inducción Floral */}
      <Card>
        <View style={styles.sectionTitleRow}>
          <MaterialCommunityIcons name="flower-pollen" size={20} color={COLORS.orchid} />
          <Text style={styles.sectionTitle}>Optimización de Floración</Text>
        </View>
        <Text style={styles.subParagraph}>
          Variables con mayor correlación aprendida para inducir yemas florales en tu colección:
        </Text>
        <MLAttributionBar attributions={stats.bloomTriggerRankings} />
      </Card>

      {/* Tips Adaptativos Recomendados */}
      <View style={styles.tipsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>Tips Adaptativos del Momento</Text>
          <Badge label={`${activeTips.length} activos`} variant="primary" />
        </View>

        {activeTips.length === 0 ? (
          <Text style={styles.emptyTips}>
            No hay recomendaciones urgentes hoy. ¡Tus orquídeas están al día!
          </Text>
        ) : (
          activeTips.map((tip) => (
            <TipCard key={tip.id} tip={tip} onFeedback={handleFeedback} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  heroCard: {
    backgroundColor: '#FAFDFB',
    borderColor: '#D4E6DC',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  badgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maturityDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  metricRow: {
    marginBottom: 14,
  },
  metricBlock: {
    marginBottom: 10,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  metricName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  meterTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5EDE7',
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 4,
  },
  countersGrid: {
    flexDirection: 'row',
    backgroundColor: '#F0F6F2',
    borderRadius: 12,
    paddingVertical: 10,
  },
  counterBox: {
    flex: 1,
    alignItems: 'center',
  },
  counterNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  counterLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
  },
  infoParagraph: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginBottom: 8,
  },
  subParagraph: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 14,
    color: COLORS.primary,
    marginRight: 6,
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.text,
  },
  tipsSection: {
    marginTop: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyTips: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
