import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native';
import styled from 'styled-components/native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  background-color: rgba(0,0,0,0.5);
`;

const FormContainer = styled.View`
  background-color: white;
  margin: 20px;
  padding: 20px;
  border-radius: 15px;
`;

const Input = styled.TextInput`
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  background-color: #26667F;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const ValueForm = ({ visible, onClose, categoryId }) => {
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useApp();

  const handleSubmit = async () => {
    if (!value.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'healthRecords'), {
        categoryId: categoryId,
        value: value.trim(),
        notes: notes.trim(),
        date: new Date(),
        userId: user.uid
      });
      
      setValue('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error adding record:', error);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <ModalContainer>
        <FormContainer>
          <Input
            placeholder="Valor (ej. 120/80, 98, 72.5)"
            value={value}
            onChangeText={setValue}
          />
          
          <Input
            placeholder="Notas (opcional)"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          
          <Button onPress={handleSubmit} disabled={loading}>
            <ButtonText>{loading ? 'Guardando...' : 'Guardar'}</ButtonText>
          </Button>
          
          <Button onPress={onClose} style={{ backgroundColor: '#e74c3c' }}>
            <ButtonText>Cancelar</ButtonText>
          </Button>
        </FormContainer>
      </ModalContainer>
    </Modal>
  );
};

export default ValueForm;