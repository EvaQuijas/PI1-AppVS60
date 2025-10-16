import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    updateDoc,
    where
} from 'firebase/firestore';
import { Alert, AppState, Linking } from 'react-native';
import { db } from '../../config/firebase';

export class EmergencyServices {
  // 🚨 ACTIVAR EMERGENCIA COMPLETA CON WORKFLOW
  static async activateEmergency(userId, emergencyConfig) {
    try {
      // 1. Obtener ubicación actual
      const location = await this.getCurrentLocation();
      
      // 2. Crear registro de emergencia
      const emergencyRecord = {
        userId,
        timestamp: new Date(),
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy
        } : null,
        status: 'active',
        message: emergencyConfig.message || '¡EMERGENCIA! Necesito ayuda inmediatamente.',
        contactsNotified: [],
        createdAt: new Date(),
        workflow: {
          step: 'initializing',
          completedSteps: [],
          pendingSteps: ['location', 'messages', 'call']
        }
      };

      // Guardar en Firebase
      const docRef = await addDoc(collection(db, "users", userId, "emergencies"), emergencyRecord);

      // 3. Ejecutar workflow de emergencia
      await this.executeEmergencyWorkflow(userId, docRef.id, emergencyRecord, emergencyConfig);

      return { success: true, emergencyId: docRef.id, location };
      
    } catch (error) {
      console.error('❌ Error activando emergencia:', error);
      throw error;
    }
  }

  // 🔄 EJECUTAR WORKFLOW DE EMERGENCIA
  static async executeEmergencyWorkflow(userId, emergencyId, emergencyRecord, emergencyConfig) {
    try {
      // Paso 1: Enviar mensajes a contactos
      await this.updateWorkflowStep(userId, emergencyId, 'messages', 'in_progress');
      await this.notifyEmergencyContactsWorkflow(userId, emergencyId, emergencyRecord, emergencyConfig.contacts);
      await this.updateWorkflowStep(userId, emergencyId, 'messages', 'completed');
      
      // Paso 2: Esperar un momento antes de la llamada
      await this.delay(3000); // 3 segundos de pausa
      
      // Paso 3: Realizar llamada automática si está configurado
      if (emergencyConfig.autoCall && emergencyConfig.primaryContact) {
        await this.updateWorkflowStep(userId, emergencyId, 'call', 'in_progress');
        await this.makeEmergencyCall(emergencyConfig.primaryContact.phone);
        await this.updateWorkflowStep(userId, emergencyId, 'call', 'completed');
      }
      
      // Paso 4: Marcar workflow como completado
      await this.updateWorkflowStep(userId, emergencyId, 'workflow', 'completed');
      
    } catch (error) {
      console.error('❌ Error en workflow de emergencia:', error);
      await this.updateWorkflowStep(userId, emergencyId, 'workflow', 'error');
    }
  }

  // 📊 ACTUALIZAR PASO DEL WORKFLOW
  static async updateWorkflowStep(userId, emergencyId, step, status) {
    try {
      const emergencyRef = doc(db, "users", userId, "emergencies", emergencyId);
      const updateData = {
        [`workflow.step`]: step,
        [`workflow.${step}Status`]: status,
        [`workflow.lastUpdate`]: new Date()
      };
      
      if (status === 'completed') {
        updateData[`workflow.completedSteps`] = [step];
      }
      
      await updateDoc(emergencyRef, updateData);
      
    } catch (error) {
      console.error('❌ Error actualizando workflow:', error);
    }
  }

  // ⏱️ DELAY UTILITY
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 📍 OBTENER UBICACIÓN ACTUAL
  static async getCurrentLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se necesita acceso a la ubicación para emergencias');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000, // 10 segundos timeout
      });

      return location;
      
    } catch (error) {
      console.error('❌ Error obteniendo ubicación:', error);
      return null;
    }
  }

  // 📱 NOTIFICAR CONTACTOS DE EMERGENCIA CON WORKFLOW
  static async notifyEmergencyContactsWorkflow(userId, emergencyId, emergencyRecord, contacts) {
    if (!contacts || contacts.length === 0) {
      return;
    }

    const location = emergencyRecord.location;
    const mapsUrl = location ? 
      `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : 
      'Ubicación no disponible';

    const emergencyMessage = `${emergencyRecord.message}\n\n📍 Mi ubicación: ${mapsUrl}\n⏰ Hora: ${emergencyRecord.timestamp.toLocaleString()}`;

    // Notificar cada contacto con timeout
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      try {
        await this.sendEmergencyMessageWithTimeout(contact, emergencyMessage);
        
        // Actualizar progreso en Firebase
        await this.updateContactNotificationProgress(userId, emergencyId, contact.id, 'sent');
        
        // Pausa entre mensajes para evitar spam
        if (i < contacts.length - 1) {
          await this.delay(2000); // 2 segundos entre mensajes
        }
        
      } catch (error) {
        console.error(`❌ Error enviando mensaje a ${contact.name}:`, error);
        await this.updateContactNotificationProgress(userId, emergencyId, contact.id, 'failed');
      }
    }
  }

  // 📱 NOTIFICAR CONTACTOS DE EMERGENCIA (método original mantenido para compatibilidad)
  static async notifyEmergencyContacts(userId, emergencyRecord, contacts) {
    if (!contacts || contacts.length === 0) {
      return;
    }

    const location = emergencyRecord.location;
    const mapsUrl = location ? 
      `https://www.google.com/maps?q=${location.latitude},${location.longitude}` : 
      'Ubicación no disponible';

    const emergencyMessage = `${emergencyRecord.message}\n\n📍 Mi ubicación: ${mapsUrl}\n⏰ Hora: ${emergencyRecord.timestamp.toLocaleString()}`;

    // Notificar cada contacto
    for (const contact of contacts) {
      try {
        await this.sendEmergencyMessage(contact, emergencyMessage);
      } catch (error) {
        console.error(`❌ Error enviando mensaje a ${contact.name}:`, error);
      }
    }
  }

  // 📊 ACTUALIZAR PROGRESO DE NOTIFICACIÓN DE CONTACTO
  static async updateContactNotificationProgress(userId, emergencyId, contactId, status) {
    try {
      const emergencyRef = doc(db, "users", userId, "emergencies", emergencyId);
      await updateDoc(emergencyRef, {
        [`contactsNotified.${contactId}`]: {
          status,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error actualizando progreso de contacto:', error);
    }
  }

  // 💬 ENVIAR MENSAJE DE EMERGENCIA CON TIMEOUT MEJORADO
  static async sendEmergencyMessageWithTimeout(contact, message, timeoutMs = 10000) {
    return new Promise(async (resolve, reject) => {
      try {
        // Intentar WhatsApp primero
        const whatsappUrl = `whatsapp://send?phone=${contact.phone}&text=${encodeURIComponent(message)}`;
        
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (canOpen) {
          await Linking.openURL(whatsappUrl);
          
          // Timeout para detectar cuando el usuario regresa de WhatsApp
          const timeout = setTimeout(() => {
            resolve();
          }, timeoutMs);
          
          // Detectar cuando la app vuelve al foreground (usuario regresa de WhatsApp)
          const handleAppStateChange = (nextAppState) => {
            if (nextAppState === 'active') {
              clearTimeout(timeout);
              subscription?.remove();
              resolve();
            }
          };
          
          // Suscribirse a cambios de AppState y guardar la suscripción
          const subscription = AppState.addEventListener('change', handleAppStateChange);
          
          // Timeout de seguridad más corto para evitar bloqueos
          setTimeout(() => {
            subscription?.remove();
            clearTimeout(timeout);
            resolve();
          }, 8000); // 8 segundos máximo
          
          return;
        }

        // Fallback a SMS
        const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
        await Linking.openURL(smsUrl);
        
        // Para SMS, esperar menos tiempo
        setTimeout(() => {
          resolve();
        }, 2000);
        
      } catch (error) {
        console.error('❌ Error enviando mensaje:', error);
        reject(error);
      }
    });
  }

  // 💬 ENVIAR MENSAJE DE EMERGENCIA (método original mantenido para compatibilidad)
  static async sendEmergencyMessage(contact, message) {
    try {
      // Intentar WhatsApp primero
      const whatsappUrl = `whatsapp://send?phone=${contact.phone}&text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        return;
      }

      // Fallback a SMS
      const smsUrl = `sms:${contact.phone}?body=${encodeURIComponent(message)}`;
      await Linking.openURL(smsUrl);
      
    } catch (error) {
      console.error('❌ Error enviando mensaje:', error);
      throw error;
    }
  }

  // 📞 REALIZAR LLAMADA DE EMERGENCIA
  static async makeEmergencyCall(phoneNumber) {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const canCall = await Linking.canOpenURL(phoneUrl);
      
      if (canCall) {
        await Linking.openURL(phoneUrl);
      }
    } catch (error) {
      console.error('❌ Error realizando llamada:', error);
    }
  }

  // 🔔 ENVIAR NOTIFICACIÓN DE EMERGENCIA
  static async sendEmergencyNotification(title, body) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 ${title}`,
          body: body,
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.MAX,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // Inmediata
      });
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
    }
  }

  // 📋 OBTENER CONFIGURACIÓN DE EMERGENCIA
  static async getEmergencyConfig(userId) {
    try {
      const q = query(
        collection(db, "users", userId, "emergencyConfig"),
        where("userId", "==", userId)
      );

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {
            const config = querySnapshot.docs[0].data();
            resolve({ ...config, id: querySnapshot.docs[0].id });
          } else {
            // Configuración por defecto
            resolve({
              message: '¡EMERGENCIA! Necesito ayuda inmediatamente. Por favor, contacta conmigo.',
              autoCall: true,
              contacts: [],
              primaryContact: null,
              userId
            });
          }
          unsubscribe();
        });
      });
    } catch (error) {
      console.error('❌ Error obteniendo configuración:', error);
      return null;
    }
  }

  // 💾 GUARDAR CONFIGURACIÓN DE EMERGENCIA
  static async saveEmergencyConfig(userId, config) {
    try {
      const configData = {
        ...config,
        userId,
        updatedAt: new Date()
      };

      // Si ya existe configuración, actualizarla
      const existingConfig = await this.getEmergencyConfig(userId);
      if (existingConfig && existingConfig.id) {
        await updateDoc(doc(db, "users", userId, "emergencyConfig", existingConfig.id), configData);
      } else {
        await addDoc(collection(db, "users", userId, "emergencyConfig"), configData);
      }
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      throw error;
    }
  }

  // 📊 OBTENER HISTORIAL DE EMERGENCIAS
  static async getEmergencyHistory(userId) {
    try {
      const q = query(
        collection(db, "users", userId, "emergencies"),
        where("userId", "==", userId)
      );

      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const emergencies = [];
          querySnapshot.forEach((doc) => {
            emergencies.push({ id: doc.id, ...doc.data() });
          });
          resolve(emergencies.sort((a, b) => b.timestamp - a.timestamp));
          unsubscribe();
        });
      });
    } catch (error) {
      console.error('❌ Error obteniendo historial:', error);
      return [];
    }
  }

  // 🛑 CANCELAR EMERGENCIA
  static async cancelEmergency(userId, emergencyId) {
    try {
      await updateDoc(doc(db, "users", userId, "emergencies", emergencyId), {
        status: 'cancelled',
        cancelledAt: new Date()
      });
    } catch (error) {
      console.error('❌ Error cancelando emergencia:', error);
      throw error;
    }
  }

  // 📊 OBTENER ESTADO DEL WORKFLOW DE EMERGENCIA
  static async getEmergencyWorkflowStatus(userId, emergencyId) {
    try {
      const emergencyRef = doc(db, "users", userId, "emergencies", emergencyId);
      const emergencyDoc = await getDoc(emergencyRef);
      
      if (emergencyDoc.exists()) {
        const data = emergencyDoc.data();
        return {
          id: emergencyDoc.id,
          status: data.status,
          workflow: data.workflow || {},
          contactsNotified: data.contactsNotified || {},
          timestamp: data.timestamp,
          location: data.location
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error obteniendo estado del workflow:', error);
      return null;
    }
  }

  // 🔄 SUSCRIBIRSE A CAMBIOS DEL WORKFLOW
  static subscribeToWorkflowChanges(userId, emergencyId, callback) {
    try {
      const emergencyRef = doc(db, "users", userId, "emergencies", emergencyId);
      
      return onSnapshot(emergencyRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          callback({
            id: doc.id,
            status: data.status,
            workflow: data.workflow || {},
            contactsNotified: data.contactsNotified || {},
            timestamp: data.timestamp,
            location: data.location
          });
        }
      });
    } catch (error) {
      console.error('❌ Error suscribiéndose a cambios:', error);
      return null;
    }
  }
}
