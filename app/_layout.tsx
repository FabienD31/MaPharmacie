import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { couleurs } from '../src/lib/theme';

/**
 * Layout racine : enveloppe toute la navigation.
 * SafeAreaProvider est requis par react-native-safe-area-context
 * pour gérer l'encoche et la barre d'accueil de l'iPhone.
 */
export default function LayoutRacine() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: couleurs.primaire },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: couleurs.fond },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Ma pharmacie' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
