import { router } from 'expo-router';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Linking, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';

const EmergencyContactScreen = () => {
  const { user } = useApp();
  const [contacts, setContacts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "emergencyContacts"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const contactsList = [];
      querySnapshot.forEach((doc) => {
        contactsList.push({ id: doc.id, ...doc.data() });
      });
      setContacts(contactsList);
    });

    return unsubscribe;
  }, [user]);

  // 📞 LLAMAR DIRECTAMENTE - SOLO 1 CLICK!
  const callNumber = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => {
      Alert.alert('Error', 'No se puede realizar la llamada');
    });
  };

  // ✅ AGREGAR CONTACTO RÁPIDO
  const handleAddContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Nombre y teléfono son obligatorios');
      return;
    }

    try {
      await addDoc(collection(db, "users", user.uid, "emergencyContacts"), {
        name: name.trim(),
        phone: phone.trim(),
        userId: user.uid,
        createdAt: new Date(),
      });

      Alert.alert('✅', 'Contacto agregado');
      setIsModalVisible(false);
      setName('');
      setPhone('');
    } catch (error) {
      Alert.alert('❌', 'Error al agregar contacto');
    }
  };

  // ✏️ EDITAR CONTACTO
  const handleEditContact = async () => {
    if (!name.trim() || !phone.trim()) {
      Alert.alert('Error', 'Nombre y teléfono son obligatorios');
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid, "emergencyContacts", editingContact.id), {
        name: name.trim(),
        phone: phone.trim(),
        updatedAt: new Date(),
      });

      Alert.alert('✅', 'Contacto actualizado');
      setIsEditModalVisible(false);
      setEditingContact(null);
      setName('');
      setPhone('');
    } catch (error) {
      Alert.alert('❌', 'Error al actualizar contacto');
    }
  };

  // 🗑️ ELIMINAR CONTACTO
  const deleteContact = (contactId, contactName) => {
    Alert.alert(
      "¿Eliminar contacto?",
      `¿Estás segura de eliminar a "${contactName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", user.uid, "emergencyContacts", contactId));
              Alert.alert('✅', 'Contacto eliminado');
            } catch (error) {
              Alert.alert('❌', 'Error al eliminar');
            }
          }
        }
      ]
    );
  };

  // 📝 ABRIR MODAL DE EDICIÓN
  const openEditModal = (contact) => {
    setEditingContact(contact);
    setName(contact.name);
    setPhone(contact.phone);
    setIsEditModalVisible(true);
  };

  // ❌ CERRAR MODALES
  const closeModals = () => {
    setIsModalVisible(false);
    setIsEditModalVisible(false);
    setEditingContact(null);
    setName('');
    setPhone('');
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Llamada Rápida</Title>
      </HeaderContainer>

      {/* 📞 BOTÓN GRANDE PARA AGREGAR CONTACTO */}
      <TouchableOpacity 
        onPress={() => setIsModalVisible(true)}
        style={{
          backgroundColor: '#1679AB',
          padding: 20,
          borderRadius: 15,
          alignItems: 'center',
          margin: 20,
        }}
      >
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
          📞 Agregar Contacto de Emergencia
        </Text>
      </TouchableOpacity>

      {/* 📋 LISTA DE CONTACTOS - CLICK DIRECTO PARA LLAMAR */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContactCard onPress={() => callNumber(item.phone)}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#2c3e50" }}>
                {item.name}
              </Text>
              <Text style={{ color: "#e74c3c", fontSize: 16, marginTop: 5 }}>
                {item.phone}
              </Text>
            </View>
            
            <View style={{ flexDirection: "row" }}>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  openEditModal(item);
                }}
                style={{ padding: 10, marginRight: 5 }}
              >
                <Text style={{ color: '#3498db', fontSize: 18 }}>✏️</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  deleteContact(item.id, item.name);
                }}
                style={{ padding: 10 }}
              >
                <Text style={{ color: '#e74c3c', fontSize: 18 }}>❌</Text>
              </TouchableOpacity>
            </View>
          </ContactCard>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#7f8c8d", marginTop: 20 }}>
            No hay contactos de emergencia
          </Text>
        }
      />

      {/* 📝 MODAL PARA AGREGAR CONTACTO */}
      <Modal animationType="slide" transparent={true} visible={isModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ModalOverlay onPress={closeModals}>
            <ModalContent>
              <ModalTitle>Agregar Contacto de Emergencia</ModalTitle>
              
              <TextInput
                style={inputStyle}
                placeholder="Nombre del contacto"
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                style={inputStyle}
                placeholder="Número de teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  onPress={closeModals}
                  style={{ flex: 1, backgroundColor: '#e74c3c', padding: 15, borderRadius: 10, marginRight: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleAddContact}
                  style={{ flex: 1, backgroundColor: '#386641', padding: 15, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>

      {/* ✏️ MODAL PARA EDITAR CONTACTO */}
      <Modal animationType="slide" transparent={true} visible={isEditModalVisible}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ModalOverlay onPress={closeModals}>
            <ModalContent>
              <ModalTitle>Editar Contacto de Emergencia</ModalTitle>
              
              <TextInput
                style={inputStyle}
                placeholder="Nombre del contacto"
                value={name}
                onChangeText={setName}
              />
              
              <TextInput
                style={inputStyle}
                placeholder="Número de teléfono"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity 
                  onPress={closeModals}
                  style={{ flex: 1, backgroundColor: '#e74c3c', padding: 15, borderRadius: 10, marginRight: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleEditContact}
                  style={{ flex: 1, backgroundColor: '#386641', padding: 15, borderRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Actualizar</Text>
                </TouchableOpacity>
              </View>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>
    </Container>
  );
};

// Styled Components (manteniendo tu estilo)
const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #FAF9EE;
`;

const HeaderContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 25px;
  background-color: #ECEEDF;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  margin-bottom: 15px;
`;

const BackButton = styled.TouchableOpacity`
  margin-right: 40px;
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
  text-align: center;
`;

const ContactCard = styled.TouchableOpacity`
  background-color: white;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.View`
  background-color: white;
  border-radius: 15px;
  padding: 25px;
  width: 100%;
  max-width: 400px;
`;

const ModalTitle = styled.Text`
  font-size: 20px;
  font-weight: bold;
  color: #26667F;
  margin-bottom: 20px;
  text-align: center;
`;

const inputStyle = {
  borderWidth: 1,
  borderColor: "#ddd",
  borderRadius: 8,
  padding: 12,
  marginBottom: 15,
  fontSize: 16,
};

export default EmergencyContactScreen;