import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { MLAttributionBar } from '../../components/MLAttributionBar';
import { TipCard } from '../../components/TipCard';
import {
  FERTILIZER_DOSE_LABELS,
  FERTILIZER_LABELS,
  GROWTH_STAGE_LABELS,
  LIGHT_LABELS,
  ROOT_CONDITION_LABELS,
  SUBSTRATE_RETENTION_FACTOR,
  VENTILATION_LABELS,
  WATERING_METHOD_LABELS,
} from '../../data/orchidCatalog';
import {
  deleteCareLog,
  deleteOrchid,
  getAllLogs,
  getAllTipFeedback,
  getLogsForOrchid,
  getOrchidById,
  recordTipFeedback,
} from '../../db/orchidDatabase';
import { predictOrchidNeeds } from '../../ml/adaptiveEngine';
import { COLORS } from '../../theme/colors';
import { CareLog, Orchid, OrchidMLPrediction, TipFeedbackValue } from '../../types/orchid';

type DetailTab = 'photos' | 'watering' | 'fertilizer' | 'ml';

export default function OrchidDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [orchid, setOrchid] = useState<Orchid | null>(null);
  const [logs, setLogs] = useState<CareLog[]>([]);
  const [prediction, setPrediction] = useState<OrchidMLPrediction | null>(null);
  const [loading, setLoading] = useState(true);

  // Pestañas y filtros
  const [activeTab, setActiveTab] = useState<DetailTab>('photos');
  const [photoFilter, setPhotoFilter] = useState<'all' | 'raices' | 'hojas'>('all');
  const [showComparison, setShowComparison] = useState(false);

  const loadDetails = useCallback(async () => {
    if (!id) return;
    try {
      const [foundOrchid, orchidLogs, allLogs, feedback] = await Promise.all([
        getOrchidById(id),
        getLogsForOrchid(id),
        getAllLogs(),
        getAllTipFeedback(),
      ]);

      if (foundOrchid) {
        setOrchid(foundOrchid);
        setLogs(orchidLogs);
        const pred = predictOrchidNeeds(foundOrchid, orchidLogs, allLogs, feedback);
        setPrediction(pred);
      }
    } catch (e) {
      console.error('Error cargando detalle:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [loadDetails])
  );

  const handleFeedback = async (tipKey: string, feedback: TipFeedbackValue) => {
    if (!orchid || !prediction) return;
    await recordTipFeedback(
      orchid.id,
      tipKey,
      tipKey.includes('water') ? 'riego' : 'floracion',
      feedback,
      prediction.predictedWaterIntervalDays
    );
    loadDetails();
  };

  const handleDeleteOrchid = () => {
    Alert.alert(
      'Eliminar Orquídea',
      `¿Estás seguro de eliminar a "${orchid?.name}"? Se borrará también su historial de bitácora en esta tablet.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (orchid) {
              await deleteOrchid(orchid.id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleDeleteLog = (logId: string) => {
    Alert.alert('Eliminar registro', '¿Deseas borrar esta entrada de la bitácora?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteCareLog(logId);
          loadDetails();
        },
      },
    ]);
  };

  if (loading || !orchid || !prediction) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando perfil adaptativo...</Text>
      </View>
    );
  }

  const isWaterDue = prediction.daysUntilNextWatering <= 0;
  const isUrgent = prediction.daysUntilNextWatering <= -2;

  // Filtrado de fotos ordenadas cronológicamente
  const logsWithPhotos = logs
    .filter((l) => Boolean(l.photoUri))
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  const filteredPhotos = logsWithPhotos.filter((l) => {
    if (photoFilter === 'all') return true;
    if (photoFilter === 'raices') return l.photoTargetPart === 'raices' || l.photoMetrics?.targetPart === 'raices';
    if (photoFilter === 'hojas') return l.photoTargetPart === 'hojas' || l.photoMetrics?.targetPart === 'hojas' || l.photoTargetPart === 'planta_completa';
    return true;
  });

  const earliestPhotoLog = logsWithPhotos.length > 1 ? logsWithPhotos[logsWithPhotos.length - 1] : null;
  const latestPhotoLog = logsWithPhotos.length > 0 ? logsWithPhotos[0] : null;

  // Filtrado de riegos y atomización
  const wateringLogs = logs
    .filter((l) => l.watered || l.misted || l.wateringMethod !== 'ninguno')
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  // Filtrado de fertilización
  const fertilizerLogs = logs
    .filter((l) => l.fertilized)
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, isTablet && { maxWidth: 960, alignSelf: 'center', width: '100%' }]}>
        {/* Encabezado con Foto y Datos Principales */}
        <View style={styles.headerHero}>
          {orchid.coverPhotoUri ? (
            <Image source={{ uri: orchid.coverPhotoUri }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <MaterialCommunityIcons name="flower-tulip" size={48} color={COLORS.primary} />
            </View>
          )}

          <View style={styles.heroDetails}>
            <Text style={styles.nameTitle}>{orchid.name}</Text>
            <Text style={styles.speciesSubtitle}>
              {orchid.speciesOrHybrid || orchid.genus} • {orchid.locationName}
            </Text>
            <View style={styles.pillRow}>
              <Badge label={orchid.genus} variant="orchid" style={styles.pill} />
              <Badge
                label={GROWTH_STAGE_LABELS[orchid.currentStage] || orchid.currentStage}
                variant="primary"
                style={styles.pill}
              />
            </View>
          </View>
        </View>

        {/* Botones de acción principales */}
        <View style={styles.topActionsRow}>
          <TouchableOpacity
            style={styles.addLogBtn}
            onPress={() => router.push(`/log/new?orchidId=${orchid.id}` as any)}
          >
            <MaterialCommunityIcons name="plus-circle" size={18} color="#FFF" />
            <Text style={styles.addLogBtnText}>+ Registrar Riego / Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/orchid/new?id=${orchid.id}` as any)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteOrchid}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* Selector de Pestañas */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'photos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('photos')}
          >
            <MaterialCommunityIcons
              name="camera-iris"
              size={18}
              color={activeTab === 'photos' ? COLORS.primaryDark : COLORS.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'photos' && styles.tabBtnTextActive]}>
              Fotos ({logsWithPhotos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'watering' && styles.tabBtnActive]}
            onPress={() => setActiveTab('watering')}
          >
            <MaterialCommunityIcons
              name="water"
              size={18}
              color={activeTab === 'watering' ? COLORS.water : COLORS.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'watering' && { color: COLORS.water, fontWeight: '700' }]}>
              Riego ({wateringLogs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'fertilizer' && styles.tabBtnActive]}
            onPress={() => setActiveTab('fertilizer')}
          >
            <MaterialCommunityIcons
              name="flask"
              size={18}
              color={activeTab === 'fertilizer' ? COLORS.orchid : COLORS.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'fertilizer' && { color: COLORS.orchid, fontWeight: '700' }]}>
              Abono ({fertilizerLogs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'ml' && styles.tabBtnActive]}
            onPress={() => setActiveTab('ml')}
          >
            <MaterialCommunityIcons
              name="brain"
              size={18}
              color={activeTab === 'ml' ? COLORS.primaryDark : COLORS.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'ml' && styles.tabBtnTextActive]}>
              IA & Tips
            </Text>
          </TouchableOpacity>
        </View>

        {/* PESTAÑA 1: FOTOS & RAÍCES */}
        {activeTab === 'photos' && (
          <View>
            <View style={styles.filterRow}>
              <View style={styles.filterGroup}>
                <TouchableOpacity
                  style={[styles.filterChip, photoFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setPhotoFilter('all')}
                >
                  <Text style={[styles.filterChipText, photoFilter === 'all' && styles.filterChipTextActive]}>
                    Todas ({logsWithPhotos.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, photoFilter === 'raices' && styles.filterChipActive]}
                  onPress={() => setPhotoFilter('raices')}
                >
                  <Text style={[styles.filterChipText, photoFilter === 'raices' && styles.filterChipTextActive]}>
                    🌱 Raíces
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterChip, photoFilter === 'hojas' && styles.filterChipActive]}
                  onPress={() => setPhotoFilter('hojas')}
                >
                  <Text style={[styles.filterChipText, photoFilter === 'hojas' && styles.filterChipTextActive]}>
                    🌿 Hojas
                  </Text>
                </TouchableOpacity>
              </View>

              {logsWithPhotos.length >= 2 && (
                <TouchableOpacity
                  style={[styles.compareBtn, showComparison && styles.compareBtnActive]}
                  onPress={() => setShowComparison(!showComparison)}
                >
                  <MaterialCommunityIcons name="compare" size={16} color={COLORS.primaryDark} />
                  <Text style={styles.compareBtnText}>
                    {showComparison ? 'Ocultar Comparativa' : 'Comparar Crecimiento'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Vista Comparativa Antes vs Ahora */}
            {showComparison && earliestPhotoLog && latestPhotoLog && (
              <Card style={styles.comparisonCard}>
                <Text style={styles.comparisonHeading}>Evolución de Crecimiento Botánico</Text>
                <View style={styles.comparisonRow}>
                  <View style={styles.comparisonCol}>
                    <Text style={styles.comparisonColTitle}>
                      PRIMER REGISTRO: {new Date(earliestPhotoLog.recordedAt).toLocaleDateString()}
                    </Text>
                    <Image source={{ uri: earliestPhotoLog.photoUri! }} style={styles.comparisonImg} />
                  </View>
                  <View style={styles.comparisonCol}>
                    <Text style={[styles.comparisonColTitle, { color: COLORS.primaryDark }]}>
                      ACTUAL: {new Date(latestPhotoLog.recordedAt).toLocaleDateString()}
                    </Text>
                    <Image source={{ uri: latestPhotoLog.photoUri! }} style={styles.comparisonImg} />
                  </View>
                </View>
              </Card>
            )}

            {filteredPhotos.length === 0 ? (
              <Card style={styles.emptyLogsCard}>
                <MaterialCommunityIcons name="camera-plus" size={40} color={COLORS.textMuted} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Text style={styles.emptyLogsText}>
                  Aún no hay fotos registradas para este filtro. Toma fotos periódicas de las raíces y hojas para ver su evolución.
                </Text>
              </Card>
            ) : (
              <View style={[styles.photoGrid, isTablet && { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }]}>
                {filteredPhotos.map((log) => {
                  const isRoot = log.photoTargetPart === 'raices' || log.photoMetrics?.targetPart === 'raices';
                  const logDate = new Date(log.recordedAt);

                  return (
                    <Card key={log.id} style={[styles.photoCard, isTablet && { width: '48%', marginVertical: 0 }]}>
                      <View style={styles.logCardHeader}>
                        <View style={styles.logDateRow}>
                          <MaterialCommunityIcons name="calendar" size={15} color={COLORS.primary} style={{ marginRight: 4 }} />
                          <Text style={styles.logDate}>{logDate.toLocaleDateString()}</Text>
                        </View>
                        <Badge
                          label={isRoot ? '🌱 Raíces & Velamen' : '🌿 Crecimiento Follaje'}
                          variant={isRoot ? 'primary' : 'orchid'}
                        />
                      </View>

                      <Image source={{ uri: log.photoUri! }} style={styles.galleryImage} />

                      {log.photoMetrics && (
                        <View style={styles.visionScoreBox}>
                          <Text style={styles.visionSummaryText}>{log.photoMetrics.summary}</Text>
                          <View style={styles.scoresRow}>
                            <Badge label={`Vigor: ${log.photoMetrics.greenVigorScore}%`} variant="primary" style={{ marginRight: 6 }} />
                            <Badge label={`Velamen: ${log.photoMetrics.velamenHydrationScore}%`} variant="water" />
                          </View>
                        </View>
                      )}

                      {log.notes.length > 0 && (
                        <Text style={styles.photoNotes}>“{log.notes}”</Text>
                      )}

                      <View style={styles.photoCardFooter}>
                        <TouchableOpacity onPress={() => handleDeleteLog(log.id)} style={styles.deletePhotoBtn}>
                          <MaterialCommunityIcons name="trash-can-outline" size={14} color={COLORS.danger} />
                          <Text style={styles.deletePhotoText}>Eliminar foto</Text>
                        </TouchableOpacity>
                      </View>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* PESTAÑA 2: RIEGO & ATOMIZACIÓN */}
        {activeTab === 'watering' && (
          <View>
            {/* Estado del ciclo de riego actual */}
            <Card style={isUrgent ? styles.cardUrgent : isWaterDue ? styles.cardDue : styles.cardNormal}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderTitleRow}>
                  <MaterialCommunityIcons
                    name="water-outline"
                    size={22}
                    color={isUrgent ? COLORS.danger : isWaterDue ? COLORS.amber : COLORS.primary}
                  />
                  <Text style={styles.sectionCardTitle}>Ciclo de Riego Adaptativo</Text>
                </View>
                <Badge label={`${prediction.personalWeightPct}% personal.`} variant="orchid" />
              </View>

              <View style={styles.cycleInfoBox}>
                <Text style={styles.cycleMainMsg}>
                  {isUrgent
                    ? `¡Riego atrasado ${Math.abs(prediction.daysUntilNextWatering)} días!`
                    : isWaterDue
                    ? '¡Turno de regar hoy según ML!'
                    : `Próximo riego en ~${prediction.daysUntilNextWatering} días`}
                </Text>
                <Text style={styles.cycleDetailText}>
                  Intervalo proyectado: {prediction.predictedWaterIntervalDays} días (prior del género: {prediction.botanicalPriorWaterDays}d)
                </Text>
              </View>
            </Card>

            <Text style={styles.sectionHeading}>HISTORIAL DE RIEGOS Y ATOMIZACIONES ({wateringLogs.length})</Text>
            {wateringLogs.length === 0 ? (
              <Card style={styles.emptyLogsCard}>
                <Text style={styles.emptyLogsText}>No hay riegos ni atomizaciones registradas todavía.</Text>
              </Card>
            ) : (
              wateringLogs.map((log) => (
                <Card key={log.id} style={styles.logCard}>
                  <View style={styles.logCardHeader}>
                    <View style={styles.logDateRow}>
                      <Text style={styles.logDate}>{new Date(log.recordedAt).toLocaleDateString()}</Text>
                      {log.watered && <Badge label="💧 Regada" variant="water" style={{ marginLeft: 6 }} />}
                      {log.misted && <Badge label="💨 Atomizada" variant="primary" style={{ marginLeft: 6 }} />}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                      <MaterialCommunityIcons name="close" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.logDetailsRow}>
                    {log.watered && (
                      <Text style={styles.logDetailItem}>
                        Método: {WATERING_METHOD_LABELS[log.wateringMethod] || log.wateringMethod}
                      </Text>
                    )}
                    <Text style={styles.logDetailItem}>
                      Raíces: {ROOT_CONDITION_LABELS[log.rootCondition] || log.rootCondition}
                    </Text>
                  </View>

                  {log.notes.length > 0 && <Text style={styles.logNotesText}>“{log.notes}”</Text>}
                </Card>
              ))
            )}
          </View>
        )}

        {/* PESTAÑA 3: FERTILIZACIÓN */}
        {activeTab === 'fertilizer' && (
          <View>
            <Text style={styles.sectionHeading}>HISTORIAL DE FERTILIZACIÓN Y NUTRIENTES ({fertilizerLogs.length})</Text>
            {fertilizerLogs.length === 0 ? (
              <Card style={styles.emptyLogsCard}>
                <Text style={styles.emptyLogsText}>No hay aplicaciones de abono registradas aún.</Text>
              </Card>
            ) : (
              fertilizerLogs.map((log) => (
                <Card key={log.id} style={styles.logCard}>
                  <View style={styles.logCardHeader}>
                    <View style={styles.logDateRow}>
                      <Text style={styles.logDate}>{new Date(log.recordedAt).toLocaleDateString()}</Text>
                      <Badge label="🧪 Fertilizada" variant="orchid" style={{ marginLeft: 6 }} />
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteLog(log.id)}>
                      <MaterialCommunityIcons name="close" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.logDetailsRow}>
                    <Text style={styles.logDetailItem}>
                      Fórmula: {FERTILIZER_LABELS[log.fertilizerType] || log.fertilizerType}
                    </Text>
                    <Text style={styles.logDetailItem}>
                      Dosis: {FERTILIZER_DOSE_LABELS[log.fertilizerDose] || log.fertilizerDose}
                    </Text>
                  </View>

                  {log.notes.length > 0 && <Text style={styles.logNotesText}>“{log.notes}”</Text>}
                </Card>
              ))
            )}
          </View>
        )}

        {/* PESTAÑA 4: INTELIGENCIA ARTIFICIAL & FICHA DE CULTIVO */}
        {activeTab === 'ml' && (
          <View>
            {/* Riesgos Detectados */}
            {prediction.risks.length > 0 && (
              <Card style={styles.riskCard}>
                <View style={styles.cardHeaderTitleRow}>
                  <MaterialCommunityIcons name="alert-decagram" size={20} color={COLORS.danger} />
                  <Text style={[styles.sectionCardTitle, { color: COLORS.danger }]}>
                    Riesgos Fisiológicos Detectados
                  </Text>
                </View>
                {prediction.risks.map((risk) => (
                  <View key={risk.riskId} style={styles.riskItem}>
                    <View style={styles.riskItemHeader}>
                      <Text style={styles.riskTitle}>{risk.title}</Text>
                      <Badge
                        label={`${Math.round(risk.probability * 100)}% prob.`}
                        variant={risk.severity === 'alto' ? 'danger' : 'amber'}
                      />
                    </View>
                    {risk.signals.map((sig, i) => (
                      <Text key={i} style={styles.riskSignalText}>• {sig}</Text>
                    ))}
                    <Text style={styles.riskActionText}>
                      💡 <Text style={{ fontWeight: '700' }}>Acción:</Text> {risk.correctiveAction}
                    </Text>
                  </View>
                ))}
              </Card>
            )}

            {/* Atribución de Variables de Riego */}
            <Card style={styles.card}>
              <Text style={styles.sectionCardTitle}>Factores que modificaron el ciclo de riego:</Text>
              <MLAttributionBar attributions={prediction.waterAttributions} />
            </Card>

            {/* Tips Adaptativos Calibrados */}
            <View style={styles.tipsSection}>
              <Text style={styles.sectionHeading}>TIPS DE MANEJO CALIBRADOS</Text>
              {prediction.tips.map((tip) => (
                <TipCard key={tip.id} tip={tip} onFeedback={handleFeedback} />
              ))}
            </View>

            {/* Ficha de Cultivo */}
            <Text style={styles.sectionHeading}>DATOS DE CULTIVO</Text>
            <Card style={styles.card}>
              <View style={styles.infoGridRow}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.gridLbl}>Sustrato</Text>
                  <Text style={styles.gridVal}>
                    {SUBSTRATE_RETENTION_FACTOR[orchid.substrate]?.label || orchid.substrate}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.gridLbl}>Maceta</Text>
                  <Text style={styles.gridVal}>
                    {orchid.potSizeCm} cm ({orchid.potTransparent ? 'Transparente' : 'Opaca'})
                  </Text>
                </View>
              </View>

              <View style={styles.infoGridRow}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.gridLbl}>Iluminación</Text>
                  <Text style={styles.gridVal}>
                    {LIGHT_LABELS[orchid.defaultLight]?.label || orchid.defaultLight}
                  </Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.gridLbl}>Ventilación</Text>
                  <Text style={styles.gridVal}>
                    {VENTILATION_LABELS[orchid.defaultVentilation]?.label || orchid.defaultVentilation}
                  </Text>
                </View>
              </View>

              <View style={styles.infoGridRow}>
                <View style={styles.infoGridItem}>
                  <Text style={styles.gridLbl}>Ubicación</Text>
                  <Text style={styles.gridVal}>{orchid.locationName}</Text>
                </View>
                <View style={styles.infoGridItem}>
                  <Text style={styles.gridLbl}>Microclima Base</Text>
                  <Text style={styles.gridVal}>
                    {orchid.baselineTempDayC}° / {orchid.baselineTempNightC}°C • {orchid.baselineHumidityPct}%
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  content: {
    padding: 16,
    paddingBottom: 50,
  },
  headerHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  heroImage: {
    width: 76,
    height: 76,
    borderRadius: 16,
    marginRight: 14,
  },
  heroPlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroDetails: {
    flex: 1,
  },
  nameTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.text,
  },
  speciesSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    marginRight: 4,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  addLogBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addLogBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  editBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: '#F8D7D7',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#EDF4EF',
    padding: 4,
    borderRadius: 12,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFF',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  tabBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  compareBtnActive: {
    backgroundColor: COLORS.primaryLight,
  },
  compareBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  comparisonCard: {
    backgroundColor: '#FAFDFB',
    borderColor: '#C4E1D0',
    marginBottom: 14,
  },
  comparisonHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  comparisonCol: {
    flex: 1,
  },
  comparisonColTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  comparisonImg: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  photoGrid: {
    gap: 12,
  },
  photoCard: {
    marginBottom: 12,
    padding: 12,
  },
  galleryImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginVertical: 8,
    resizeMode: 'cover',
  },
  visionScoreBox: {
    padding: 8,
    backgroundColor: '#FAFDFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5EDE7',
    marginBottom: 6,
  },
  visionSummaryText: {
    fontSize: 11.5,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoresRow: {
    flexDirection: 'row',
  },
  photoNotes: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  photoCardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F0F5F2',
  },
  deletePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deletePhotoText: {
    fontSize: 11.5,
    color: COLORS.danger,
    fontWeight: '600',
  },
  card: {
    marginBottom: 14,
  },
  cardNormal: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 14,
  },
  cardDue: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.amber,
    marginBottom: 14,
  },
  cardUrgent: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  cycleInfoBox: {
    backgroundColor: '#F3F8F5',
    padding: 10,
    borderRadius: 10,
  },
  cycleMainMsg: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 2,
  },
  cycleDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyLogsCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyLogsText: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  logCard: {
    padding: 12,
    marginBottom: 10,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  logDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logDate: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  logDetailsRow: {
    marginTop: 4,
    gap: 2,
  },
  logDetailItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  logNotesText: {
    fontSize: 12,
    color: COLORS.text,
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: '#F8FAF9',
    padding: 6,
    borderRadius: 6,
  },
  riskCard: {
    backgroundColor: '#FDF7F7',
    borderColor: '#F8DCDC',
    marginBottom: 14,
  },
  riskItem: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F5E4E4',
  },
  riskItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  riskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
  },
  riskSignalText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  riskActionText: {
    fontSize: 11.5,
    color: COLORS.text,
    marginTop: 4,
  },
  tipsSection: {
    marginBottom: 8,
  },
  infoGridRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  infoGridItem: {
    flex: 1,
  },
  gridLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  gridVal: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.text,
  },
});
