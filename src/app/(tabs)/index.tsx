import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import { GROWTH_STAGE_LABELS, SUBSTRATE_RETENTION_FACTOR } from '../../data/orchidCatalog';
import { getAllLogs, getAllOrchids, getAllTipFeedback } from '../../db/orchidDatabase';
import { predictOrchidNeeds } from '../../ml/adaptiveEngine';
import { scheduleOrchidWaterReminder } from '../../services/notificationService';
import { COLORS } from '../../theme/colors';
import { Orchid, OrchidMLPrediction } from '../../types/orchid';

interface OrchidItemWithML {
  orchid: Orchid;
  prediction: OrchidMLPrediction;
}

export default function OrchidCollectionScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 1024 ? 3 : width >= 600 ? 2 : 1;

  const [items, setItems] = useState<OrchidItemWithML[]>([]);
  const [filteredItems, setFilteredItems] = useState<OrchidItemWithML[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGenus, setSelectedGenus] = useState<string>('todos');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filterList = (sourceList: OrchidItemWithML[], searchText: string, genus: string) => {
    let filtered = sourceList;
    if (genus !== 'todos') {
      filtered = filtered.filter((i) => i.orchid.genus === genus);
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.orchid.name.toLowerCase().includes(q) ||
          i.orchid.speciesOrHybrid.toLowerCase().includes(q) ||
          i.orchid.locationName.toLowerCase().includes(q)
      );
    }
    setFilteredItems(filtered);
  };

  const loadData = useCallback(async () => {
    try {
      const [orchids, logs, feedback] = await Promise.all([
        getAllOrchids(),
        getAllLogs(),
        getAllTipFeedback(),
      ]);

      const calculated: OrchidItemWithML[] = orchids.map((orchid) => {
        const orchidLogs = logs.filter((l) => l.orchidId === orchid.id);
        const prediction = predictOrchidNeeds(orchid, orchidLogs, logs, feedback);
        // Programar recordatorio local en segundo plano
        scheduleOrchidWaterReminder(orchid, prediction).catch(() => {});
        return { orchid, prediction };
      });

      // Ordenar: primero las que requieren atención o riego inmediato
      calculated.sort(
        (a, b) => a.prediction.daysUntilNextWatering - b.prediction.daysUntilNextWatering
      );

      setItems(calculated);
      filterList(calculated, search, selectedGenus);
    } catch (e) {
      console.error('Error cargando orquídeas:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedGenus]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSearchChange = (text: string) => {
    setSearch(text);
    filterList(items, text, selectedGenus);
  };

  const handleGenusSelect = (genus: string) => {
    setSelectedGenus(genus);
    filterList(items, search, genus);
  };

  const genusFilterOptions = ['todos', 'Phalaenopsis', 'Cattleya', 'Dendrobium', 'Oncidium', 'Vanda'];

  const renderOrchidCard = ({ item }: { item: OrchidItemWithML }) => {
    const { orchid, prediction } = item;
    const isWaterDue = prediction.daysUntilNextWatering <= 0;
    const isUrgent = prediction.daysUntilNextWatering <= -2;

    return (
      <View style={[styles.cardWrapper, numColumns > 1 && { flex: 1 }]}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push(`/orchid/${orchid.id}` as any)}
        >
          <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              {orchid.coverPhotoUri ? (
                <Image source={{ uri: orchid.coverPhotoUri }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <MaterialCommunityIcons
                    name="flower-tulip"
                    size={30}
                    color={COLORS.primary}
                  />
                </View>
              )}
            </View>

            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.orchidName} numberOfLines={1}>
                  {orchid.name}
                </Text>
                {orchid.isDemo && (
                  <Badge label="DEMO" variant="neutral" style={styles.demoBadge} />
                )}
              </View>

              <Text style={styles.speciesText} numberOfLines={1}>
                {orchid.speciesOrHybrid || orchid.genus}
              </Text>

              <View style={styles.badgesRow}>
                <Badge
                  label={orchid.genus}
                  variant="orchid"
                  style={styles.pill}
                />
                <Badge
                  label={GROWTH_STAGE_LABELS[orchid.currentStage] || orchid.currentStage}
                  variant="primary"
                  style={styles.pill}
                />
              </View>
            </View>
          </View>

          {/* Estado de Riego y Machine Learning */}
          <View
            style={[
              styles.statusBanner,
              isUrgent
                ? styles.bannerUrgent
                : isWaterDue
                ? styles.bannerDue
                : styles.bannerGood,
            ]}
          >
            <View style={styles.statusBannerLeft}>
              <MaterialCommunityIcons
                name={isWaterDue ? 'water-alert' : 'water-check'}
                size={20}
                color={isUrgent ? COLORS.danger : isWaterDue ? COLORS.amber : COLORS.primaryDark}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.statusBannerText,
                  {
                    color: isUrgent
                      ? COLORS.danger
                      : isWaterDue
                      ? '#92400E'
                      : COLORS.primaryDark,
                  },
                ]}
              >
                {isUrgent
                  ? `Riego atrasado (${Math.abs(prediction.daysUntilNextWatering)}d)`
                  : isWaterDue
                  ? 'Toca regar hoy según ML'
                  : `Próximo riego en ~${prediction.daysUntilNextWatering} días`}
              </Text>
            </View>
            <Text style={styles.cycleBadgeText}>
              Ciclo: {prediction.predictedWaterIntervalDays}d
            </Text>
          </View>

          {/* Métricas rápidas: Salud y Microclima */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Índice Salud ML</Text>
              <View style={styles.healthScoreRow}>
                <View style={styles.healthBarTrack}>
                  <View
                    style={[
                      styles.healthBarFill,
                      {
                        width: `${prediction.healthIndexEstimate}%`,
                        backgroundColor:
                          prediction.healthIndexEstimate > 75
                            ? COLORS.success
                            : prediction.healthIndexEstimate > 50
                            ? COLORS.amber
                            : COLORS.danger,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{prediction.healthIndexEstimate}%</Text>
              </View>
            </View>

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Sustrato</Text>
              <Text style={styles.statSubText} numberOfLines={1}>
                {SUBSTRATE_RETENTION_FACTOR[orchid.substrate]?.label || orchid.substrate}
              </Text>
            </View>

            <View style={styles.statCol}>
              <Text style={styles.statLabel}>IA Local</Text>
              <Text style={styles.statSubText}>
                {prediction.personalWeightPct}% personal.
              </Text>
            </View>
          </View>

          {/* Botones de acción rápida */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionBtnOutline}
              onPress={() => router.push(`/orchid/${orchid.id}` as any)}
            >
              <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.primary} />
              <Text style={styles.actionBtnOutlineText}>Ver Tips & ML</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnSolid}
              onPress={() => router.push(`/log/new?orchidId=${orchid.id}` as any)}
            >
              <MaterialCommunityIcons name="clipboard-plus-outline" size={16} color="#FFF" />
              <Text style={styles.actionBtnSolidText}>Registrar Riego</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchRow}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={COLORS.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar orquídea por nombre, híbrido o ubicación..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={handleSearchChange}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Píldoras de filtro por género */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={genusFilterOptions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.genusFilterPill,
                selectedGenus === item && styles.genusFilterPillActive,
              ]}
              onPress={() => handleGenusSelect(item)}
            >
              <Text
                style={[
                  styles.genusFilterText,
                  selectedGenus === item && styles.genusFilterTextActive,
                ]}
              >
                {item === 'todos' ? 'Todas' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Lista de orquídeas */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingMsg}>Calculando modelos adaptativos...</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="flower-poppy" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No hay orquídeas en este filtro</Text>
          <Text style={styles.emptySub}>
            Agrega tu primera orquídea para que el modelo empiece a aprender de tus cuidados.
          </Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => router.push('/orchid/new' as any)}
          >
            <Text style={styles.emptyAddBtnText}>+ Agregar Orquídea</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={`grid_${numColumns}`}
          numColumns={numColumns}
          data={filteredItems}
          keyExtractor={(item) => item.orchid.id}
          renderItem={renderOrchidCard}
          contentContainerStyle={[styles.listContent, numColumns > 1 && { paddingHorizontal: 16 }]}
          columnWrapperStyle={numColumns > 1 ? { gap: 14 } : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              colors={[COLORS.primary]}
            />
          }
        />
      )}

      {/* Botón flotante para nueva orquídea */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/orchid/new' as any)}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
        <Text style={styles.fabText}>Nueva Planta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  filterScroll: {
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  genusFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 4,
  },
  genusFilterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genusFilterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  genusFilterTextActive: {
    color: '#FFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  cardWrapper: {
    marginBottom: 6,
  },
  card: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatarContainer: {
    marginRight: 12,
  },
  coverImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  coverPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orchidName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  demoBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  speciesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    marginTop: 6,
    flexWrap: 'wrap',
  },
  pill: {
    marginRight: 6,
    paddingVertical: 2,
  },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  statusBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  cycleBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bannerGood: {
    backgroundColor: COLORS.primaryLight,
  },
  bannerDue: {
    backgroundColor: COLORS.amberLight,
  },
  bannerUrgent: {
    backgroundColor: COLORS.dangerLight,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FAFDFB',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2EE',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 6,
  },
  statSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  healthScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  healthBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2ECE6',
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginRight: 6,
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 4,
  },
  actionBtnSolid: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    marginLeft: 6,
  },
  actionBtnSolidText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 4,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMsg: {
    marginTop: 12,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  fabText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 6,
  },
});
