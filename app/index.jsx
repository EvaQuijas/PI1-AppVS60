import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useApp } from './context/AppContext';

export default function Index() {
  const { user, loading } = useApp();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/Dashboard" />;
  }

  return <Redirect href="/(auth)/Login" />;
}