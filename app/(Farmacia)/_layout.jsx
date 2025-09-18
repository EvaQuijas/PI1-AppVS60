import { Stack } from 'expo-router';

export default function CompraLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Farmacias' }} />
    </Stack>
  );
}