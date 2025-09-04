import React, { useState, useEffect } from 'react';
import { TouchableOpacity, FlatList, Text, View, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HealthScreen = () => {
  const { user } = useApp();
  const [categories, setCategories] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'healthCategories'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const categoriesList = [];
      querySnapshot.forEach((doc) => {
        categoriesList.push({ id: doc.id, ...doc.data() });
      });
      setCategories(categoriesList);
    });

    return unsubscribe;
  }, [user]);

  const deleteCategory = async (categoryId, categoryName) => {
    Alert.alert(
      "¿Eliminar categoría?",
      `¿Estás segura de eliminar "${categoryName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid, 'healthCategories', categoryId));
              Alert.alert('✅', 'Categoría eliminada');
            } catch (error) {
              Alert.alert('❌', 'Error al eliminar');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setEditName(category.name);
    setEditUnit(category.unit || '');
    setIsModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'healthCategories', editingCategory.id), {
        name: editName.trim(),
        unit: editUnit.trim(),
        updatedAt: new Date()
      });
      
      setIsModalVisible(false);
      setEditingCategory(null);
      Alert.alert('✅', 'Categoría actualizada');
    } catch (error) {
      Alert.alert('❌', 'Error al actualizar');
    }
  };

  const handleCancelEdit = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    setEditName('');
    setEditUnit('');
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Registro de Salud</Title>
      </HeaderContainer>

      <AddButton onPress={() => router.push('/(RegistroSalud)/add-category')}>
        <ButtonText>+ Agregar Categoría</ButtonText>
      </AddButton>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CategoryCard onPress={() => router.push(`/(RegistroSalud)/${item.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#2c3e50' }}>
                {item.name}
              </Text>
              {item.unit && (
                <Text style={{ color: '#7f8c8d', marginTop: 5 }}>
                  Unidad: {item.unit}
                </Text>
              )}
            </View>
            
            {/* ✅ BOTONES DE EDICIÓN Y ELIMINACIÓN */}
            <View style={{ flexDirection: 'row' }}>
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
                  deleteCategory(item.id, item.name);
                }}
                style={{ padding: 10 }}
              >
                <Text style={{ color: '#e74c3c', fontSize: 18 }}>❌</Text>
              </TouchableOpacity>
            </View>
          </CategoryCard>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#7f8c8d', marginTop: 20 }}>
            No hay categorías aún
          </Text>
        }     
      />

      {/* ✅ MODAL DE EDICIÓN */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ModalOverlay onPress={handleCancelEdit}>
            <ModalContent onPress={(e) => e.stopPropagation()}>
              <ModalTitle>Editar Categoría</ModalTitle>
              
              <InputLabel>Nombre de la categoría *</InputLabel>
              <TextInput
                style={inputStyle}
                value={editName}
                onChangeText={setEditName}
                placeholder="Nombre de la categoría"
              />
              
              <InputLabel>Unidad de medida (opcional)</InputLabel>
              <TextInput
                style={inputStyle}
                value={editUnit}
                onChangeText={setEditUnit}
                placeholder="Ej: kg, mmHg, etc."
              />
              
              <ButtonContainer>
                <CancelButton onPress={handleCancelEdit}>
                  <ButtonTextWhite>Cancelar</ButtonTextWhite>
                </CancelButton>
                
                <SaveButton onPress={handleSaveEdit}>
                  <ButtonTextWhite>Guardar</ButtonTextWhite>
                </SaveButton>
              </ButtonContainer>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>
    </Container>
  );
};

// ✅ Agrega estos styled components al final
const inputStyle = {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  padding: 12,
  marginBottom: 15,
  fontSize: 16
};

const ModalOverlay = styled.TouchableOpacity`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const ModalContent = styled.TouchableOpacity`
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

const InputLabel = styled.Text`
  font-size: 16px;
  color: #2c3e50;
  margin-bottom: 8px;
  font-weight: 500;
`;

const ButtonContainer = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 10px;
`;

const CancelButton = styled.TouchableOpacity`
  background-color: #e74c3c;
  padding: 15px;
  border-radius: 10px;
  flex: 1;
  margin-right: 10px;
  align-items: center;
`;

const SaveButton = styled.TouchableOpacity`
  background-color: #386641;
  padding: 15px;
  border-radius: 10px;
  flex: 1;
  margin-left: 10px;
  align-items: center;
`;

const ButtonTextWhite = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;
// Styled Components con el mismo estilo que tu app
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

const AddButton = styled.TouchableOpacity`
  background-color: #26667F;
  padding: 15px;
  border-radius: 10px;
  align-items: center;
  margin-bottom: 20px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 16px;
  font-weight: 600;
`;

const CategoryCard = styled.TouchableOpacity`
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

export default HealthScreen;