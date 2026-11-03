import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import {
  ORCHID_CATALOG,
  SUBSTRATE_RETENTION_FACTOR,
} from '../../data/orchidCatalog';
import { COLORS } from '../../theme/colors';
import { OrchidGenus } from '../../types/orchid';

export default function CatalogScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const generaList = Object.keys(ORCHID_CATALOG) as OrchidGenus[];
  const [selectedGenusKey, setSelectedGenusKey] = useState<OrchidGenus>('Phalaenopsis');
  const [tabMode, setTabMode] = useState<'generos' | 'sustratos'>('generos');

  const currentProfile = ORCHID_CATALOG[selectedGenusKey];

  return (
    <View style={styles.container}>
      {/* Selector superior: Géneros vs Sustratos */}
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segBtn, tabMode === 'generos' && styles.segBtnActive]}
          onPress={() => setTabMode('generos')}
        >
          <MaterialCommunityIcons
            name="flower-tulip"
            size={16}
            color={tabMode === 'generos' ? '#FFF' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.segBtnText,
              tabMode === 'generos' && styles.segBtnTextActive,
            ]}
          >
            Catálogo por Género
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segBtn, tabMode === 'sustratos' && styles.segBtnActive]}
          onPress={() => setTabMode('sustratos')}
        >
          <MaterialCommunityIcons
            name="layers-triple"
            size={16}
            color={tabMode === 'sustratos' ? '#FFF' : COLORS.textSecondary}
          />
          <Text
            style={[
              styles.segBtnText,
              tabMode === 'sustratos' && styles.segBtnTextActive,
            ]}
          >
            Guía de Sustratos
          </Text>
        </TouchableOpacity>
      </View>

      {tabMode === 'generos' ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, isTablet && { maxWidth: 960, alignSelf: 'center', width: '100%' }]}
        >
          {/* Selector horizontal de géneros */}
          <View style={styles.genusSelectorContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={generaList}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isActive = item === selectedGenusKey;
                return (
                  <TouchableOpacity
                    style={[styles.genusPill, isActive && styles.genusPillActive]}
                    onPress={() => setSelectedGenusKey(item)}
                  >
                    <Text style={[styles.genusPillText, isActive && styles.genusPillTextActive]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Ficha técnica del género seleccionado */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View>
                <Text style={styles.genusTitle}>{currentProfile.genus}</Text>
                <Text style={styles.commonName}>{currentProfile.commonName}</Text>
              </View>
              <Badge
                label={currentProfile.growthHabit.toUpperCase()}
                variant="primary"
              />
            </View>

            {/* Parámetros clave en cuadrícula */}
            <View style={styles.specGrid}>
              <View style={styles.specBox}>
                <MaterialCommunityIcons name="water" size={18} color={COLORS.water} />
                <Text style={styles.specVal}>~{currentProfile.baseWaterDays} días</Text>
                <Text style={styles.specLbl}>Riego base</Text>
              </View>

              <View style={styles.specBox}>
                <MaterialCommunityIcons name="weather-sunny" size={18} color={COLORS.amber} />
                <Text style={styles.specVal}>
                  {currentProfile.idealTempDayRangeC[0]}–{currentProfile.idealTempDayRangeC[1]}°C
                </Text>
                <Text style={styles.specLbl}>Día ideal</Text>
              </View>

              <View style={styles.specBox}>
                <MaterialCommunityIcons name="weather-night" size={18} color={COLORS.orchid} />
                <Text style={styles.specVal}>
                  {currentProfile.idealTempNightRangeC[0]}–{currentProfile.idealTempNightRangeC[1]}°C
                </Text>
                <Text style={styles.specLbl}>Noche ideal</Text>
              </View>

              <View style={styles.specBox}>
                <MaterialCommunityIcons name="thermometer-chevron-down" size={18} color={COLORS.primary} />
                <Text style={styles.specVal}>≥ {currentProfile.bloomDeltaTempC}°C</Text>
                <Text style={styles.specLbl}>Salto térmico flor</Text>
              </View>
            </View>

            {/* Raíces y Velamen */}
            <View style={styles.infoSection}>
              <View style={styles.infoTitleRow}>
                <MaterialCommunityIcons name="source-branch" size={18} color={COLORS.primary} />
                <Text style={styles.infoSectionTitle}>Diagnóstico de Raíces y Velamen</Text>
              </View>
              <Text style={styles.infoBodyText}>{currentProfile.velamenNote}</Text>
            </View>

            {/* Gatillo de Floración */}
            <View style={styles.infoSection}>
              <View style={styles.infoTitleRow}>
                <MaterialCommunityIcons name="flower-pollen" size={18} color={COLORS.orchid} />
                <Text style={styles.infoSectionTitle}>Cómo inducir la Floración</Text>
              </View>
              <Text style={styles.infoBodyText}>{currentProfile.bloomTriggerSummary}</Text>
            </View>

            {/* Consejos Botánicos de Experto */}
            <View style={styles.tipsSection}>
              <Text style={styles.tipsSectionTitle}>Consejos de Cultivo:</Text>
              {currentProfile.expertTips.map((tip, idx) => (
                <View key={idx} style={styles.expertTipRow}>
                  <Text style={styles.tipNumber}>{idx + 1}</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </Card>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, isTablet && { maxWidth: 960, alignSelf: 'center', width: '100%' }]}
        >
          <Text style={styles.substrateGuideIntro}>
            El sustrato es el factor #1 que determina cuántos días tarda en secar la maceta. El
            motor de Machine Learning aplica un factor de retención sobre cada riego registrado:
          </Text>

          {Object.entries(SUBSTRATE_RETENTION_FACTOR).map(([key, item]) => (
            <Card key={key} style={styles.substrateCard}>
              <View style={styles.substrateHeader}>
                <Text style={styles.substrateTitle}>{item.label}</Text>
                <Badge
                  label={`Retención x${item.factor.toFixed(2)}`}
                  variant={item.factor > 1.2 ? 'water' : item.factor < 0.8 ? 'amber' : 'primary'}
                />
              </View>
              <Text style={styles.substrateDesc}>{item.description}</Text>
              <View style={styles.substrateMetaRow}>
                <Text style={styles.substrateMetaLabel}>Vida útil recomendada:</Text>
                <Text style={styles.substrateMetaVal}>{item.maxRecommendedMonths} meses</Text>
              </View>
            </Card>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  segmentedControl: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#E4EDE7',
    borderRadius: 12,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  segBtnActive: {
    backgroundColor: COLORS.primary,
  },
  segBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  segBtnTextActive: {
    color: '#FFF',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  genusSelectorContainer: {
    marginVertical: 6,
  },
  genusPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  genusPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genusPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  genusPillTextActive: {
    color: '#FFF',
  },
  profileCard: {
    marginTop: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  genusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  commonName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  specGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#F3F8F5',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  specBox: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  specVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  specLbl: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  infoSection: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2EE',
    paddingBottom: 12,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 6,
  },
  infoBodyText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSecondary,
  },
  tipsSection: {
    marginTop: 4,
  },
  tipsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  expertTipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    color: COLORS.primaryDark,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    fontWeight: '700',
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
  },
  substrateGuideIntro: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 12,
  },
  substrateCard: {
    marginBottom: 12,
  },
  substrateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  substrateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  substrateDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  substrateMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEF4F0',
    paddingTop: 6,
  },
  substrateMetaLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  substrateMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});

