import { Stack } from 'expo-router';  //Stack, NO Tabs
import { SafeAreaView } from 'react-native-safe-area-context';


export default function RegistroSaludLayout() {
  return (
    <Stack screenOptions={{
    headerShown: false, //  Oculta TODO el header
  }}> 
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Mis registros',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="add-category" 
        options={{ 
          title: 'Agregar categoría',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="[categoryId]" 
        options={{ 
          title: 'Detalles', 
          headerShown: false,
        }} 
      />
    </Stack>  // ← Stack, NO Tabs
  );
}