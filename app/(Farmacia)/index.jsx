import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Linking, Alert } from 'react-native';
import styled from 'styled-components/native';

const farmacias = [
  { nombre: 'Farmacia Guadalajara', telefono: '3312345678' },
  { nombre: 'Farmacia Benavides', telefono: '3312345679' },
  { nombre: 'Farmacia San Pablo', telefono: '3312345680' },
];

export default function CompraIndex() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFarmacia, setSelectedFarmacia] = useState(null);

  const abrirModal = (farmacia) => {
    setSelectedFarmacia(farmacia);
    setModalVisible(true);
  };

  const llamar = () => {
    if (!selectedFarmacia) return;
    Linking.openURL(`tel:${selectedFarmacia.telefono}`).catch(() =>
      Alert.alert('Error', 'No se pudo realizar la llamada')
    );
    setModalVisible(false);
  };

  return (
    <Container>
      <Title>Selecciona una Farmacia</Title>

      {farmacias.map((f, index) => (
        <FarmaciaButton key={index} onPress={() => abrirModal(f)}>
          <ButtonText>{f.nombre}</ButtonText>
        </FarmaciaButton>
      ))}

      {/* Modal de contacto */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <ModalOverlay onPress={() => setModalVisible(false)}>
          <ModalContent>
            <ModalTitle>{selectedFarmacia?.nombre}</ModalTitle>
            <ModalText>Teléfono: {selectedFarmacia?.telefono}</ModalText>

            <CallButton onPress={llamar}>
              <CallButtonText>📞 Llamar ahora</CallButtonText>
            </CallButton>

            <CloseButton onPress={() => setModalVisible(false)}>
              <CloseButtonText>Cerrar</CloseButtonText>
            </CloseButton>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Container>
  );
}

// ✅ Estilos con styled-components
const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #FAF9EE;
`;

const Title = styled.Text`
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #26667F;
`;

const FarmaciaButton = styled.TouchableOpacity`
  background-color: #1679AB;
  padding: 18px;
  border-radius: 12px;
  margin-bottom: 15px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0,0,0,0.5);
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.View`
  background-color: white;
  padding: 25px;
  border-radius: 15px;
  width: 85%;
  align-items: center;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #2c3e50;
`;

const ModalText = styled.Text`
  font-size: 16px;
  margin-bottom: 20px;
  color: #555;
`;

const CallButton = styled.TouchableOpacity`
  background-color: #2ecc71;
  padding: 15px 30px;
  border-radius: 10px;
  margin-bottom: 10px;
`;

const CallButtonText = styled.Text`
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const CloseButton = styled.TouchableOpacity`
  margin-top: 10px;
`;

const CloseButtonText = styled.Text`
  color: #e74c3c;
  font-size: 14px;
`;