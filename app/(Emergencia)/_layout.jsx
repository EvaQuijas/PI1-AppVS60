import { Stack } from 'expo-router';

export default function EmergenciaLayout() {
  return (
    <Stack screenOptions={{
      headerShown: false, // Ocultar header para mantener consistencia
    }}> 
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Emergencia',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="config" 
        options={{ 
          title: 'Configuración de Emergencia',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
