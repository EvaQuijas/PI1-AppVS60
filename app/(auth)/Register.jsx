import { router } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { auth } from '../config/firebase';
import { useApp } from '../context/AppContext';

import { doc, setDoc } from "firebase/firestore";
import { db } from '../config/firebase';



const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useApp();

  if (user) {
    router.replace('/(tabs)/Dashboard');
    return null;
  }

  const handleRegister = async () => {
      if (!name || !email || !password || !confirmPassword) {
       Alert.alert('Error', 'Por favor completa todos los campos');
      return;
  }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
  try {
    // 1. Crear usuario
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCredential.user.uid), {
       displayName: name,
        email: email,
        createdAt: new Date()   
        });
    
    // 2. Actualizar perfil
    await updateProfile(userCredential.user, {
      displayName: name
    });

    // 3. ✅ REDIRIGIR MANUALMENTE después de registro exitoso
    router.replace('/(tabs)/Dashboard');
    
  } catch (error) {
    Alert.alert('Error', error.message);
  }
  setLoading(false);
};

  return (
    <Container>
    <LogoContainer>
        <Logo source={require('../../assets/images/icon-app.png')} />
    </LogoContainer>
      <Title>Crear Cuenta</Title>
      
      <Card>
      <Input
        placeholder="Nombre completo"
        value={name}
        onChangeText={setName}
        placeholderTextColor="#999"
      />
        <Input
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        
        <Input
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />
        
        <Input
          placeholder="Confirmar Contraseña"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />
        
        <Button onPress={handleRegister} disabled={loading}>
          <ButtonText>
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </ButtonText>
        </Button>
        
        <TouchableOpacity onPress={() => router.back()}>
          <LinkText>¿Ya tienes cuenta? Inicia sesión</LinkText>
        </TouchableOpacity>
      </Card>
    </Container>
  );
};

export default Register;

// Reutiliza los mismos Styled Components del Login

const Container = styled.View`
  flex: 1;
  background-color: #F7F4EA;
  justify-content: center;
  padding: 20px;
`;

const LogoContainer = styled.View`
  align-items: center;
  margin-bottom: 30px;
`;
const Logo = styled.Image`
  width: 120px;
  height: 120px;
  border-radius: 60px;
`;

const Title = styled.Text`
  font-size: 32px;
  font-weight: bold;
  color: #1A4870;
  text-align: center;
  margin-bottom: 40px;
`;

const Card = styled.View`
  background: #DCCFC0;
  padding: 25px;
  border-radius: 15px;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.1;
  shadow-radius: 3px;
  elevation: 3;
`;

const Input = styled.TextInput`
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  font-size: 16px;
`;

const Button = styled.TouchableOpacity`
  background-color: ${props => props.disabled ? '#D1E9F6' : '#1A4870'};
  padding: 18px;
  border-radius: 10px;
  align-items: center;
  margin-top: 10px;
`;

const ButtonText = styled.Text`
  color: white;
  font-size: 18px;
  font-weight: 600;
`;

const LinkText = styled.Text`
  color: #865439;
  text-align: center;
  margin-top: 20px;
  font-weight: 600;
`;
