import React from 'react';
import { ActivityIndicator } from 'react-native';
import styled from 'styled-components/native';

export const EmergencyButton = ({ onPress, isLoading, disabled, workflowProgress, activeEmergency }) => {
  const getButtonState = () => {
    if (disabled) return 'disabled';
    if (isLoading) return 'loading';
    // Solo mostrar estado completado si hay una emergencia activa Y el workflow está completado
    if (activeEmergency && workflowProgress?.workflow.workflowStatus === 'completed') return 'completed';
    return 'ready';
  };

  const buttonState = getButtonState();

  return (
    <EmergencyButtonContainer>
      <EmergencyButtonTouchable
        onPress={onPress}
        disabled={disabled || isLoading}
        style={{
          backgroundColor: buttonState === 'disabled' ? '#95a5a6' : 
                          buttonState === 'completed' ? '#27ae60' : '#e74c3c',
          transform: [{ scale: isLoading ? 0.95 : 1 }]
        }}
      >
        {buttonState === 'loading' ? (
          <LoadingContainer>
            <ActivityIndicator size="large" color="white" />
            <EmergencyButtonText>Activando...</EmergencyButtonText>
          </LoadingContainer>
        ) : buttonState === 'completed' ? (
          <EmergencyButtonContent>
            <EmergencyIcon>✅</EmergencyIcon>
            <EmergencyButtonText>EMERGENCIA ENVIADA</EmergencyButtonText>
            <EmergencySubText>Mensajes y llamadas procesadas</EmergencySubText>
          </EmergencyButtonContent>
        ) : (
          <EmergencyButtonContent>
            <EmergencyIcon>🚨</EmergencyIcon>
            <EmergencyButtonText>ACTIVAR EMERGENCIA</EmergencyButtonText>
            <EmergencySubText>Presiona para enviar ubicación y contactar ayuda</EmergencySubText>
          </EmergencyButtonContent>
        )}
      </EmergencyButtonTouchable>
      
      {disabled && (
        <DisabledMessage>
          ⚠️ Configura primero tus contactos de emergencia
        </DisabledMessage>
      )}
      
      {workflowProgress && workflowProgress.workflow.workflowStatus !== 'completed' && (
        <WorkflowStatusMessage>
          🔄 Procesando emergencia...
        </WorkflowStatusMessage>
      )}
    </EmergencyButtonContainer>
  );
};

// Styled Components
const EmergencyButtonContainer = styled.View`
  align-items: center;
  margin: 20px;
`;

const EmergencyButtonTouchable = styled.TouchableOpacity`
  width: 100%;
  max-width: 350px;
  padding: 30px;
  border-radius: 20px;
  shadow-color: #000;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.3;
  shadow-radius: 8px;
  elevation: 8;
`;

const EmergencyButtonContent = styled.View`
  align-items: center;
`;

const LoadingContainer = styled.View`
  align-items: center;
`;

const EmergencyIcon = styled.Text`
  font-size: 50px;
  margin-bottom: 10px;
`;

const EmergencyButtonText = styled.Text`
  color: white;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 5px;
`;

const EmergencySubText = styled.Text`
  color: white;
  font-size: 12px;
  text-align: center;
  opacity: 0.9;
`;

const DisabledMessage = styled.Text`
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
  font-weight: 600;
`;

const WorkflowStatusMessage = styled.Text`
  color: #f39c12;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
  font-weight: 600;
`;
