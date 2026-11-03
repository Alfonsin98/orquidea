import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Badge } from '../../components/Badge';
import { Card } from '../../components/Card';
import {
  FERTILIZER_DOSE_LABELS,
  FERTILIZER_LABELS,
  LEAF_CONDITION_LABELS,
  ROOT_CONDITION_LABELS,
  WATERING_METHOD_LABELS,
} from '../../data/orchidCatalog';
import { getAllOrchids, getOrchidById, saveCareLog } from '../../db/orchidDatabase';
import { analyzeOrchidPhotoOnDevice } from '../../ml/photoVision';
import { COLORS } from '../../theme/colors';
import {
  CareEventType,
  CareLog,
  FertilizerDose,
  FertilizerType,
  GrowthStage,
  LeafCondition,
  LightLevel,
  Orchid,
  PhotoTargetPart,
  PhotoVisionMetrics,
  PseudobulbCondition,
  RootCondition,
  SubstrateType,
  VentilationLevel,
  WateringMethod,
} from '../../types/orchid';

export default function NewCareLogScreen() {
  const { orchidId } = useLocalSearchParams<{ orchidId?: string }>();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [orchids, setOrchids] = useState<Orchid[]>([]);
  const [selectedOrchidId, setSelectedOrchidId] = useState<string>(orchidId || '');
  const [selectedOrchid, setSelectedOrchid] = useState<Orchid | null>(null);

  // Fecha del registro (editable, por defecto hoy)
  const [recordedDate, setRecordedDate] = useState(() => new Date().toISOString().substring(0, 10));

  // 1. Riego
  const [watered, setWatered] = useState(true);
  const [wateringMethod, setWateringMethod] = useState<WateringMethod>('inmersion');
  const [wateringNotes, setWateringNotes] = useState('');

  // 2. Atomización / Pulverización
  const [misted, setMisted] = useState(false);
  const [mistingNotes, setMistingNotes] = useState('');

  // 3. Fertilización
  const [fertilized, setFertilized] = useState(false);
  const [fertilizerType, setFertilizerType] = useState<FertilizerType>('equilibrado_20_20_20');
  const [fertilizerDose, setFertilizerDose] = useState<FertilizerDose>('cuarto');
  const [fertilizerNotes, setFertilizerNotes] = useState('');

  // 4. Trasplante o poda
  const repotted = false;
  const newSubstrate: SubstrateType = selectedOrchid?.substrate || 'corteza_pino';
  const pruned = false;

  // 5. Morfología & Crecimiento
  const [rootCondition, setRootCondition] = useState<RootCondition>('plateadas_secas');
  const [leafCondition, setLeafCondition] = useState<LeafCondition>('firmes_verdes');
  const pseudobulbCondition: PseudobulbCondition = 'no_aplica';
  const [growthStage, setGrowthStage] = useState<GrowthStage>('vegetativo');
  const [leafCount, setLeafCount] = useState('4');
  const [spikeCount, setSpikeCount] = useState('0');
  const bloomCount = 0;
  const [healthScore, setHealthScore] = useState('85');

  // Ambiente
  const [tempDay, setTempDay] = useState('23');
  const [tempNight, setTempNight] = useState('18');
  const [humidity, setHumidity] = useState('60');
  const [lightLevel, setLightLevel] = useState<LightLevel>('luz_filtrada_brillante');
  const [ventilation, setVentilation] = useState<VentilationLevel>('media');

  // Foto y Visión Local
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoTargetPart, setPhotoTargetPart] = useState<PhotoTargetPart>('raices');
  const [photoMetrics, setPhotoMetrics] = useState<PhotoVisionMetrics | null>(null);
  const [analyzingPhoto, setAnalyzingPhoto] = useState(false);

  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAllOrchids().then((list) => {
      setOrchids(list);
      if (!selectedOrchidId && list.length > 0) {
        setSelectedOrchidId(list[0].id);
      }
    });
  }, [selectedOrchidId]);

  useEffect(() => {
    if (selectedOrchidId) {
      getOrchidById(selectedOrchidId).then((found) => {
        if (found) {
          setSelectedOrchid(found);
          setGrowthStage(found.currentStage);
          setTempDay(found.baselineTempDayC.toString());
          setTempNight(found.baselineTempNightC.toString());
          setHumidity(found.baselineHumidityPct.toString());
          setLightLevel(found.defaultLight);
          setVentilation(found.defaultVentilation);
        }
      });
    }
  }, [selectedOrchidId]);

  const handlePickOrTakePhoto = async (mode: 'camera' | 'library') => {
    try {
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso de cámara requerido', 'Habilita el acceso a la cámara para fotografiar tus plantas.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Permite el acceso a fotos para seleccionar una imagen.');
          return;
        }
      }

      const result =
        mode === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.75,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.75,
            });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPhotoUri(uri);
        triggerAnalysis(uri, photoTargetPart);
      }
    } catch (e: any) {
      Alert.alert('Error al capturar foto', e.message);
    }
  };

  const triggerAnalysis = async (uri: string, target: PhotoTargetPart) => {
    try {
      setAnalyzingPhoto(true);
      const metrics = await analyzeOrchidPhotoOnDevice(uri, target);
      setPhotoMetrics(metrics);

      setHealthScore(metrics.greenVigorScore.toString());
      if (target === 'raices') {
        if (metrics.velamenHydrationScore <= 40) {
          setRootCondition('plateadas_secas');
        } else if (metrics.velamenHydrationScore >= 65) {
          setRootCondition('verdes_hidratadas');
        }
      }
    } catch (e: any) {
      console.warn('Fallo visión:', e);
    } finally {
      setAnalyzingPhoto(false);
    }
  };

  const handleTargetPartChange = (target: PhotoTargetPart) => {
    setPhotoTargetPart(target);
    if (photoUri) {
      triggerAnalysis(photoUri, target);
    }
  };

  const handleSave = async () => {
    if (!selectedOrchidId) {
      Alert.alert('Selecciona una orquídea', 'Debes elegir la planta a la que corresponde este registro.');
      return;
    }

    try {
      setSaving(true);
      let eventType: CareEventType = 'inspeccion';
      if (watered && fertilized) eventType = 'riego_y_abono';
      else if (watered) eventType = 'riego';
      else if (fertilized) eventType = 'fertilizacion';

      const noteParts: string[] = [];
      if (wateringNotes.trim()) noteParts.push(`[Riego] ${wateringNotes.trim()}`);
      if (mistingNotes.trim()) noteParts.push(`[Atomización] ${mistingNotes.trim()}`);
      if (fertilizerNotes.trim()) noteParts.push(`[Fertilización] ${fertilizerNotes.trim()}`);
      if (notes.trim()) noteParts.push(notes.trim());

      const logDate = recordedDate ? new Date(`${recordedDate}T12:00:00`).toISOString() : new Date().toISOString();

      const logToSave: CareLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orchidId: selectedOrchidId,
        recordedAt: logDate,
        eventType,
        watered,
        wateringMethod: watered ? wateringMethod : 'ninguno',
        misted,
        mistingNotes: mistingNotes.trim() || undefined,
        fertilized,
        fertilizerType: fertilized ? fertilizerType : 'ninguno',
        fertilizerDose: fertilized ? fertilizerDose : 'ninguna',
        fertilizerNotes: fertilizerNotes.trim() || undefined,
        repotted,
        newSubstrate: repotted ? newSubstrate : null,
        pruned,
        leafCount: parseInt(leafCount, 10) || 4,
        newLeafCount: 0,
        spikeCount: parseInt(spikeCount, 10) || 0,
        bloomCount,
        rootCondition,
        leafCondition,
        pseudobulbCondition,
        growthStage,
        healthScore: parseFloat(healthScore) || 85.0,
        tempDayC: parseFloat(tempDay) || 23.0,
        tempNightC: parseFloat(tempNight) || 18.0,
        humidityPct: parseFloat(humidity) || 60.0,
        lightLevel,
        ventilation,
        photoUri,
        photoTargetPart,
        photoMetrics,
        notes: noteParts.join(' | '),
      };

      await saveCareLog(logToSave);
      router.back();
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, isTablet && { maxWidth: 900, alignSelf: 'center', width: '100%' }]}>
      {/* 1. Selector de Orquídea y Fecha */}
      <Card style={styles.card}>
        <Text style={styles.cardSectionTitle}>Planta y Fecha del Registro</Text>
        <Text style={styles.fieldLabel}>Orquídea a Registrar *</Text>
        <View style={styles.optionsWrap}>
          {orchids.map((orc) => (
            <TouchableOpacity
              key={orc.id}
              style={[styles.chip, selectedOrchidId === orc.id && styles.chipActive]}
              onPress={() => setSelectedOrchidId(orc.id)}
            >
              <Text style={[styles.chipText, selectedOrchidId === orc.id && styles.chipTextActive]}>
                {orc.name} ({orc.genus})
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Fecha del Registro (AAAA-MM-DD) *</Text>
        <TextInput
          style={styles.textInput}
          value={recordedDate}
          onChangeText={setRecordedDate}
          placeholder="2026-11-03"
          placeholderTextColor={COLORS.textMuted}
        />
      </Card>

      {/* 2. Bitácora Fotográfica con Fecha (Hojas o Raíces) */}
      <Card style={styles.visionCard}>
        <View style={styles.cardHeaderTitleRow}>
          <MaterialCommunityIcons name="camera-iris" size={22} color={COLORS.primary} />
          <Text style={styles.cardSectionTitle}>Foto con Fecha (Crecimiento & Raíces)</Text>
        </View>

        <Text style={styles.visionIntro}>
          Fotografía de cerca las raíces o nuevas hojas. El motor analiza el tono del velamen y vigor de clorofila.
        </Text>

        <Text style={styles.fieldLabel}>¿Qué parte estás fotografiando?</Text>
        <View style={styles.optionsWrap}>
          <TouchableOpacity
            style={[styles.chip, photoTargetPart === 'raices' && styles.chipActive]}
            onPress={() => handleTargetPartChange('raices')}
          >
            <Text style={[styles.chipText, photoTargetPart === 'raices' && styles.chipTextActive]}>
              🌱 Raíces / Velamen
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, photoTargetPart === 'hojas' && styles.chipActive]}
            onPress={() => handleTargetPartChange('hojas')}
          >
            <Text style={[styles.chipText, photoTargetPart === 'hojas' && styles.chipTextActive]}>
              🌿 Crecimiento Follaje
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, photoTargetPart === 'flores' && styles.chipActive]}
            onPress={() => handleTargetPartChange('flores')}
          >
            <Text style={[styles.chipText, photoTargetPart === 'flores' && styles.chipTextActive]}>
              🌸 Flores / Vara
            </Text>
          </TouchableOpacity>
        </View>

        {/* Botones de Cámara y Galería */}
        <View style={styles.photoActionRow}>
          <TouchableOpacity
            style={styles.photoBtnPrimary}
            onPress={() => handlePickOrTakePhoto('camera')}
          >
            <MaterialCommunityIcons name="camera" size={18} color="#FFF" />
            <Text style={styles.photoBtnPrimaryText}>Tomar Foto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.photoBtnOutline}
            onPress={() => handlePickOrTakePhoto('library')}
          >
            <MaterialCommunityIcons name="image-multiple" size={18} color={COLORS.primary} />
            <Text style={styles.photoBtnOutlineText}>Elegir de Galería</Text>
          </TouchableOpacity>
        </View>

        {photoUri && (
          <View style={styles.previewBox}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />

            {analyzingPhoto ? (
              <View style={styles.analyzingOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.analyzingText}>Analizando clorofila y velamen...</Text>
              </View>
            ) : photoMetrics ? (
              <View style={styles.metricsBox}>
                <Text style={styles.metricsSummaryText}>{photoMetrics.summary}</Text>
                <View style={styles.scoresRow}>
                  <Badge
                    label={`Vigor: ${photoMetrics.greenVigorScore}%`}
                    variant="primary"
                    style={{ marginRight: 6 }}
                  />
                  <Badge
                    label={`Velamen: ${photoMetrics.velamenHydrationScore}%`}
                    variant="water"
                  />
                </View>
              </View>
            ) : null}
          </View>
        )}
      </Card>

      {/* 3. Espacio para Riego y Atomización */}
      <Card style={styles.card}>
        <View style={styles.cardHeaderTitleRow}>
          <MaterialCommunityIcons name="water" size={22} color={COLORS.water} />
          <Text style={[styles.cardSectionTitle, { color: COLORS.water }]}>Riego y Atomización</Text>
        </View>

        {/* Switch Riego */}
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>¿Regaste hoy?</Text>
          <Switch
            value={watered}
            onValueChange={setWatered}
            trackColor={{ false: '#D0D8D3', true: COLORS.waterLight }}
            thumbColor={watered ? COLORS.water : '#FFF'}
          />
        </View>

        {watered && (
          <View style={styles.subOptionsContainer}>
            <Text style={styles.fieldLabel}>Método de Riego</Text>
            <View style={styles.optionsWrap}>
              {(Object.keys(WATERING_METHOD_LABELS) as WateringMethod[])
                .filter((m) => m !== 'ninguno')
                .map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.chip, wateringMethod === m && styles.chipActive]}
                    onPress={() => setWateringMethod(m)}
                  >
                    <Text style={[styles.chipText, wateringMethod === m && styles.chipTextActive]}>
                      {WATERING_METHOD_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Anotaciones de Riego:</Text>
            <TextInput
              style={styles.textInput}
              value={wateringNotes}
              onChangeText={setWateringNotes}
              placeholder="Ej: Inmersión por 12 min, escurrido total..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        )}

        {/* Switch Atomización / Pulverización */}
        <View style={[styles.switchRow, { marginTop: 12 }]}>
          <Text style={styles.switchLabel}>¿Atomizaste / Pulverizaste hoy?</Text>
          <Switch
            value={misted}
            onValueChange={setMisted}
            trackColor={{ false: '#D0D8D3', true: '#BFDBFE' }}
            thumbColor={misted ? '#2563EB' : '#FFF'}
          />
        </View>

        {misted && (
          <View style={styles.subOptionsContainer}>
            <Text style={styles.fieldLabel}>Anotaciones de Atomización:</Text>
            <TextInput
              style={styles.textInput}
              value={mistingNotes}
              onChangeText={setMistingNotes}
              placeholder="Ej: Pulverización fina en raíces aéreas por la mañana..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        )}
      </Card>

      {/* 4. Espacio para Fertilización */}
      <Card style={styles.card}>
        <View style={styles.cardHeaderTitleRow}>
          <MaterialCommunityIcons name="flask" size={22} color={COLORS.orchid} />
          <Text style={[styles.cardSectionTitle, { color: COLORS.orchid }]}>Fertilización y Nutrientes</Text>
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>¿Aplicaste Fertilizante hoy?</Text>
          <Switch
            value={fertilized}
            onValueChange={setFertilized}
            trackColor={{ false: '#D0D8D3', true: COLORS.primaryLight }}
            thumbColor={fertilized ? COLORS.primary : '#FFF'}
          />
        </View>

        {fertilized && (
          <View style={styles.subOptionsContainer}>
            <Text style={styles.fieldLabel}>Tipo de Abono</Text>
            <View style={styles.optionsWrap}>
              {(Object.keys(FERTILIZER_LABELS) as FertilizerType[])
                .filter((f) => f !== 'ninguno')
                .map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.chip, fertilizerType === f && styles.chipActive]}
                    onPress={() => setFertilizerType(f)}
                  >
                    <Text style={[styles.chipText, fertilizerType === f && styles.chipTextActive]}>
                      {FERTILIZER_LABELS[f]}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Dosis Aplicada</Text>
            <View style={styles.optionsWrap}>
              {(['cuarto', 'media', 'completa'] as FertilizerDose[]).map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, fertilizerDose === d && styles.chipActive]}
                  onPress={() => setFertilizerDose(d)}
                >
                  <Text style={[styles.chipText, fertilizerDose === d && styles.chipTextActive]}>
                    {FERTILIZER_DOSE_LABELS[d]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Anotaciones de Fertilización:</Text>
            <TextInput
              style={styles.textInput}
              value={fertilizerNotes}
              onChangeText={setFertilizerNotes}
              placeholder="Ej: 1/4 cucharadita x litro, dilución semanal suave..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>
        )}
      </Card>

      {/* 5. Desarrollo de Planta, Raíces y Clima */}
      <Card style={styles.card}>
        <Text style={styles.cardSectionTitle}>Desarrollo Vegetativo y Clima</Text>

        <Text style={styles.fieldLabel}>Condición de Raíces</Text>
        <View style={styles.optionsWrap}>
          {(Object.keys(ROOT_CONDITION_LABELS) as RootCondition[]).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.chip, rootCondition === r && styles.chipActive]}
              onPress={() => setRootCondition(r)}
            >
              <Text style={[styles.chipText, rootCondition === r && styles.chipTextActive]}>
                {ROOT_CONDITION_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Condición de Hojas</Text>
        <View style={styles.optionsWrap}>
          {(Object.keys(LEAF_CONDITION_LABELS) as LeafCondition[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.chip, leafCondition === l && styles.chipActive]}
              onPress={() => setLeafCondition(l)}
            >
              <Text style={[styles.chipText, leafCondition === l && styles.chipTextActive]}>
                {LEAF_CONDITION_LABELS[l]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.twoColRow}>
          <View style={styles.twoColItem}>
            <Text style={styles.fieldLabel}>Total Hojas</Text>
            <TextInput
              style={styles.textInput}
              value={leafCount}
              onChangeText={setLeafCount}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.twoColItem}>
            <Text style={styles.fieldLabel}>Varas Florales</Text>
            <TextInput
              style={styles.textInput}
              value={spikeCount}
              onChangeText={setSpikeCount}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 10 }]}>Observaciones y Notas Generales</Text>
        <TextInput
          style={[styles.textInput, { height: 75, textAlignVertical: 'top' }]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Ej: Nueva punta verde asomando, flor abierta..."
          placeholderTextColor={COLORS.textMuted}
          multiline
        />
      </Card>

      {/* Botón Guardar */}
      <TouchableOpacity
        style={styles.saveBtn}
        activeOpacity={0.85}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialCommunityIcons name="content-save-check" size={20} color="#FFF" />
            <Text style={styles.saveBtnText}>Guardar Registro en Base de Datos</Text>
          </>
        )}
      </TouchableOpacity>
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
    paddingBottom: 50,
  },
  card: {
    marginBottom: 14,
  },
  cardSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: COLORS.text,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F0F5F2',
    borderWidth: 1,
    borderColor: '#DFE7E2',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  visionCard: {
    backgroundColor: '#FAFDFB',
    borderColor: '#D4E6DC',
    marginBottom: 14,
  },
  visionIntro: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },
  photoActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  photoBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  photoBtnPrimaryText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  photoBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  photoBtnOutlineText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },
  previewBox: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  analyzingOverlay: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  analyzingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  metricsBox: {
    padding: 10,
    backgroundColor: '#FAFDFB',
    borderTopWidth: 1,
    borderTopColor: '#DFECE4',
  },
  metricsSummaryText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  scoresRow: {
    flexDirection: 'row',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  subOptionsContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#F8FAF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EDF2EE',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  twoColItem: {
    flex: 1,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
