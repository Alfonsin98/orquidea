import * as Notifications from 'expo-notifications';
import { AndroidImportance, IosAuthorizationStatus } from 'expo-notifications';
import { Platform } from 'react-native';
import { Orchid, OrchidMLPrediction } from '../types/orchid';

// Configurar comportamiento de notificación en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const settings = await Notifications.getPermissionsAsync();
  let granted =
    settings.granted ||
    settings.ios?.status === IosAuthorizationStatus.PROVISIONAL ||
    settings.ios?.status === IosAuthorizationStatus.AUTHORIZED;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    granted = requested.granted;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orquidea_care', {
      name: 'Cuidados y Riego de Orquídeas',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1E6B52',
    });
  }

  return granted;
}

export async function scheduleOrchidWaterReminder(
  orchid: Orchid,
  prediction: OrchidMLPrediction
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    // Cancelar recordatorios previos de esta orquídea para evitar duplicados
    await cancelOrchidReminders(orchid.id);

    const secondsUntil = Math.max(
      60,
      Math.round(
        (new Date(prediction.nextWaterDateISO).getTime() - Date.now()) / 1000
      )
    );

    // Si la fecha ya pasó o vence hoy, programar un recordatorio en 1 hora para avisar
    const finalSeconds = secondsUntil > 0 ? secondsUntil : 3600;

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🌱 Turno de Riego: ${orchid.name}`,
        body: `El modelo adaptativo estima que el sustrato (${orchid.substrate}) está listo. Revisa el velamen plateado de las raíces.`,
        data: { orchidId: orchid.id, type: 'water_due' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: finalSeconds,
        repeats: false,
      },
    });

    return notifId;
  } catch (err) {
    console.warn('No se pudo programar la notificación local:', err);
    return null;
  }
}

export async function cancelOrchidReminders(orchidId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      if (notif.content.data?.orchidId === orchidId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
      }
    }
  } catch (e) {
    console.warn('Error cancelando notificaciones anteriores:', e);
  }
}

