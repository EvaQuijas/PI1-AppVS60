import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useApp } from '../context/AppContext';
import { ContactSelector } from './components/ContactSelector';
import { MessageEditor } from './components/MessageEditor';
import { EmergencyServices } from './utils/emergencyServices';

const EmergenciaConfigScreen = () => {
  const { user } = useApp();
  const [emergencyConfig, setEmergencyConfig] = useState({
    message: '¡EMERGENCIA! Necesito ayuda inmediatamente. Por favor, contacta conmigo.',
    autoCall: true,
    contacts: [],
    primaryContact: null,
    userId: user?.uid
  });
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) {
      loadEmergencyConfig();
    }
  }, [user, loadEmergencyConfig]);

  // 📋 CARGAR CONFIGURACIÓN EXISTENTE
  const loadEmergencyConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const config = await EmergencyServices.getEmergencyConfig(user.uid);
      if (config) {
        setEmergencyConfig(config);
      }
    } catch (_error) {
      console.error('Error cargando configuración:', _error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 💾 GUARDAR CONFIGURACIÓN
  const saveConfig = async () => {
    try {
      setIsLoading(true);
      await EmergencyServices.saveEmergencyConfig(user.uid, emergencyConfig);
      Alert.alert('✅', 'Configuración guardada correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (_error) {
      Alert.alert('❌', 'Error guardando configuración');
    } finally {
      setIsLoading(false);
    }
  };

  // 📞 ACTUALIZAR CONFIGURACIÓN DE LLAMADA AUTOMÁTICA
  const toggleAutoCall = () => {
    setEmergencyConfig(prev => ({
      ...prev,
      autoCall: !prev.autoCall
    }));
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

  // ✅ VALIDAR CONFIGURACIÓN
  const validateConfig = () => {
    if (!emergencyConfig.contacts || emergencyConfig.contacts.length === 0) {
      Alert.alert('Error', 'Debes seleccionar al menos un contacto de emergencia');
      return false;
    }
    if (!emergencyConfig.message || emergencyConfig.message.trim() === '') {
      Alert.alert('Error', 'Debes escribir un mensaje de emergencia');
      return false;
    }
    return true;
  };

  // 💾 GUARDAR CON VALIDACIÓN
  const handleSave = () => {
    if (validateConfig()) {
      saveConfig();
    }
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>⚙️ Configuración de Emergencia</Title>
        <SaveButton onPress={handleSave} disabled={isLoading}>
          <SaveText>{isLoading ? '⏳' : '💾'}</SaveText>
        </SaveButton>
      </HeaderContainer>

      <ScrollContainer>
        {/* 📞 CONFIGURACIÓN DE LLAMADA AUTOMÁTICA */}
        <ConfigSection>
          <SectionTitle>📞 Llamada Automática</SectionTitle>
          <ConfigItem>
            <ConfigLabel>Realizar llamada automática al contacto principal</ConfigLabel>
            <ToggleButton 
              onPress={toggleAutoCall}
              active={emergencyConfig.autoCall}
            >
              <ToggleText active={emergencyConfig.autoCall}>
                {emergencyConfig.autoCall ? '✅ Activado' : '❌ Desactivado'}
              </ToggleText>
            </ToggleButton>
          </ConfigItem>
          <ConfigDescription>
            Cuando se active la emergencia, se realizará una llamada automática al contacto principal seleccionado.
          </ConfigDescription>
        </ConfigSection>

        {/* 📞 SELECCIÓN DE CONTACTOS */}
        <ContactSelector
          selectedContacts={emergencyConfig.contacts}
          primaryContact={emergencyConfig.primaryContact}
          onContactsChange={updateContacts}
        />

        {/* 💬 EDITOR DE MENSAJE */}
        <MessageEditor
          message={emergencyConfig.message}
          onMessageChange={updateMessage}
        />

        {/* 📊 RESUMEN DE CONFIGURACIÓN */}
        <ConfigSummary>
          <SummaryTitle>📊 Resumen de Configuración</SummaryTitle>
          
          <SummaryItem>
            <SummaryLabel>Contactos seleccionados:</SummaryLabel>
            <SummaryValue>{emergencyConfig.contacts?.length || 0}</SummaryValue>
          </SummaryItem>

          <SummaryItem>
            <SummaryLabel>Contacto principal:</SummaryLabel>
            <SummaryValue>
              {emergencyConfig.primaryContact?.name || 'No configurado'}
            </SummaryValue>
          </SummaryItem>

          <SummaryItem>
            <SummaryLabel>Llamada automática:</SummaryLabel>
            <SummaryValue>
              {emergencyConfig.autoCall ? 'Activada' : 'Desactivada'}
            </SummaryValue>
          </SummaryItem>

          <SummaryItem>
            <SummaryLabel>Mensaje personalizado:</SummaryLabel>
            <SummaryValue>
              {emergencyConfig.message ? 'Configurado' : 'No configurado'}
            </SummaryValue>
          </SummaryItem>
        </ConfigSummary>

        {/* 💾 BOTÓN DE GUARDAR */}
        <SaveConfigButton onPress={handleSave} disabled={isLoading}>
          <SaveConfigText>
            {isLoading ? '⏳ Guardando...' : '💾 Guardar Configuración'}
          </SaveConfigText>
        </SaveConfigButton>
      </ScrollContainer>
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
  font-size: 18px;
  font-weight: bold;
  flex: 1;
  text-align: center;
`;

const SaveButton = styled.TouchableOpacity`
  padding: 10px;
`;

const SaveText = styled.Text`
  color: #26667F;
  font-size: 20px;
`;

const ScrollContainer = styled.ScrollView`
  flex: 1;
  padding: 0 20px;
`;

const ConfigSection = styled.View`
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const SectionTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 15px;
`;

const ConfigItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const ConfigLabel = styled.Text`
  font-size: 16px;
  color: #2c3e50;
  flex: 1;
  margin-right: 15px;
`;

const ToggleButton = styled.TouchableOpacity`
  background-color: ${props => props.active ? '#27ae60' : '#e74c3c'};
  padding: 10px 15px;
  border-radius: 8px;
`;

const ToggleText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 14px;
`;

const ConfigDescription = styled.Text`
  color: #7f8c8d;
  font-size: 14px;
  line-height: 20px;
`;

const ConfigSummary = styled.View`
  background-color: #e8f4fd;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
`;

const SummaryTitle = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #2980b9;
  margin-bottom: 15px;
`;

const SummaryItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const SummaryLabel = styled.Text`
  color: #2980b9;
  font-weight: 600;
  flex: 1;
`;

const SummaryValue = styled.Text`
  color: #2980b9;
  font-weight: bold;
`;

const SaveConfigButton = styled.TouchableOpacity`
  background-color: #27ae60;
  padding: 20px;
  border-radius: 15px;
  align-items: center;
  margin-bottom: 30px;
`;

const SaveConfigText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: bold;
`;

export default EmergenciaConfigScreen;
