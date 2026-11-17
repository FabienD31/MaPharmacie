import Constants from 'expo-constants';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avertissement } from '../src/components/Avertissement';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/**
 * Écran d'accueil (placeholder de l'étape 2).
 * La liste des médicaments triée par péremption arrivera à l'étape suivante,
 * une fois la base SQLite en place.
 */
export default function Accueil() {
  return (
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={styles.contenu}
      keyboardShouldPersistTaps="handled"
    >
      <Avertissement />

      <View style={styles.carte}>
        <Text style={styles.titre}>Installation vérifiée</Text>
        <Text style={styles.paragraphe}>
          La navigation expo-router fonctionne. Les écrans de gestion des
          médicaments seront ajoutés à l&apos;étape suivante.
        </Text>
      </View>

      <View style={styles.carte}>
        <Text style={styles.titre}>Confidentialité</Text>
        <Text style={styles.paragraphe}>
          Les données restent sur ce téléphone, dans une base SQLite locale.
          Aucun envoi réseau, aucun compte, aucun outil de mesure d&apos;audience.
        </Text>
      </View>

      <Text style={styles.pied}>
        Expo SDK {Constants.expoConfig?.sdkVersion ?? '—'} · version{' '}
        {Constants.expoConfig?.version ?? '—'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: couleurs.fond,
  },
  contenu: {
    padding: espacements.l,
    paddingBottom: espacements.xxl,
  },
  carte: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.l,
    padding: espacements.l,
    marginBottom: espacements.m,
  },
  titre: {
    fontSize: 16,
    fontWeight: '600',
    color: couleurs.texte,
    marginBottom: espacements.xs,
  },
  paragraphe: {
    fontSize: 14,
    lineHeight: 20,
    color: couleurs.texteSecondaire,
  },
  pied: {
    marginTop: espacements.s,
    textAlign: 'center',
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
});
