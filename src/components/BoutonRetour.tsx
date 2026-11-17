import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { espacements } from '../lib/theme';

type Props = {
  /** Libellé affiché à côté du chevron. */
  libelle?: string;
};

/**
 * Bouton de retour pour l'en-tête des écrans.
 *
 * La navigation native en fournit déjà un sur les écrans empilés, mais pas sur
 * ceux présentés en fenêtre modale, et son apparence varie. En le fournissant
 * nous-mêmes, le même bouton apparaît au même endroit sur tous les écrans.
 *
 * `canGoBack` évite de proposer un retour qui ne mènerait nulle part, par
 * exemple si l'écran a été ouvert directement.
 */
export function BoutonRetour({ libelle = 'Retour' }: Props) {
  if (!router.canGoBack()) return null;

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel={libelle}
      hitSlop={12}
      style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
    >
      <Text style={styles.texte}>‹ {libelle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: {
    paddingRight: espacements.m,
    paddingVertical: espacements.xs,
  },
  presse: {
    opacity: 0.6,
  },
  texte: {
    color: '#FFFFFF',
    fontSize: 17,
  },
});
