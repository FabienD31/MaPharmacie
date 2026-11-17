import { StyleSheet, Text, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

/**
 * Mention légale affichée sur l'écran d'accueil.
 * L'application référence des médicaments, elle ne donne aucun conseil :
 * pas de posologie, pas de recommandation de prise.
 */
export function Avertissement() {
  return (
    <View style={styles.conteneur}>
      <Text style={styles.texte}>
        Cette app ne remplace pas la notice ni l&apos;avis d&apos;un médecin ou
        d&apos;un pharmacien.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    backgroundColor: couleurs.avertissementFond,
    borderColor: couleurs.avertissementBordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    padding: espacements.m,
    marginBottom: espacements.l,
  },
  texte: {
    color: couleurs.texte,
    fontSize: 13,
    lineHeight: 18,
  },
});
