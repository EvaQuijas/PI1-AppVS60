import { Stack } from 'expo-router';

export default function RemindersLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{
          title: 'Recordatorios',
          headerShown: false
        }} 
      />
    </Stack>
  );
}