import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { migrerBase, NOM_BASE } from '../src/db/database';
import { FournisseurPreferences } from '../src/lib/ContextePreferences';
import { couleurs, espacements } from '../src/lib/theme';

/** Écran affiché pendant l'ouverture et la migration de la base. */
function Chargement() {
  return (
    <View style={styles.chargement}>
      <ActivityIndicator color={couleurs.primaire} />
      <Text style={styles.texteChargement}>Ouverture de la base…</Text>
    </View>
  );
}

/**
 * Layout racine.
 *
 * SQLiteProvider ouvre la base une seule fois pour toute l'application et la
 * met à disposition des écrans via `useSQLiteContext()`. `onInit` applique les
 * migrations avant que le moindre écran ne soit rendu.
 *
 * FournisseurPreferences se place à l'intérieur, car il lit ses réglages
 * dans cette même base.
 */
export default function LayoutRacine() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Suspense fallback={<Chargement />}>
        <SQLiteProvider databaseName={NOM_BASE} onInit={migrerBase} useSuspense>
          <FournisseurPreferences>
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: couleurs.primaire },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: { fontWeight: '600' },
                headerBackTitle: 'Retour',
                contentStyle: { backgroundColor: couleurs.fond },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'Ma pharmacie' }} />
              <Stack.Screen name="medicament/[id]" options={{ title: 'Fiche' }} />
              <Stack.Screen
                name="formulaire"
                options={{ title: 'Médicament', presentation: 'modal' }}
              />
              <Stack.Screen name="parametres" options={{ title: 'Réglages' }} />
              <Stack.Screen
                name="symptomes"
                options={{ title: 'Par symptôme' }}
              />
            </Stack>
          </FournisseurPreferences>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  chargement: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.fond,
    gap: espacements.m,
  },
  texteChargement: {
    color: couleurs.texteSecondaire,
    fontSize: 14,
  },
});
