import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Card } from '../../components/Card';
import { exportDatabaseBackup, importDatabaseBackup, resetToDemoData } from '../../db/orchidDatabase';
import { requestNotificationPermissions } from '../../services/notificationService';
import { COLORS } from '../../theme/colors';

export default function SettingsScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleExportBackup = async () => {
    try {
      setLoadingAction('export');
      await exportDatabaseBackup();
      Alert.alert('Respaldo generado', 'Se ha preparado tu archivo JSON con todas las orquídeas y registros.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo exportar el respaldo.');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleImportBackup = async () => {
    Alert.alert(
      'Restaurar Respaldo',
      '¿Deseas importar un archivo JSON de respaldo de OrquiML? Los registros se incorporarán a tu base de datos local.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Seleccionar Archivo',
          onPress: async () => {
            try {
              setLoadingAction('import');
              const res = await importDatabaseBackup();
              Alert.alert(
                'Restauración Exitosa',
                `Se restauraron ${res.orchidsRestored} orquídeas y ${res.logsRestored} entradas de bitácora.`
              );
            } catch (e: any) {
              if (e.message !== 'Selección cancelada') {
                Alert.alert('Error en importación', e.message);
              }
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('Permiso Requerido', 'Por favor habilita las notificaciones para recibir alertas de riego.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌱 Prueba de Notificación OrquiML',
        body: '¡Todo listo! El sistema te notificará cuando el modelo estime que es momento de regar o abonar.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
        repeats: false,
      },
    });

    Alert.alert('Notificación programada', 'En 2 segundos recibirás la alerta de prueba.');
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Restablecer Datos de Demostración',
      '¿Deseas reiniciar la base de datos local con las orquídeas de ejemplo y su historial de aprendizaje inicial?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoadingAction('reset');
              await resetToDemoData();
              Alert.alert('Listo', 'Base de datos restaurada con datos botánicos de prueba.');
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, isTablet && { maxWidth: 960, alignSelf: 'center', width: '100%' }]}
    >
      {/* Respaldo y Migración Local */}
      <Text style={styles.sectionHeading}>RESPALDO Y BASE DE DATOS LOCAL</Text>
      <Card>
        <Text style={styles.cardExplanation}>
          Tus orquídeas, bitácora de riego y ponderaciones de Machine Learning se guardan en
          la base de datos SQLite interna de tu teléfono. Puedes exportar una copia cuando
          quieras o restaurarla si cambias de equipo:
        </Text>

        <TouchableOpacity
          style={styles.settingActionBtn}
          onPress={handleExportBackup}
          disabled={loadingAction !== null}
        >
          <View style={styles.btnLeft}>
            <MaterialCommunityIcons name="export-variant" size={22} color={COLORS.primary} />
            <View style={styles.btnTexts}>
              <Text style={styles.btnTitle}>Exportar Respaldo (JSON)</Text>
              <Text style={styles.btnSub}>Guardar o compartir archivo de la colección</Text>
            </View>
          </View>
          {loadingAction === 'export' ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.settingActionBtn}
          onPress={handleImportBackup}
          disabled={loadingAction !== null}
        >
          <View style={styles.btnLeft}>
            <MaterialCommunityIcons name="import" size={22} color={COLORS.orchid} />
            <View style={styles.btnTexts}>
              <Text style={styles.btnTitle}>Importar Respaldo (JSON)</Text>
              <Text style={styles.btnSub}>Cargar orquídeas desde un archivo anterior</Text>
            </View>
          </View>
          {loadingAction === 'import' ? (
            <ActivityIndicator size="small" color={COLORS.orchid} />
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>
      </Card>

      {/* Notificaciones y Avisos de Riego */}
      <Text style={styles.sectionHeading}>RECORDATORIOS Y NOTIFICACIONES</Text>
      <Card>
        <TouchableOpacity style={styles.settingActionBtn} onPress={handleTestNotification}>
          <View style={styles.btnLeft}>
            <MaterialCommunityIcons name="bell-ring-outline" size={22} color={COLORS.water} />
            <View style={styles.btnTexts}>
              <Text style={styles.btnTitle}>Probar Notificación Local</Text>
              <Text style={styles.btnSub}>Verificar sonido y permisos en el sistema</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </Card>

      {/* Privacidad y Motor Offline */}
      <Text style={styles.sectionHeading}>PRIVACIDAD Y ARQUITECTURA</Text>
      <Card style={styles.privacyCard}>
        <View style={styles.privacyHeader}>
          <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.primaryDark} />
          <Text style={styles.privacyTitle}>100% Local & Privado</Text>
        </View>
        <Text style={styles.privacyText}>
          OrquiML no requiere servidores en la nube ni conexión a internet permanente. La base
          de datos SQLite, el análisis cromático de fotos y la regresión Bayesiana para calibrar
          tips se ejecutan de manera nativa en el hardware de tu dispositivo.
        </Text>
      </Card>

      {/* Zona de Mantenimiento */}
      <Text style={styles.sectionHeading}>MANTENIMIENTO</Text>
      <Card>
        <TouchableOpacity style={styles.settingActionBtn} onPress={handleResetDemo}>
          <View style={styles.btnLeft}>
            <MaterialCommunityIcons name="refresh" size={22} color={COLORS.danger} />
            <View style={styles.btnTexts}>
              <Text style={[styles.btnTitle, { color: COLORS.danger }]}>
                Reiniciar Datos de Prueba
              </Text>
              <Text style={styles.btnSub}>Vuelve a cargar las orquídeas de ejemplo</Text>
            </View>
          </View>
          {loadingAction === 'reset' ? (
            <ActivityIndicator size="small" color={COLORS.danger} />
          ) : (
            <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
          )}
        </TouchableOpacity>
      </Card>

      <Text style={styles.versionNote}>OrquiML v1.0.0 • Motor Adaptativo Bayesiano</Text>
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
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 14,
    marginLeft: 4,
  },
  cardExplanation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  settingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  btnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  btnTexts: {
    marginLeft: 12,
    flex: 1,
  },
  btnTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  btnSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2EE',
    marginVertical: 4,
  },
  privacyCard: {
    backgroundColor: '#FAFDFB',
    borderColor: '#D4E6DC',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  privacyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 19,
  },
  versionNote: {
    textAlign: 'center',
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 24,
  },
});

