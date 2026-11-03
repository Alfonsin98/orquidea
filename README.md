# 🌸 OrquiML - Gestor Inteligente de Orquídeas con Machine Learning Local

Aplicación móvil nativa para **Android** y **iOS (Apple)** desarrollada con **React Native, Expo SDK 58, TypeScript y SQLite**. 

OrquiML está diseñada específicamente para aficionados y coleccionistas de orquídeas. No depende de servidores en la nube ni conexión a internet: toda la información, las fotos y el motor de **Machine Learning adaptativo** se ejecutan de manera privada y local dentro del teléfono.

---

## 🌟 Características Principales

### 1. Base de Datos Local en el Teléfono (SQLite Persistente)
* **Almacenamiento 100% offline**: Todas tus orquídeas, fotos, historial de riegos, trasplantes y notas se guardan en SQLite dentro del dispositivo.
* **Respaldo y Restauración**: Exporta e importa fácilmente tu base de datos completa en formato JSON para no perder nada si cambias de teléfono.

### 2. Motor de Machine Learning Adaptativo (En el Dispositivo)
* **Priors Botánicos Científicos**: La app parte con los conocimientos y ciclos de secado de 8 géneros (*Phalaenopsis, Cattleya, Dendrobium, Oncidium, Vanda, Miltoniopsis, Paphiopedilum, Cymbidium*).
* **Regresión Bayesiana Ridge en SQLite**: Cada vez que registras un riego, abono o inspección, el modelo recalcula los pesos locales según tu microclima real (temperatura diurna/nocturna, humedad relativa, tipo de sustrato y ventilación).
* **Calibración por Retroalimentación ("Feedback Loop")**: Puedes calificar cada recomendación con un toque (*"Exacto"*, *"Muy pronto (aún húmeda)"*, *"Muy tarde (muy seca)"*), y el modelo ajusta de inmediato la curva matemática.
* **Explicabilidad Total (Explainable AI)**: Cada predicción muestra una barra de atribución de variables que te explica con claridad por qué te recomienda regar en esa fecha.

### 3. Visión Artificial Local para Fotos de Hojas y Raíces
* Toma fotos con la cámara o súbelas desde la galería.
* La app procesa la imagen en el procesador del teléfono y segmenta el espacio de color (HSV):
  * **Hidratación del Velamen**: Detecta si las raíces están verdes (hidratadas) o plateadas/grises (listas para regar).
  * **Vigor de Clorofila**: Evalúa la densidad foliar.
  * **Detección Temprana de Riesgos**: Advierte sobre clorosis (amarilleo por sol excesivo o falta de nutrientes), antocianina (tonos rojizos de defensa) y necrosis/manchas oscuras (alerta de pudrición o quemaduras).

### 4. Consejos y Optimización de Floración
* Compara el **salto térmico día/noche** de tu ambiente contra el requerimiento botánico de la orquídea para detonar varas florales.
* Avisos de nutrición en dosis suave (*"débil, semanalmente"*).

### 5. Catálogo Botánico Especializado
* Ficha técnica completa de 8 géneros populares.
* Guía y comparativa de sustratos con sus factores de retención hídrica (Corteza de pino, Musgo Sphagnum, LECA, Montada en corcho, Piedra volcánica).

### 6. Notificaciones Locales Inteligentes
* Recordatorios programados automáticamente cuando el modelo estima que el velamen está seco o toca abonar.

---

## 🚀 Cómo Probar la App en tu Teléfono (Android o iPhone)

No necesitas compilar código nativo en tu computadora para probar la app. Con **Expo Go**:

### Paso 1: Instala Expo Go en tu teléfono
* **Android**: Búscalo en Google Play Store como `Expo Go`.
* **iPhone**: Búscalo en App Store como `Expo Go`.

### Paso 2: Inicia el servidor de desarrollo en tu PC
En la carpeta del proyecto, ejecuta en la terminal:

```bash
npx expo start
```

### Paso 3: Conecta tu teléfono
* **Android**: Abre la app Expo Go y escanea el código QR que aparecerá en tu terminal.
* **iPhone**: Abre la cámara nativa de iOS, apunta al código QR y toca la notificación de *"Abrir en Expo Go"*.
* *(Asegúrate de que tu PC y tu teléfono estén conectados a la misma red Wi-Fi. Si estás en redes distintas, usa `npx expo start --tunnel`)*.

---

## 🛠️ Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npx expo start

# Comprobación de tipos TypeScript
npx tsc --noEmit

# Análisis de código ESLint
npx eslint .

# Diagnóstico de dependencias y salud del proyecto (20/20 checks)
npx expo-doctor
```

---

## 📁 Estructura del Código

```text
orquidea/
├── src/
│   ├── app/                      # Rutas de navegación con Expo Router
│   │   ├── _layout.tsx           # Layout raíz, SQLite y notificaciones
│   │   ├── (tabs)/               # Pestañas inferiores principales
│   │   │   ├── _layout.tsx       # Navegador de pestañas con iconos
│   │   │   ├── index.tsx         # Colección de orquídeas con tarjetas interactivas
│   │   │   ├── ml-insights.tsx   # Panel de inteligencia ML y explicabilidad
│   │   │   ├── catalog.tsx       # Catálogo botánico de géneros y sustratos
│   │   │   └── settings.tsx      # Respaldo JSON y ajustes
│   │   ├── orchid/
│   │   │   ├── [id].tsx          # Ficha detallada, tips y bitácora
│   │   │   └── new.tsx           # Formulario para agregar/editar orquídeas
│   │   └── log/
│   │       └── new.tsx           # Registro de cuidados y visión artificial por foto
│   ├── components/               # Componentes UI reutilizables
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── TipCard.tsx           # Tarjeta de tip con feedback para entrenar el ML
│   │   └── MLAttributionBar.tsx  # Barras de impacto de variables (Explainable AI)
│   ├── data/
│   │   └── orchidCatalog.ts      # Fichas botánicas y factores de retención
│   ├── db/
│   │   └── orchidDatabase.ts     # SQLite local, migraciones y respaldo JSON
│   ├── ml/
│   │   ├── mathUtils.ts          # Álgebra lineal, resolución Bayesiana Ridge y HSV
│   │   ├── adaptiveEngine.ts     # Predicción de riego, salud y optimización floral
│   │   └── photoVision.ts        # Segmentación cromática de tejido foliar y velamen
│   ├── services/
│   │   └── notificationService.ts # Notificaciones locales automáticas
│   ├── theme/
│   │   └── colors.ts             # Paleta de colores botánica
│   └── types/
│       └── orchid.ts             # Interfaces TypeScript
├── app.json                      # Configuración Expo y permisos Android/iOS
├── package.json
└── tsconfig.json
```

