import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import styled from 'styled-components/native';
import { auth } from '../config/firebase';
import { useApp } from '../context/AppContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useApp();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/Dashboard');
    }
  }, [user]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/Dashboard');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      extraHeight={100}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Container>
        <LogoContainer>
          <Logo source={require('../../assets/images/icon-app.png')} />
        </LogoContainer>

        <Title>Vida Saludable 60+</Title>
        
        <Card>
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
          
          <Button onPress={handleLogin} disabled={loading}>
            <ButtonText>
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </ButtonText>
          </Button>
          
          <TouchableOpacity onPress={() => router.push('/(auth)/Register')}>
            <LinkText>¿No tienes cuenta? Regístrate aquí</LinkText>
          </TouchableOpacity>
        </Card>
      </Container>
    </KeyboardAwareScrollView>
  );
};

export default Login;

// Styled Components
const Container = styled.View`
  flex: 1;
  background-color: #F7F4EA;
  justify-content: center;
  padding: 20px;
  min-height: 100%;
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