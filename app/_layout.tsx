import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { Suspense } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { BoutonRetour } from '../src/components/BoutonRetour';
import { migrerBase, NOM_BASE } from '../src/db/database';
import { FournisseurPreferences } from '../src/lib/ContextePreferences';
import { couleurs, espacements } from '../src/lib/theme';

/**
 * Options d'en-tête communes aux écrans qui ont besoin d'un retour.
 * On masque le bouton natif pour ne pas en afficher deux.
 */
function optionsRetour(libelle?: string) {
  return {
    headerBackVisible: false,
    headerLeft: () => <BoutonRetour libelle={libelle} />,
  };
}

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
              {/* L'accueil est la racine : pas de retour possible. */}
              <Stack.Screen name="index" options={{ title: 'Ma pharmacie' }} />

              {/*
                Les autres écrans reçoivent le même bouton de retour, fourni
                par l'application plutôt que par la navigation native : la
                fenêtre modale n'en aurait pas, et l'apparence resterait
                variable d'un écran à l'autre.
              */}
              <Stack.Screen
                name="medicament/[id]"
                options={{ title: 'Fiche', ...optionsRetour() }}
              />
              <Stack.Screen
                name="formulaire"
                options={{
                  title: 'Médicament',
                  presentation: 'modal',
                  ...optionsRetour('Fermer'),
                }}
              />
              <Stack.Screen
                name="parametres"
                options={{ title: 'Réglages', ...optionsRetour() }}
              />
              <Stack.Screen
                name="symptomes"
                options={{ title: 'Par symptôme', ...optionsRetour() }}
              />
              <Stack.Screen
                name="scan"
                options={{ title: 'Scanner', ...optionsRetour() }}
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
