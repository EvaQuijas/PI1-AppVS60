import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import styled from 'styled-components/native';

export const MessageEditor = ({ message, onMessageChange }) => {
  const [customMessage, setCustomMessage] = useState(message);
  const [showTemplates, setShowTemplates] = useState(false);

  // 📝 PLANTILLAS PREDEFINIDAS DE EMERGENCIA
  const emergencyTemplates = [
    {
      id: 'basic',
      title: 'Emergencia Básica',
      message: '! Necesito ayuda inmediatamente. Por favor, contacta conmigo.'
    },
    {
      id: 'medical',
      title: 'Emergencia Médica',
      message: '¡EMERGENCIA MÉDICA! Necesito ayuda médica urgente. Por favor, contacta conmigo y llama a una ambulancia si es necesario.'
    },
    {
      id: 'accident',
      title: 'Accidente',
      message: '¡ACCIDENTE! He tenido un accidente y necesito ayuda. Por favor, contacta conmigo inmediatamente.'
    },
    {
      id: 'safety',
      title: 'Problema de Seguridad',
      message: '¡PROBLEMA DE SEGURIDAD! Me siento en peligro y necesito ayuda. Por favor, contacta conmigo urgentemente.'
    },
    {
      id: 'location',
      title: 'Perdido/Desorientado',
      message: '¡AYUDA! Estoy perdido/desorientado y necesito que me encuentren. Por favor, contacta conmigo.'
    }
  ];


  // ✏️ ACTUALIZAR MENSAJE PERSONALIZADO
  const updateMessage = (text) => {
    setCustomMessage(text);
    onMessageChange(text);
  };

  // 🔄 RESTABLECER MENSAJE POR DEFECTO
  const resetToDefault = () => {
    const defaultMessage = emergencyTemplates[0].message;
    setCustomMessage(defaultMessage);
    onMessageChange(defaultMessage);
  };

  return (
    <MessageEditorContainer>
      <SectionTitle>💬 Mensaje de Emergencia</SectionTitle>
      
      {/* 📝 EDITOR DE MENSAJE COMPACTO */}
      <MessageInputContainer>
        <MessageInput
          value={customMessage}
          onChangeText={updateMessage}
          placeholder="Escribe tu mensaje de emergencia..."
          multiline={true}
          numberOfLines={3}
          textAlignVertical="top"
        />
        <CharacterCount>
          {customMessage.length} caracteres
        </CharacterCount>
      </MessageInputContainer>

      {/* 📋 BOTÓN DE PLANTILLAS COMPACTO */}
      <TemplatesButton onPress={() => setShowTemplates(!showTemplates)}>
        <TemplatesButtonText>
          📋 {showTemplates ? 'Ocultar' : 'Mostrar'} Plantillas
        </TemplatesButtonText>
      </TemplatesButton>

      {/* 📋 PLANTILLAS PREDEFINIDAS COMPACTAS */}
      {showTemplates && (
        <TemplatesContainer>
          <TemplatesTitle>Plantillas:</TemplatesTitle>
          
          <ScrollView style={{ maxHeight: 150 }}>
            {emergencyTemplates.map((template) => (
              <TemplateItem key={template.id}>
                <TemplateHeader>
                  <TemplateTitle>{template.title}</TemplateTitle>
                  <UseTemplateButton onPress={() => {
                    setCustomMessage(template.message);
                    onMessageChange(template.message);
                    setShowTemplates(false);
                  }}>
                    <UseTemplateText>Usar</UseTemplateText>
                  </UseTemplateButton>
                </TemplateHeader>
                <TemplatePreview>{template.message}</TemplatePreview>
              </TemplateItem>
            ))}
          </ScrollView>
        </TemplatesContainer>
      )}

      {/* 🔄 BOTÓN DE RESTABLECER COMPACTO */}
      <ResetButton onPress={resetToDefault}>
        <ResetButtonText>🔄 Restablecer</ResetButtonText>
      </ResetButton>
    </MessageEditorContainer>
  );
};

// Styled Components
const MessageEditorContainer = styled.View`
  margin-bottom: 15px;
`;

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const MessageInputContainer = styled.View`
  margin-bottom: 10px;
`;

const MessageInput = styled.TextInput`
  border-width: 1px;
  border-color: #ddd;
  border-radius: 8px;
  padding: 12px;
  font-size: 15px;
  min-height: 80px;
  background-color: white;
`;

const CharacterCount = styled.Text`
  color: #7f8c8d;
  font-size: 11px;
  text-align: right;
  margin-top: 4px;
`;

const TemplatesButton = styled.TouchableOpacity`
  background-color: #3498db;
  padding: 10px;
  border-radius: 6px;
  align-items: center;
  margin-bottom: 10px;
`;

const TemplatesButtonText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const TemplatesContainer = styled.View`
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
`;

const TemplatesTitle = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
`;

const TemplateItem = styled.View`
  background-color: white;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 8px;
`;

const TemplateHeader = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
`;

const TemplateTitle = styled.Text`
  font-size: 13px;
  font-weight: bold;
  color: #2c3e50;
  flex: 1;
`;

const UseTemplateButton = styled.TouchableOpacity`
  background-color: #27ae60;
  padding: 4px 8px;
  border-radius: 4px;
`;

const UseTemplateText = styled.Text`
  color: white;
  font-size: 11px;
  font-weight: bold;
`;

const TemplatePreview = styled.Text`
  color: #7f8c8d;
  font-size: 11px;
  line-height: 14px;
`;

const ResetButton = styled.TouchableOpacity`
  background-color: #95a5a6;
  padding: 10px;
  border-radius: 6px;
  align-items: center;
`;

const ResetButtonText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;
