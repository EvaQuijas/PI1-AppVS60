import React, { useState, useEffect } from 'react';
import { TouchableOpacity, FlatList, Text, View, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { collection, query, where, onSnapshot, doc, deleteDoc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';
import ExportPDF from './PDFExportNotes'; // Lo crearemos después
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ExportSinglePDF from './PDFExportSingleNote';

const NotesScreen = () => {
  const { user } = useApp();
  const [notes, setNotes] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'notes'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notesList = [];
      querySnapshot.forEach((doc) => {
        notesList.push({ id: doc.id, ...doc.data() });
      });
      // Ordenar por fecha (más reciente primero)
      notesList.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
      setNotes(notesList);
    });

    return unsubscribe;
  }, [user]);

  const deleteNote = async (noteId, noteTitle) => {
    Alert.alert(
      "¿Eliminar nota?",
      `¿Estás segura de eliminar "${noteTitle}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid, 'notes', noteId));
              Alert.alert('✅', 'Nota eliminada');
            } catch (error) {
              Alert.alert('❌', 'Error al eliminar');
            }
          }
        }
      ]
    );
  };

  const openEditModal = (note = null) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content || '');
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
    }
    setIsModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título no puede estar vacío');
      return;
    }

    try {
      const noteData = {
        title: title.trim(),
        content: content.trim(),
        userId: user.uid,
        updatedAt: new Date()
      };

      if (editingNote) {
        // Actualizar nota existente
        await updateDoc(doc(db, 'users', user.uid, 'notes', editingNote.id), noteData);
        Alert.alert('✅', 'Nota actualizada');
      } else {
        // Crear nueva nota
        noteData.createdAt = new Date();
        await addDoc(collection(db, 'users', user.uid, 'notes'), noteData);
        Alert.alert('✅', 'Nota creada');
      }
      
      setIsModalVisible(false);
      setEditingNote(null);
      setTitle('');
      setContent('');
    } catch (error) {
      Alert.alert('❌', 'Error al guardar la nota');
    }
  };

  const handleCancelEdit = () => {
    setIsModalVisible(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Mis Notas</Title>
      </HeaderContainer>

      <AddButton onPress={() => openEditModal()}>
        <ButtonText>+ Nueva Nota</ButtonText>
      </AddButton>

       <ExportPDF notes={notes} />

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard onPress={() => openEditModal(item)}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#2c3e50', marginBottom: 5 }}>
                {item.title}
              </Text>
              {item.content ? (
                <Text 
                  style={{ color: '#7f8c8d' }}
                  numberOfLines={3}
                  ellipsizeMode="tail"
                >
                  {item.content}
                </Text>
              ) : (
                <Text style={{ color: '#bdc3c7', fontStyle: 'italic' }}>
                  Sin contenido...
                </Text>
              )}
              <Text style={{ color: '#95a5a6', fontSize: 12, marginTop: 10 }}>
                {item.updatedAt?.toDate().toLocaleDateString() || 
                 item.createdAt?.toDate().toLocaleDateString()}
              </Text>
            </View>


            <View style={{ flexDirection: 'row', alignItems: 'center' }}/>
    {/* BOTÓN PARA COMPARTIR ESTA NOTA INDIVIDUALMENTE */}
    <ExportSinglePDF note={item} />

            
            
            <TouchableOpacity 
      onPress={(e) => {
        e.stopPropagation();
        openEditModal(item);
      }}
      style={{ padding: 8, marginRight: 5 }}
    >
      <Text style={{ color: '#3498db', fontSize: 18 }}>✏️</Text>
    </TouchableOpacity>


    <TouchableOpacity 
      onPress={(e) => {
        e.stopPropagation();
        deleteNote(item.id, item.title);
      }}
      style={{ padding: 8 }}
    >

              <Text style={{ color: '#e74c3c', fontSize: 18 }}>❌</Text>
            </TouchableOpacity>
        
            
          </NoteCard>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', color: '#7f8c8d', marginTop: 20 }}>
            No hay notas aún
          </Text>
        }     
      />

      {/* Modal para crear/editar notas */}
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
              <ModalTitle>
                {editingNote ? 'Editar Nota' : 'Nueva Nota'}
              </ModalTitle>
              
              <InputLabel>Título *</InputLabel>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 15,
                  fontSize: 16
                }}
                value={title}
                onChangeText={setTitle}
                placeholder="Título de la nota"
              />
              
              <InputLabel>Contenido</InputLabel>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#ddd',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 20,
                  fontSize: 16,
                  minHeight: 120,
                  textAlignVertical: 'top'
                }}
                value={content}
                onChangeText={setContent}
                placeholder="Escribe el contenido de tu nota aquí..."
                multiline={true}
                numberOfLines={4}
              />
              
              <ButtonContainer>
                <CancelButton onPress={handleCancelEdit}>
                  <ButtonTextWhite>Cancelar</ButtonTextWhite>
                </CancelButton>
                
                <SaveButton onPress={handleSaveNote}>
                  <ButtonTextWhite>
                    {editingNote ? 'Actualizar' : 'Crear'}
                  </ButtonTextWhite>
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

const NoteCard = styled.TouchableOpacity`
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
  align-items: flex-start;
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

export default NotesScreen;