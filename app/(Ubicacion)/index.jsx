import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, View, Alert, Linking, Share } from 'react-native';
import { router } from 'expo-router';
import styled from 'styled-components/native';
import { useApp } from '../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location'; // se descarga

const UbicacionScreen = () => {
  const { user } = useApp();
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // OBTENER UBICACIÓN ACTUAL
  const getCurrentLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos necesarios', 'Se necesita acceso a la ubicación');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      Alert.alert('✅', 'Ubicación obtenida correctamente');
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    }
    setIsLoading(false);
  };

  //  COMPARTIR UBICACIÓN VÍA WHATSAPP
  const shareLocation = async () => {
    if (!location) {
      Alert.alert('Error', 'Primero obtén tu ubicación');
      return;
    }

    const { latitude, longitude } = location.coords;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const message = `📍 Mi ubicación actual: ${mapsUrl}`;

    try {
      // Intentar compartir via WhatsApp
      await Share.share({
        message: message,
        title: 'Mi ubicación',
      });
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo compartir la ubicación');
    }
  };

  // 📱 ENVIAR DIRECTAMENTE POR WHATSAPP
  const sendViaWhatsApp = async () => {
    if (!location) {
      Alert.alert('Error', 'Primero obtén tu ubicación');
      return;
    }

    const { latitude, longitude } = location.coords;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const message = `📍 Mi ubicación actual: ${mapsUrl}`;

    try {
      const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'WhatsApp no está instalado');
    }
  };

  // 📋 ENVIAR POR SMS
  const sendViaSMS = async () => {
    if (!location) {
      Alert.alert('Error', 'Primero obtén tu ubicación');
      return;
    }

    const { latitude, longitude } = location.coords;
    const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const message = `📍 Mi ubicación actual: ${mapsUrl}`;

    try {
      const url = `sms:?body=${encodeURIComponent(message)}`;
      await Linking.openURL(url);
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir mensajes');
    }
  };

  return (
    <Container>
      <HeaderContainer style={{ paddingTop: insets.top + 15 }}>
        <BackButton onPress={() => router.back()}>
          <BackText>{"<"}</BackText>
        </BackButton>
        <Title>Enviar Ubicación</Title>
      </HeaderContainer>

      {/* BOTÓN PRINCIPAL - OBTENER UBICACIÓN */}
      <TouchableOpacity 
        onPress={getCurrentLocation}
        disabled={isLoading}
        style={{
          backgroundColor: isLoading ? '#95a5a6' : '#154D71',
          padding: 25,
          borderRadius: 15,
          alignItems: 'center',
          margin: 20,
        }}
      >
        <Text style={{ color: 'white', fontSize: 22, fontWeight: 'bold' }}>
          {isLoading ? '📍 Obteniendo ubicación...' : '📍 Obtener Mi Ubicación'}
        </Text>
      </TouchableOpacity>

      {/* INFO DE UBICACIÓN */}
      {location && (
        <InfoContainer>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#2c3e50', marginBottom: 10 }}>
            ✅ Ubicación obtenida:
          </Text>
          <Text style={{ color: '#7f8c8d' }}>
            Lat: {location.coords.latitude.toFixed(6)}
          </Text>
          <Text style={{ color: '#7f8c8d', marginBottom: 20 }}>
            Long: {location.coords.longitude.toFixed(6)}
          </Text>

          {/*  BOTONES DE ENVIO RÁPIDO */}
          <TouchableOpacity 
            onPress={shareLocation}
            style={{
              backgroundColor: '#1E93AB',
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 15,
            }}
          >
            <Text style={{ color: 'white', fontSize: 18, fontWeight: '600' }}>
              📤 Compartir Ubicación
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={sendViaWhatsApp}
            style={{
              backgroundColor: '#568F87',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>
              💬 Enviar por WhatsApp
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={sendViaSMS}
            style={{
              backgroundColor: '#BBDCE5',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'black', fontSize: 16 }}>
              ✉️ Enviar por SMS
            </Text>
          </TouchableOpacity>
        </InfoContainer>
      )}

      {!location && (
        <Text style={{ textAlign: 'center', color: '#7f8c8d', marginTop: 20, padding: 20 }}>
          Presiona "Obtener Mi Ubicación" para comenzar
        </Text>
      )}
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

const InfoContainer = styled.View`
  background-color: white;
  padding: 20px;
  border-radius: 15px;
  margin: 10px;
`;

export default UbicacionScreen;