import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { Card } from '../../components/Card';
import {
  GROWTH_STAGE_LABELS,
  LIGHT_LABELS,
  SUBSTRATE_RETENTION_FACTOR,
} from '../../data/orchidCatalog';
import { getOrchidById, saveOrchid } from '../../db/orchidDatabase';
import { COLORS } from '../../theme/colors';
import {
  GrowthStage,
  LightLevel,
  Orchid,
  OrchidGenus,
  SubstrateType,
  VentilationLevel,
} from '../../types/orchid';

const GENERA: OrchidGenus[] = [
  'Phalaenopsis',
  'Cattleya',
  'Dendrobium',
  'Oncidium',
  'Vanda',
  'Miltoniopsis',
  'Paphiopedilum',
  'Cymbidium',
];

const SUBSTRATES: SubstrateType[] = [
  'corteza_pino',
  'musgo_sphagnum',
  'mixto_corteza_musgo',
  'arcilla_expandida',
  'montada_corcho',
  'piedra_volcanica',
];

const STAGES: GrowthStage[] = [
  'vegetativo',
  'enraizamiento',
  'vara_floral',
  'floracion',
  'reposo',
  'recuperacion',
];

export default function NewOrchidScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const { id } = useLocalSearchParams<{ id?: string }>();

  const [name, setName] = useState('');
  const [genus, setGenus] = useState<OrchidGenus>('Phalaenopsis');
  const [speciesOrHybrid, setSpeciesOrHybrid] = useState('');
  const [substrate, setSubstrate] = useState<SubstrateType>('corteza_pino');
  const [potTransparent, setPotTransparent] = useState(true);
  const [potSizeCm, setPotSizeCm] = useState('12');
  const [locationName, setLocationName] = useState('Interior luminoso');
  const [defaultLight, setDefaultLight] = useState<LightLevel>('luz_filtrada_brillante');
  const [defaultVentilation, setDefaultVentilation] = useState<VentilationLevel>('media');
  const [tempDay, setTempDay] = useState('23');
  const [tempNight, setTempNight] = useState('18');
  const [humidity, setHumidity] = useState('60');
  const [currentStage, setCurrentStage] = useState<GrowthStage>('vegetativo');
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      getOrchidById(id).then((found) => {
        if (found) {
          setName(found.name);
          setGenus(found.genus);
          setSpeciesOrHybrid(found.speciesOrHybrid);
          setSubstrate(found.substrate);
          setPotTransparent(found.potTransparent);
          setPotSizeCm(found.potSizeCm.toString());
          setLocationName(found.locationName);
          setDefaultLight(found.defaultLight);
          setDefaultVentilation(found.defaultVentilation);
          setTempDay(found.baselineTempDayC.toString());
          setTempNight(found.baselineTempNightC.toString());
          setHumidity(found.baselineHumidityPct.toString());
          setCurrentStage(found.currentStage);
          setCoverPhotoUri(found.coverPhotoUri);
          setNotes(found.notes);
        }
      });
    }
  }, [id]);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Permite acceso a tus fotos para guardar una portada.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Por favor ingresa un nombre para identificar tu orquídea.');
      return;
    }

    try {
      setSaving(true);
      const orchidToSave: Orchid = {
        id: id || `orchid_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        genus,
        speciesOrHybrid: speciesOrHybrid.trim() || genus,
        acquiredAt: new Date().toISOString(),
        lastRepottedAt: new Date().toISOString(),
        substrate,
        potTransparent,
        potSizeCm: parseFloat(potSizeCm) || 12.0,
        locationName: locationName.trim() || 'Interior',
        defaultLight,
        defaultVentilation,
        baselineTempDayC: parseFloat(tempDay) || 23.0,
        baselineTempNightC: parseFloat(tempNight) || 18.0,
        baselineHumidityPct: parseFloat(humidity) || 60.0,
        currentStage,
        coverPhotoUri,
        notes: notes.trim(),
        isDemo: false,
        createdAt: new Date().toISOString(),
      };

      await saveOrchid(orchidToSave);
      router.back();
    } catch (e: any) {
      Alert.alert('Error al guardar', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isTablet && { maxWidth: 960, alignSelf: 'center', width: '100%' }]}
    >
      {/* Selector de Foto de Portada */}
      <View style={styles.photoPickerRow}>
        <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
          {coverPhotoUri ? (
            <Image source={{ uri: coverPhotoUri }} style={styles.coverPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} />
              <Text style={styles.photoBtnText}>Agregar Foto</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.photoHelper}>
          <Text style={styles.helperTitle}>Foto de Portada</Text>
          <Text style={styles.helperSub}>
            Opcional. Te servirá para reconocerla visualmente en tu colección.
          </Text>
        </View>
      </View>

      {/* Identificación Básica */}
      <Card>
        <Text style={styles.fieldLabel}>Nombre de la Planta *</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ej: Phalaenopsis Cascada Blanca"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>Género Botánico</Text>
        <View style={styles.optionsWrap}>
          {GENERA.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.chip, genus === g && styles.chipActive]}
              onPress={() => setGenus(g)}
            >
              <Text style={[styles.chipText, genus === g && styles.chipTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>Especie o Híbrido (Opcional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ej: Phal. aphrodite, Cattleya walkeriana"
          value={speciesOrHybrid}
          onChangeText={setSpeciesOrHybrid}
        />

        <Text style={styles.fieldLabel}>Etapa de Crecimiento Actual</Text>
        <View style={styles.optionsWrap}>
          {STAGES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, currentStage === s && styles.chipActive]}
              onPress={() => setCurrentStage(s)}
            >
              <Text style={[styles.chipText, currentStage === s && styles.chipTextActive]}>
                {GROWTH_STAGE_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Maceta y Sustrato */}
      <Card>
        <Text style={styles.cardSectionTitle}>Maceta y Sustrato</Text>

        <Text style={styles.fieldLabel}>Tipo de Sustrato</Text>
        <View style={styles.optionsWrap}>
          {SUBSTRATES.map((sub) => (
            <TouchableOpacity
              key={sub}
              style={[styles.chip, substrate === sub && styles.chipActive]}
              onPress={() => setSubstrate(sub)}
            >
              <Text style={[styles.chipText, substrate === sub && styles.chipTextActive]}>
                {SUBSTRATE_RETENTION_FACTOR[sub]?.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchLabel}>Maceta Transparente</Text>
            <Text style={styles.switchSub}>
              Permite a las raíces hacer fotosíntesis y facilita inspeccionar el velamen
            </Text>
          </View>
          <Switch
            value={potTransparent}
            onValueChange={setPotTransparent}
            trackColor={{ false: '#D0D8D3', true: COLORS.primaryLight }}
            thumbColor={potTransparent ? COLORS.primary : '#FFF'}
          />
        </View>

        <Text style={styles.fieldLabel}>Diámetro de Maceta (cm)</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          placeholder="12"
          value={potSizeCm}
          onChangeText={setPotSizeCm}
        />
      </Card>

      {/* Ubicación y Microclima */}
      <Card>
        <Text style={styles.cardSectionTitle}>Ubicación y Microclima</Text>

        <Text style={styles.fieldLabel}>Lugar en Casa</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Ej: Estantería junto a ventana Este"
          value={locationName}
          onChangeText={setLocationName}
        />

        <Text style={styles.fieldLabel}>Iluminación Habitual</Text>
        <View style={styles.optionsWrap}>
          {(Object.keys(LIGHT_LABELS) as LightLevel[]).map((l) => (
            <TouchableOpacity
              key={l}
              style={[styles.chip, defaultLight === l && styles.chipActive]}
              onPress={() => setDefaultLight(l)}
            >
              <Text style={[styles.chipText, defaultLight === l && styles.chipTextActive]}>
                {LIGHT_LABELS[l]?.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.microclimateRow}>
          <View style={styles.microCol}>
            <Text style={styles.fieldLabel}>Temp Día (°C)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={tempDay}
              onChangeText={setTempDay}
            />
          </View>
          <View style={styles.microCol}>
            <Text style={styles.fieldLabel}>Temp Noche (°C)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={tempNight}
              onChangeText={setTempNight}
            />
          </View>
          <View style={styles.microCol}>
            <Text style={styles.fieldLabel}>Humedad (%)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={humidity}
              onChangeText={setHumidity}
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>Notas Adicionales</Text>
        <TextInput
          style={[styles.textInput, { height: 70 }]}
          multiline
          placeholder="Ej: Comprada en vivero en floración, regada con agua filtrada."
          value={notes}
          onChangeText={setNotes}
        />
      </Card>

      {/* Botón Guardar */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        <MaterialCommunityIcons name="content-save" size={20} color="#FFF" />
        <Text style={styles.saveBtnText}>
          {saving ? 'Guardando...' : id ? 'Actualizar Orquídea' : 'Guardar en Base de Datos'}
        </Text>
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
    paddingBottom: 40,
  },
  photoPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  photoBtn: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginRight: 14,
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBtnText: {
    fontSize: 10,
    color: COLORS.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  photoHelper: {
    flex: 1,
  },
  helperTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  helperSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#FAFDFB',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  chip: {
    backgroundColor: '#F0F5F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
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
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  switchSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
    marginTop: 1,
    marginRight: 10,
  },
  microclimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  microCol: {
    flex: 1,
    marginHorizontal: 3,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 12,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});

