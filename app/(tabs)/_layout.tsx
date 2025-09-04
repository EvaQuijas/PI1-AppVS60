import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="Dashboard"
        options={{
          title: 'Inicio',  
          headerShown: false 

                  
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendario',
          
        }}
      />
    </Tabs>
  );
}