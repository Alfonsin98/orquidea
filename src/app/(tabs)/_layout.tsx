import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { COLORS } from '../../theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.divider,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
        },
        headerTitleStyle: {
          fontWeight: '700',
          color: COLORS.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mis Orquídeas',
          headerTitle: '🌸 OrquiML Colección',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="flower"
              color={typeof color === 'string' ? color : COLORS.primary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ml-insights"
        options={{
          title: 'IA & Tips',
          headerTitle: '🧠 Inteligencia de Cultivo',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="brain"
              color={typeof color === 'string' ? color : COLORS.primary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          headerTitle: '📚 Guía de Géneros',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-variant"
              color={typeof color === 'string' ? color : COLORS.primary}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Respaldo',
          headerTitle: '💾 Respaldo y Ajustes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="database-sync"
              color={typeof color === 'string' ? color : COLORS.primary}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
