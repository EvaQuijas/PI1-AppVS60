import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="Login" 
        options={{ 
          title: 'Iniciar Sesión',
          headerShown: false  // ←Oculta el header para diseño fullscreen
        }} 
      />
      <Stack.Screen 
        name="Register" 
        options={{ 
          title: 'Crear Cuenta',
          headerShown: false
        }} 
      />
    </Stack>
  );
}