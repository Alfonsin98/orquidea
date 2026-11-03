import * as Notifications from 'expo-notifications';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getDatabase } from '../db/orchidDatabase';
import { requestNotificationPermissions } from '../services/notificationService';
import { COLORS } from '../theme/colors';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        await getDatabase();
        await requestNotificationPermissions();
        setDbReady(true);
      } catch (e: any) {
        console.error('Error inicializando base de datos:', e);
        setDbError(e?.message ?? 'Error desconocido');
      }
    }
    prepare();

    // Redirección si se toca una notificación de riego
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const orchidId = response.notification.request.content.data?.orchidId;
      if (typeof orchidId === 'string') {
        router.push(`/orchid/${orchidId}` as any);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (dbError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Error al iniciar OrquiML</Text>
        <Text style={styles.errorSub}>{dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Iniciando base de datos local y modelos ML...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.surface },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="orchid/[id]"
          options={{
            title: 'Detalle de Orquídea',
            headerBackTitle: 'Volver',
          }}
        />
        <Stack.Screen
          name="orchid/new"
          options={{
            title: 'Nueva Orquídea',
            presentation: 'modal',
            headerBackTitle: 'Cancelar',
          }}
        />
        <Stack.Screen
          name="log/new"
          options={{
            title: 'Registrar Avance / Riego',
            presentation: 'modal',
            headerBackTitle: 'Cerrar',
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.danger,
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

