import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  AppState,
  FlatList,
  Modal,
  ScrollView,
  Text,
  Vibration
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useApp } from '../context/AppContext';
import { ContactSelector } from './components/ContactSelector';
import { EmergencyButton } from './components/EmergencyButton';
import { MessageEditor } from './components/MessageEditor';
import { EmergencyServices } from './utils/emergencyServices';

const EmergenciaScreen = () => {
  const { user } = useApp();
  const [emergencyConfig, setEmergencyConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [emergencyHistory, setEmergencyHistory] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [workflowProgress, setWorkflowProgress] = useState(null);
  const [appState, setAppState] = useState(AppState.currentState);
  const [emergencyCompleted, setEmergencyCompleted] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      loadEmergencyConfig();
      loadEmergencyHistory();
    }
  }, [user, loadEmergencyConfig, loadEmergencyHistory]);

  // 📱 DETECTAR CAMBIOS DE ESTADO DE LA APLICACIÓN
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      // Si la aplicación vuelve al foreground y la emergencia está completada
      if (appState.match(/inactive|background/) && nextAppState === 'active' && emergencyCompleted) {
        // Mostrar mensaje de éxito en el modal actual
        setTimeout(() => {
          closeEmergencyModal();
        }, 5000); // Mostrar por 5 segundos antes de cerrar
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, emergencyCompleted]);

  // 🚪 FUNCIÓN PARA CERRAR EL MODAL DE EMERGENCIA
  const closeEmergencyModal = () => {
    setEmergencyCompleted(false);
    setShowEmergencyModal(false);
    setActiveEmergency(null);
    setWorkflowProgress(null);
    loadEmergencyHistory(); // Recargar historial
  };

  // 📋 CARGAR CONFIGURACIÓN DE EMERGENCIA
  const loadEmergencyConfig = useCallback(async () => {
    try {
      const config = await EmergencyServices.getEmergencyConfig(user.uid);
      setEmergencyConfig(config);
    } catch (_error) {
      console.error('Error cargando configuración:', _error);
    }
  }, [user]);

  // 📊 CARGAR HISTORIAL DE EMERGENCIAS
  const loadEmergencyHistory = useCallback(async () => {
    try {
      const history = await EmergencyServices.getEmergencyHistory(user.uid);
      setEmergencyHistory(history);
    } catch (_error) {
      console.error('Error cargando historial:', _error);
    }
  }, [user]);

  // 🚨 ACTIVAR EMERGENCIA
  const activateEmergency = async () => {
    if (!emergencyConfig || !emergencyConfig.contacts || emergencyConfig.contacts.length === 0) {
      Alert.alert(
        'Configuración requerida',
        'Primero debes configurar tus contactos de emergencia',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurar', onPress: () => setShowConfigModal(true) }
        ]
      );
      return;
    }

    Alert.alert(
      '🚨 ACTIVAR EMERGENCIA',
      '¿Estás seguro de que necesitas activar la emergencia? Se enviará tu ubicación y se contactará a tus contactos de emergencia.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'ACTIVAR', 
          style: 'destructive',
          onPress: () => confirmEmergency()
        }
      ]
    );
  };

  // ✅ CONFIRMAR EMERGENCIA
  const confirmEmergency = async () => {
    setIsLoading(true);
    setShowEmergencyModal(true);
    
    try {
      // Vibración de emergencia
      Vibration.vibrate([0, 500, 200, 500]);
      
      // Activar emergencia con workflow
      const result = await EmergencyServices.activateEmergency(user.uid, emergencyConfig);
      
      if (result.success) {
        setActiveEmergency(result.emergencyId);
        
        // Suscribirse a cambios del workflow
        const unsubscribe = EmergencyServices.subscribeToWorkflowChanges(
          user.uid, 
          result.emergencyId, 
          (workflowData) => {
            setWorkflowProgress(workflowData);
            
            // Si el workflow está completado, marcar como completado
            if (workflowData.workflow.step === 'workflow' && 
                workflowData.workflow.workflowStatus === 'completed') {
              setEmergencyCompleted(true);
            }
          }
        );
        
        // Limpiar suscripción después de 5 minutos
        setTimeout(() => {
          if (unsubscribe) unsubscribe();
        }, 300000);
      }
    } catch (_error) {
      Alert.alert('Error', 'No se pudo activar la emergencia. Inténtalo de nuevo.');
      setShowEmergencyModal(false);
      setActiveEmergency(null);
      setWorkflowProgress(null);
    }
    setIsLoading(false);
  };

  // 📱 ACTUALIZAR CONTACTOS
  const updateContacts = useCallback((contacts, primaryContact) => {
    setEmergencyConfig(prev => ({
      ...prev,
      contacts,
      primaryContact
    }));
  }, []);

  // 💬 ACTUALIZAR MENSAJE
  const updateMessage = useCallback((message) => {
    setEmergencyConfig(prev => ({ ...prev, message }));
  }, []);

  // ⚙️ GUARDAR CONFIGURACIÓN
  const saveConfig = async (newConfig) => {
    try {
      await EmergencyServices.saveEmergencyConfig(user.uid, newConfig);
      setEmergencyConfig(newConfig);
      setShowConfigModal(false);
      Alert.alert('✅', 'Configuración guardada correctamente');
    } catch (_error) {
      Alert.alert('❌', 'Error guardando configuración');
    }
  };

  // 🛑 CANCELAR EMERGENCIA ACTIVA
  const cancelActiveEmergency = async (emergencyId) => {
    Alert.alert(
      'Cancelar Emergencia',
      '¿Estás seguro de que quieres cancelar esta emergencia?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Sí, Cancelar', 
          onPress: async () => {
            try {
              await EmergencyServices.cancelEmergency(user.uid, emergencyId);
              
              // 🔄 RESETEAR ESTADOS DEL BOTÓN PARA EVITAR QUE SE PONGA VERDE
              setWorkflowProgress(null);
              setActiveEmergency(null);
              setEmergencyCompleted(false);
              
              loadEmergencyHistory();
              Alert.alert('✅', 'Emergencia cancelada');
            } catch (_error) {
              Alert.alert('❌', 'Error cancelando emergencia');
            }
          }
        }
      ]
    );
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>🚨 Emergencia</Title>
        <ConfigButton onPress={() => setShowConfigModal(true)}>
          <ConfigText>⚙️</ConfigText>
        </ConfigButton>
      </HeaderContainer>

      {/* 🚨 BOTÓN PRINCIPAL DE EMERGENCIA */}
      <EmergencyButton
        onPress={activateEmergency}
        isLoading={isLoading}
        disabled={!emergencyConfig || !emergencyConfig.contacts || emergencyConfig.contacts.length === 0}
        workflowProgress={workflowProgress}
        activeEmergency={activeEmergency}
      />

      {/* 📊 ESTADO DE CONFIGURACIÓN */}
      <StatusContainer>
        <StatusTitle>Estado de Configuración</StatusTitle>
        
        <StatusItem>
          <StatusIcon>{emergencyConfig?.contacts?.length > 0 ? '✅' : '❌'}</StatusIcon>
          <StatusText>
            Contactos: {emergencyConfig?.contacts?.length || 0} configurados
          </StatusText>
        </StatusItem>


        <StatusItem>
          <StatusIcon>{emergencyConfig?.message ? '✅' : '❌'}</StatusIcon>
          <StatusText>
            Mensaje personalizado: {emergencyConfig?.message ? 'Configurado' : 'No configurado'}
          </StatusText>
        </StatusItem>
      </StatusContainer>

      {/* 📋 HISTORIAL DE EMERGENCIAS */}
      {emergencyHistory.length > 0 && (
        <HistoryContainer>
          <HistoryTitle>Historial de Emergencias</HistoryTitle>
          <FlatList
            data={emergencyHistory.slice(0, 5)} // Mostrar solo las últimas 5
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <HistoryItem>
                <HistoryDate>
                  {item.timestamp?.toDate?.()?.toLocaleString() || 'Fecha no disponible'}
                </HistoryDate>
                <HistoryStatus status={item.status}>
                  {item.status === 'active' ? '🟢 Activa' : 
                   item.status === 'cancelled' ? '🟡 Cancelada' : '🔴 Finalizada'}
                </HistoryStatus>
                {item.status === 'active' && (
                  <CancelButton onPress={() => cancelActiveEmergency(item.id)}>
                    <CancelText>Cancelar</CancelText>
                  </CancelButton>
                )}
              </HistoryItem>
            )}
          />
        </HistoryContainer>
      )}

      {/* ⚙️ MODAL DE CONFIGURACIÓN COMPACTO */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={showConfigModal}
        onRequestClose={() => setShowConfigModal(false)}
      >
        <ModalOverlay>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>⚙️ Configuración de Emergencia</ModalTitle>
              <CloseButton onPress={() => setShowConfigModal(false)}>
                <CloseButtonText>✕</CloseButtonText>
              </CloseButton>
            </ModalHeader>
            
            <ScrollView 
              style={{ maxHeight: '70%' }}
              showsVerticalScrollIndicator={true}
            >
              <ContactSelector
                selectedContacts={emergencyConfig?.contacts || []}
                primaryContact={emergencyConfig?.primaryContact}
                onContactsChange={updateContacts}
              />

              <MessageEditor
                message={emergencyConfig?.message || ''}
                onMessageChange={updateMessage}
              />
            </ScrollView>

            <ConfigActions>
              <CancelConfigButton onPress={() => setShowConfigModal(false)}>
                <CancelConfigText>Cancelar</CancelConfigText>
              </CancelConfigButton>
              
              <SaveConfigButton onPress={() => saveConfig(emergencyConfig)}>
                <SaveConfigText>Guardar</SaveConfigText>
              </SaveConfigButton>
            </ConfigActions>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* 🚨 MODAL DE EMERGENCIA ACTIVA CON PROGRESO */}
      <Modal 
        animationType="fade" 
        transparent={true} 
        visible={showEmergencyModal}
        onRequestClose={closeEmergencyModal}
      >
        <EmergencyModalOverlay>
          <EmergencyModalContent>
            {/* 🚪 BOTÓN DE CERRAR SIEMPRE VISIBLE */}
            <CloseEmergencyButton onPress={closeEmergencyModal}>
              <CloseEmergencyText>✕</CloseEmergencyText>
            </CloseEmergencyButton>

            {emergencyCompleted ? (
              // 🎉 ESTADO DE ÉXITO CUANDO EL USUARIO REGRESA
              <>
                <EmergencyTitle>¡EMERGENCIA NOTIFICADA!</EmergencyTitle>
                <EmergencyText>
                  ✅ Se ha enviado tu ubicación y se ha contactado a tus contactos de emergencia.
                </EmergencyText>
                <SuccessMessage>
                  La emergencia se ha procesado completamente. Este mensaje se cerrará automáticamente en 5 segundos...
                </SuccessMessage>
                <LoadingIndicator>
                  <Text style={{ color: 'white', fontSize: 16 }}>
                    ✅ Proceso completado exitosamente
                  </Text>
                </LoadingIndicator>
              </>
            ) : (
              // 🔄 ESTADO DE PROCESAMIENTO NORMAL
              <>
                <EmergencyTitle>🚨 EMERGENCIA ACTIVADA</EmergencyTitle>
                <EmergencyText>
                  Se está enviando tu ubicación y contactando a tus contactos de emergencia...
                </EmergencyText>
                
                {/* PROGRESO DEL WORKFLOW */}
                {workflowProgress && (
                  <WorkflowProgressContainer>
                    <ProgressTitle>Progreso de la Emergencia:</ProgressTitle>
                    
                    <ProgressStep 
                      completed={workflowProgress.workflow.messagesStatus === 'completed'}
                      inProgress={workflowProgress.workflow.messagesStatus === 'in_progress'}
                    >
                      <StepIcon>
                        {workflowProgress.workflow.messagesStatus === 'completed' ? '✅' : 
                         workflowProgress.workflow.messagesStatus === 'in_progress' ? '⏳' : '⏸️'}
                      </StepIcon>
                      <StepText>Enviando mensajes a contactos</StepText>
                    </ProgressStep>
                    
                    {emergencyConfig?.autoCall && emergencyConfig?.primaryContact && (
                      <ProgressStep 
                        completed={workflowProgress.workflow.callStatus === 'completed'}
                        inProgress={workflowProgress.workflow.callStatus === 'in_progress'}
                      >
                        <StepIcon>
                          {workflowProgress.workflow.callStatus === 'completed' ? '✅' : 
                           workflowProgress.workflow.callStatus === 'in_progress' ? '⏳' : '⏸️'}
                        </StepIcon>
                        <StepText>Realizando llamada automática</StepText>
                      </ProgressStep>
                    )}
                    
                    {workflowProgress.workflow.workflowStatus === 'completed' && (
                      <CompletedMessage>
                         ¡Emergencia Alertada!
                      </CompletedMessage>
                    )}
                  </WorkflowProgressContainer>
                )}
                
                <LoadingIndicator>
                  <Text style={{ color: 'white', fontSize: 16 }}>
                    {workflowProgress?.workflow.workflowStatus === 'completed' ? 
                      '✅ Completado' : '⏳ Procesando...'}
                  </Text>
                </LoadingIndicator>
              </>
            )}
          </EmergencyModalContent>
        </EmergencyModalOverlay>
      </Modal>
    </Container>
  );
};

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #FAF9EE;
`;

const HeaderContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 25px;
  background-color: #ECEEDF;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  margin-bottom: 20px;
`;

const BackButton = styled.TouchableOpacity`
  padding: 10px;
`;

const BackText = styled.Text`
  color: #26667F;
  font-size: 20px;
  font-weight: bold;
`;

const Title = styled.Text`
  color: #26667F;
  font-size: 20px;
  font-weight: bold;
  flex: 1;
  text-align: center;
`;

const ConfigButton = styled.TouchableOpacity`
  padding: 10px;
`;

const ConfigText = styled.Text`
  color: #26667F;
  font-size: 20px;
`;

const StatusContainer = styled.View`
  background-color: white;
  margin: 20px;
  padding: 20px;
  border-radius: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const StatusTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const StatusItem = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
`;

const StatusIcon = styled.Text`
  font-size: 16px;
  margin-right: 10px;
`;

const StatusText = styled.Text`
  font-size: 14px;
  color: #7f8c8d;
  flex: 1;
`;

const HistoryContainer = styled.View`
  background-color: white;
  margin: 20px;
  padding: 20px;
  border-radius: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const HistoryTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const HistoryItem = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom-width: 1px;
  border-bottom-color: #ecf0f1;
`;

const HistoryDate = styled.Text`
  font-size: 12px;
  color: #7f8c8d;
  flex: 1;
`;

const HistoryStatus = styled.Text`
  font-size: 12px;
  font-weight: bold;
  color: ${props => 
    props.status === 'active' ? '#e74c3c' : 
    props.status === 'cancelled' ? '#f39c12' : '#27ae60'
  };
  margin-right: 10px;
`;

const CancelButton = styled.TouchableOpacity`
  background-color: #e74c3c;
  padding: 5px 10px;
  border-radius: 5px;
`;

const CancelText = styled.Text`
  color: white;
  font-size: 10px;
  font-weight: bold;
`;

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.View`
  background-color: white;
  border-radius: 15px;
  padding: 20px;
  width: 95%;
  max-width: 400px;
  max-height: 85%;
`;

const ModalHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #26667F;
  flex: 1;
`;

const CloseButton = styled.TouchableOpacity`
  width: 30px;
  height: 30px;
  border-radius: 15px;
  background-color: #e74c3c;
  align-items: center;
  justify-content: center;
`;

const CloseButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
`;

const ConfigActions = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 20px;
`;

const CancelConfigButton = styled.TouchableOpacity`
  flex: 1;
  background-color: #e74c3c;
  padding: 15px;
  border-radius: 10px;
  margin-right: 10px;
  align-items: center;
`;

const CancelConfigText = styled.Text`
  color: white;
  font-weight: 600;
`;

const SaveConfigButton = styled.TouchableOpacity`
  flex: 1;
  background-color: #27ae60;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
`;

const SaveConfigText = styled.Text`
  color: white;
  font-weight: 600;
`;

const EmergencyModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(231, 76, 60, 0.9);
  justify-content: center;
  align-items: center;
`;

const EmergencyModalContent = styled.View`
  background-color: #e74c3c;
  padding: 40px;
  border-radius: 20px;
  align-items: center;
  margin: 20px;
`;

const EmergencyTitle = styled.Text`
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
`;

const EmergencyText = styled.Text`
  color: white;
  font-size: 16px;
  text-align: center;
  margin-bottom: 20px;
`;

const LoadingIndicator = styled.View`
  padding: 20px;
`;

const WorkflowProgressContainer = styled.View`
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
  margin: 20px 0;
`;

const ProgressTitle = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
`;

const ProgressStep = styled.View`
  flex-direction: row;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px;
  background-color: ${props => 
    props.completed ? 'rgba(46, 204, 113, 0.3)' : 
    props.inProgress ? 'rgba(241, 196, 15, 0.3)' : 
    'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
`;

const StepIcon = styled.Text`
  font-size: 18px;
  margin-right: 10px;
`;

const StepText = styled.Text`
  color: white;
  font-size: 14px;
  flex: 1;
`;

const CompletedMessage = styled.Text`
  color: #2ecc71;
  font-size: 16px;
  font-weight: bold;
  text-align: center;
  margin-top: 10px;
  padding: 10px;
  background-color: rgba(46, 204, 113, 0.2);
  border-radius: 8px;
`;

const SuccessMessage = styled.Text`
  color: white;
  font-size: 14px;
  text-align: center;
  margin-bottom: 20px;
  opacity: 0.9;
`;

const CloseEmergencyButton = styled.TouchableOpacity`
  position: absolute;
  top: 15px;
  right: 15px;
  width: 35px;
  height: 35px;
  border-radius: 17.5px;
  background-color: rgba(255, 255, 255, 0.2);
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const CloseEmergencyText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

export default EmergenciaScreen;
