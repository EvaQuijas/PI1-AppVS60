import { Stack } from 'expo-router';
import { AppProvider } from './context/AppContext';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    // 1. Configurar canal Android ( para segundo plano)
    const setupAndroidChannel = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('recordatorios', {
          name: 'Recordatorios',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          enableLights: true,
          enableVibrate: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          showBadge: true,
        });
        console.log('✅ Canal Android configurado para segundo plano');
      }
    };

    // 2. Solicitar permisos ESPECÍFICOS para segundo plano
    const requestPermissions = async () => {
      try {
       
        const { status } = await Notifications.getPermissionsAsync();
        console.log('📋 Permisos actuales:', status);
        
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          console.log('📋 Nuevos permisos:', newStatus);
        }
        
        await setupAndroidChannel();
      } catch (error) {
        console.log('❌ Error:', error);
      }
    }; //  CIERRA la función requestPermissions

    requestPermissions();

    // 3. Limpiar 
    return () => {};
  }, []);

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack>
    </AppProvider>
  );
}