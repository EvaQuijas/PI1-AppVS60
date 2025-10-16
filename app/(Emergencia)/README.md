# 🚨 Módulo de Emergencia - Documentación

## 📋 Descripción General

El módulo de emergencia es una funcionalidad crítica que permite a los usuarios activar una emergencia con un solo toque, enviando automáticamente su ubicación y contactando a sus contactos de emergencia preseleccionados.

## 🎯 Funcionalidades Principales

### 1. **Botón de Pánico**
- Botón grande y visible en la pantalla principal
- Activación con confirmación de seguridad
- Vibración y efectos visuales de emergencia

### 2. **Envío Automático de Ubicación**
- Obtiene la ubicación GPS actual del usuario
- Envía coordenadas y enlace a Google Maps
- Compatible con WhatsApp y SMS

### 3. **Mensaje de Ayuda Personalizado**
- Plantillas predefinidas para diferentes tipos de emergencia
- Editor de mensaje personalizado
- Información médica relevante incluida

### 4. **Marcado Automático**
- Llamada directa al contacto principal
- Lista de contactos de emergencia priorizados
- Fallback a otros contactos si no contesta

### 5. **Notificaciones de Emergencia**
- Notificación push inmediata
- SMS automático como respaldo
- Historial de emergencias activadas

## 🏗️ Arquitectura del Módulo

```
app/(Emergencia)/
├── _layout.jsx                    # Layout del módulo
├── index.jsx                      # Pantalla principal de emergencia
├── config.jsx                     # Pantalla de configuración
├── utils/
│   └── emergencyServices.jsx       # Servicios principales
└── components/
    ├── EmergencyButton.jsx         # Botón de pánico
    ├── ContactSelector.jsx         # Selector de contactos
    └── MessageEditor.jsx          # Editor de mensajes
```

## 🔧 Servicios Implementados

### EmergencyServices
- `activateEmergency()` - Activa la emergencia completa
- `getCurrentLocation()` - Obtiene ubicación GPS
- `notifyEmergencyContacts()` - Notifica a contactos
- `sendEmergencyMessage()` - Envía mensaje por WhatsApp/SMS
- `makeEmergencyCall()` - Realiza llamada automática
- `getEmergencyConfig()` - Obtiene configuración
- `saveEmergencyConfig()` - Guarda configuración
- `getEmergencyHistory()` - Obtiene historial
- `cancelEmergency()` - Cancela emergencia activa

## 📱 Flujo de Usuario

### Configuración Inicial
1. Usuario accede al módulo de emergencia
2. Configura contactos de emergencia (reutiliza contactos existentes)
3. Selecciona contacto principal
4. Personaliza mensaje de emergencia
5. Configura llamada automática
6. Guarda configuración

### Activación de Emergencia
1. Usuario presiona botón de pánico
2. Modal de confirmación aparece
3. Usuario confirma la emergencia
4. Sistema obtiene ubicación GPS
5. Envía mensaje + ubicación por WhatsApp
6. Realiza llamada automática
7. Registra emergencia en historial

## 🔗 Integración con Módulos Existentes

### Contactos de Emergencia
- Reutiliza el sistema de contactos de `(EmergencyContact)`
- Permite seleccionar múltiples contactos
- Establece contacto principal para llamada automática

### Ubicación
- Mejora la funcionalidad de `(Ubicacion)`
- Obtiene ubicación en tiempo real
- Genera enlaces a Google Maps

### Notificaciones
- Extiende el sistema de notificaciones existente
- Notificaciones push inmediatas
- Integración con canales Android

## 🎨 Diseño y UX

### Pantalla Principal
- Botón de pánico prominente y accesible
- Estado de configuración visible
- Historial de emergencias recientes
- Acceso rápido a configuración

### Dashboard
- Botón de emergencia destacado en la parte superior
- Diseño llamativo con colores de emergencia
- Acceso rápido desde cualquier parte de la app

## 🔒 Seguridad y Confiabilidad

### Validaciones
- Verificación de permisos de ubicación
- Validación de contactos configurados
- Confirmación antes de activar emergencia

### Manejo de Errores
- Fallback a SMS si WhatsApp no está disponible
- Manejo de errores de ubicación
- Notificaciones de estado de la emergencia

## 📊 Persistencia de Datos

### Firebase Firestore
- Configuración de emergencia por usuario
- Historial de emergencias activadas
- Contactos de emergencia seleccionados

### Estructura de Datos
```javascript
// Configuración de emergencia
{
  userId: string,
  message: string,
  autoCall: boolean,
  contacts: Array<Contact>,
  primaryContact: Contact,
  updatedAt: Date
}

// Registro de emergencia
{
  userId: string,
  timestamp: Date,
  location: { latitude, longitude, accuracy },
  status: 'active' | 'cancelled' | 'completed',
  message: string,
  contactsNotified: Array<string>,
  createdAt: Date
}
```

## 🚀 Instalación y Configuración

### Dependencias Requeridas
- `expo-location` - Para obtener ubicación GPS
- `expo-notifications` - Para notificaciones push
- `firebase` - Para persistencia de datos
- `react-native` - Para funcionalidades nativas

### Permisos Necesarios
- Ubicación (foreground)
- Notificaciones
- Llamadas telefónicas
- Acceso a contactos

## 🧪 Testing

### Casos de Prueba
1. Configuración inicial de emergencia
2. Activación de emergencia con ubicación válida
3. Activación sin ubicación disponible
4. Envío de mensajes por WhatsApp y SMS
5. Llamadas automáticas
6. Cancelación de emergencia
7. Historial de emergencias

### Escenarios de Error
- Sin permisos de ubicación
- Sin contactos configurados
- WhatsApp no instalado
- Sin conexión a internet
- Error en servicios de Firebase

## 🔄 Mantenimiento y Mejoras Futuras

### Mejoras Potenciales
- Integración con servicios de emergencia locales
- Notificaciones a contactos cercanos por geolocalización
- Modo de emergencia silenciosa
- Integración con dispositivos wearables
- Análisis de patrones de emergencia

### Monitoreo
- Logs de activaciones de emergencia
- Métricas de tiempo de respuesta
- Análisis de efectividad de contactos
- Reportes de uso del módulo

---

## 📞 Soporte

Para soporte técnico o reportar problemas con el módulo de emergencia, contacta al equipo de desarrollo.

**⚠️ IMPORTANTE**: Este módulo está diseñado para situaciones de emergencia reales. Úsalo responsablemente y solo en casos que requieran ayuda inmediata.
