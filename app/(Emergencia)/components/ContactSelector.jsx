import {
    collection,
    onSnapshot,
    query,
    where
} from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import styled from 'styled-components/native';
import { db } from '../../config/firebase';
import { useApp } from '../../context/AppContext';

export const ContactSelector = ({ selectedContacts, primaryContact, onContactsChange }) => {
  const { user } = useApp();
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState(
    selectedContacts?.map(contact => contact.id) || []
  );

  useEffect(() => {
    if (user) {
      loadEmergencyContacts();
    }
  }, [user, loadEmergencyContacts]);

  useEffect(() => {
    // Actualizar contactos seleccionados cuando cambien
    const selected = emergencyContacts.filter(contact => 
      selectedContactIds.includes(contact.id)
    );
    onContactsChange(selected, primaryContact);
  }, [selectedContactIds, emergencyContacts, primaryContact, onContactsChange]);

  // 📋 CARGAR CONTACTOS DE EMERGENCIA EXISTENTES
  const loadEmergencyContacts = useCallback(() => {
    const q = query(
      collection(db, "users", user.uid, "emergencyContacts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const contacts = [];
      querySnapshot.forEach((doc) => {
        contacts.push({ id: doc.id, ...doc.data() });
      });
      setEmergencyContacts(contacts);
    });

    return unsubscribe;
  }, [user]);

  // ✅ SELECCIONAR/DESELECCIONAR CONTACTO
  const toggleContact = (contactId) => {
    if (selectedContactIds.includes(contactId)) {
      setSelectedContactIds(selectedContactIds.filter(id => id !== contactId));
    } else {
      setSelectedContactIds([...selectedContactIds, contactId]);
    }
  };

  // 👑 ESTABLECER CONTACTO PRINCIPAL
  const setPrimaryContact = (contact) => {
    onContactsChange(
      emergencyContacts.filter(c => selectedContactIds.includes(c.id)),
      contact
    );
  };

  // ➕ AGREGAR NUEVO CONTACTO
  const addNewContact = () => {
    Alert.alert(
      'Agregar Contacto',
      'Para agregar un nuevo contacto de emergencia, ve al módulo "Llamada Rápida" y agrega el contacto allí. Luego regresa aquí para seleccionarlo.',
      [{ text: 'Entendido' }]
    );
  };

  return (
    <ContactSelectorContainer>
      <SectionTitle>📞 Contactos de Emergencia</SectionTitle>
      
      {emergencyContacts.length === 0 ? (
        <EmptyState>
          <EmptyText>No tienes contactos configurados</EmptyText>
          <AddContactButton onPress={addNewContact}>
            <AddContactText>+ Agregar contactos</AddContactText>
          </AddContactButton>
        </EmptyState>
      ) : (
        <>
          <ContactList>
            {emergencyContacts.map((contact) => (
              <ContactItem key={contact.id}>
                <ContactInfo>
                  <ContactName>{contact.name}</ContactName>
                  <ContactPhone>{contact.phone}</ContactPhone>
                </ContactInfo>
                
                <ContactActions>
                  <SelectButton
                    selected={selectedContactIds.includes(contact.id)}
                    onPress={() => toggleContact(contact.id)}
                  >
                    <SelectText selected={selectedContactIds.includes(contact.id)}>
                      {selectedContactIds.includes(contact.id) ? '✓' : '○'}
                    </SelectText>
                  </SelectButton>
                  
                  {selectedContactIds.includes(contact.id) && (
                    <PrimaryButton
                      isPrimary={primaryContact?.id === contact.id}
                      onPress={() => setPrimaryContact(contact)}
                    >
                      <PrimaryText isPrimary={primaryContact?.id === contact.id}>
                        {primaryContact?.id === contact.id ? '👑' : 'Principal'}
                      </PrimaryText>
                    </PrimaryButton>
                  )}
                </ContactActions>
              </ContactItem>
            ))}
          </ContactList>

          <AddContactButton onPress={addNewContact}>
            <AddContactText>+ Agregar más</AddContactText>
          </AddContactButton>
        </>
      )}

      {/* RESUMEN COMPACTO */}
      {selectedContactIds.length > 0 && (
        <SelectionSummary>
          <SummaryText>
            ✅ {selectedContactIds.length} contacto(s) seleccionado(s)
            {primaryContact && ` • 👑 ${primaryContact.name}`}
          </SummaryText>
        </SelectionSummary>
      )}
    </ContactSelectorContainer>
  );
};

// Styled Components
const ContactSelectorContainer = styled.View`
  margin-bottom: 15px;
`;

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const EmptyState = styled.View`
  align-items: center;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 8px;
`;

const EmptyText = styled.Text`
  color: #7f8c8d;
  text-align: center;
  margin-bottom: 10px;
  font-size: 14px;
`;

const ContactList = styled.View`
  margin-bottom: 10px;
`;

const ContactItem = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #f8f9fa;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
`;

const ContactInfo = styled.View`
  flex: 1;
`;

const ContactName = styled.Text`
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
`;

const ContactPhone = styled.Text`
  font-size: 13px;
  color: #7f8c8d;
  margin-top: 2px;
`;

const ContactActions = styled.View`
  flex-direction: row;
  align-items: center;
`;

const SelectButton = styled.TouchableOpacity`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  background-color: ${props => props.selected ? '#27ae60' : '#ecf0f1'};
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

const SelectText = styled.Text`
  color: ${props => props.selected ? 'white' : '#7f8c8d'};
  font-size: 14px;
  font-weight: bold;
`;

const PrimaryButton = styled.TouchableOpacity`
  background-color: ${props => props.isPrimary ? '#f39c12' : '#3498db'};
  padding: 6px 10px;
  border-radius: 6px;
`;

const PrimaryText = styled.Text`
  color: white;
  font-size: 11px;
  font-weight: bold;
`;

const AddContactButton = styled.TouchableOpacity`
  background-color: #3498db;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
`;

const AddContactText = styled.Text`
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const SelectionSummary = styled.View`
  background-color: #d5f4e6;
  padding: 10px;
  border-radius: 8px;
  margin-top: 8px;
`;

const SummaryText = styled.Text`
  color: #27ae60;
  font-weight: 600;
  font-size: 13px;
`;
