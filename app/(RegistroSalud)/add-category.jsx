import React, { useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';




const AddCategoryScreen = () => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useApp();
  const insets = useSafeAreaInsets();

  const handleAddCategory = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre para la categoría');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'users', user.uid, 'healthCategories'), {
        name: name.trim(),
        unit: unit.trim(),
        userId: user.uid,
        createdAt: new Date(),
        type: 'number'
      });
      
      Alert.alert('Éxito', 'Categoría agregada correctamente');
      router.back();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <Container>

         <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Agregar Categoría</Title>
      </HeaderContainer>
      <Input
        placeholder="Nombre de la categoría (ej. Presión arterial)"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#999"
      />
      
      <Input
        placeholder="Unidad de medida (ej. mmHg, mg/dL, kg)"
        value={unit}
        onChangeText={setUnit}
        placeholderTextColor="#999"
      />
      
      <Button onPress={handleAddCategory} disabled={loading}>
        <ButtonText>
          {loading ? 'Agregando...' : 'Agregar Categoría'}
        </ButtonText>
      </Button>
    </Container>
  );
};

export default AddCategoryScreen;

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: #FAF9EE;
`;

const Input = styled.TextInput`
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  background-color: #154D71;
  padding: 18px;
  border-radius: 10px;
  align-items: center;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
`;

const HeaderContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 25px;
  background-color: #ECEEDF;
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  margin-bottom: 20px;
`;

const BackButton = styled.TouchableOpacity`
  margin-right: 40px;
  align-self: flex-start;
  text-align: center;
  font-size: 40px;
`;

const BackText = styled.Text`
  color: #26667F;
   font-size: 20px;
  font-weight: bold;
  flex: 1;


`;
const Title = styled.Text`
  color: #26667F;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
`;