import React, { useState, useEffect } from 'react';
import { TouchableOpacity, FlatList, Text, View, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import styled from 'styled-components/native';
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';
import ValueForm from './ValueForm';
import ExportPDF from './PDFexport';
import HealthChart from './HealthChart';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CategoryDetail = () => {
  const { categoryId } = useLocalSearchParams();
  const { user } = useApp();
  const [category, setCategory] = useState(null);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user || !categoryId) return;

    const loadCategory = async () => {
      const docRef = doc(db, 'users', user.uid, 'healthCategories', categoryId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setCategory({ id: docSnap.id, ...docSnap.data() });
      }
    };

    const q = query(
      collection(db, 'users', user.uid, 'healthRecords'),
      where('categoryId', '==', categoryId)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const recordsList = [];
      querySnapshot.forEach((doc) => {
        recordsList.push({ id: doc.id, ...doc.data() });
      });
      recordsList.sort((a, b) => b.date?.toDate() - a.date?.toDate());
      setRecords(recordsList);
    });

    loadCategory();
    return unsubscribe;
  }, [user, categoryId]);

  const deleteRecord = async (recordId, recordValue) => {
    Alert.alert(
      "¿Eliminar registro?",
      `¿Estás segura de eliminar el valor "${recordValue}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid, 'healthRecords', recordId));
              Alert.alert('✅', 'Registro eliminado');
            } catch (error) {
              Alert.alert('❌', 'Error al eliminar');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    setEditValue(record.value.toString());
    setEditNotes(record.notes || '');
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'El valor no puede estar vacío');
      return;
    }

    try {
      await updateDoc(doc(db, 'users', user.uid, 'healthRecords', editingRecord.id), {
        value: editValue.trim(),
        notes: editNotes.trim(),
        updatedAt: new Date()
      });
      
      setIsEditModalVisible(false);
      setEditingRecord(null);
      Alert.alert('✅', 'Registro actualizado correctamente');
    } catch (error) {
      Alert.alert('❌', 'Error al actualizar el registro');
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalVisible(false);
    setEditingRecord(null);
    setEditValue('');
    setEditNotes('');
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>{category ? category.name : 'Cargando...'}</Title>
      </HeaderContainer>

      {category && category.unit && (
        <Text style={{ color: '#7f8c8d', marginBottom: 20 }}>
          Unidad: {category.unit}
        </Text>
      )}

      <AddButton onPress={() => setShowForm(true)}>
        <ButtonText>+ Agregar Valor</ButtonText>
      </AddButton>
      
      <ExportPDF category={category} records={records} />
      <HealthChart records={records} category={category} />

      {showForm && (
        <ValueForm 
          categoryId={categoryId}
          onClose={() => setShowForm(false)}
        />
      )}

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RecordCard>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600' }}>
                {item.value} {category?.unit && ` ${category.unit}`}
              </Text>
              <Text style={{ color: '#7f8c8d', marginTop: 5 }}>
                {item.date?.toDate().toLocaleDateString()}
              </Text>
              {item.notes && (
                <Text style={{ color: '#7f8c8d', marginTop: 5, fontStyle: 'italic' }}>
                  {item.notes}
                </Text>
              )}
            </View>
            
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity 
                onPress={() => openEditModal(item)}
                style={{ padding: 8, marginRight: 5 }}
              >
                <Text style={{ color: '#3498db', fontSize: 18 }}>✏️</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => deleteRecord(item.id, item.value)}
                style={{ padding: 8 }}
              >
                <Text style={{ color: '#e74c3c', fontSize: 18 }}>❌</Text>
              </TouchableOpacity>
            </View>
          </RecordCard>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#7f8c8d', marginTop: 20 }}>
            No hay registros aún
          </Text>
        }     
      />

      {/* Modal de Edición */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ModalOverlay onPress={handleCancelEdit}>
            <ModalContent onPress={(e) => e.stopPropagation()}>
              <ModalTitle>Editar Registro</ModalTitle>
              
              <InputLabel>Valor</InputLabel>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 15,
                  fontSize: 16
                }}
                value={editValue}
                onChangeText={setEditValue}
                placeholder={`Ingresa el valor ${category?.unit ? `en ${category.unit}` : ''}`}
                keyboardType="decimal-pad"
              />
              
              <InputLabel>Notas (opcional)</InputLabel>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  fontSize: 16,
                  minHeight: 80,
                  textAlignVertical: 'top'
                }}
                value={editNotes}
                onChangeText={setEditNotes}
                placeholder="Agregar notas adicionales"
                multiline={true}
                numberOfLines={3}
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

// Styled Components
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

const RecordCard = styled.View`
  background-color: white;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  shadow-color: #000;
  shadow-offset: 0px 1px;
  shadow-opacity: 0.1;
  shadow-radius: 2px;
  elevation: 2;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

// Modal Styles
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

export default CategoryDetail;