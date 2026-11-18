import { Pressable, StyleSheet, Text, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

type Props = {
  quantite: number;
  onRetirer: () => void;
  onAjouter: () => void;
  /** Unité affichée sous le nombre : comprimé, gélule, dose… */
  unite?: string | null;
  occupe?: boolean;
};

/**
 * Compteur de quantité restante.
 *
 * C'est le geste le plus fréquent de l'application : on prend un comprimé,
 * on le décompte. Les deux touches sont donc larges et bien séparées, pour
 * être utilisables d'une main sans viser.
 */
export function CompteurQuantite({
  quantite,
  onRetirer,
  onAjouter,
  unite,
  occupe = false,
}: Props) {
  const vide = quantite <= 0;

  return (
    <View style={styles.conteneur}>
      <Pressable
        onPress={onRetirer}
        disabled={occupe || vide}
        accessibilityRole="button"
        accessibilityLabel="Retirer une unité"
        style={({ pressed }) => [
          styles.touche,
          styles.toucheRetrait,
          (occupe || vide) && styles.desactive,
          pressed && styles.pressee,
        ]}
      >
        <Text style={styles.signeRetrait}>−</Text>
      </Pressable>

      <View style={styles.valeur}>
        <Text style={styles.nombre}>{quantite}</Text>
        <Text style={styles.unite}>
          {unite ? unite.toLocaleLowerCase('fr-FR') : 'restant'}
        </Text>
      </View>

      <Pressable
        onPress={onAjouter}
        disabled={occupe}
        accessibilityRole="button"
        accessibilityLabel="Ajouter une unité"
        style={({ pressed }) => [
          styles.touche,
          styles.toucheAjout,
          occupe && styles.desactive,
          pressed && styles.pressee,
        ]}
      >
        <Text style={styles.signeAjout}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacements.m,
  },
  touche: {
    width: 68,
    height: 68,
    borderRadius: rayons.l,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  toucheRetrait: {
    backgroundColor: couleurs.primaire,
    borderColor: couleurs.primaire,
  },
  toucheAjout: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
  },
  desactive: {
    opacity: 0.35,
  },
  pressee: {
    opacity: 0.6,
  },
  signeRetrait: {
    color: '#FFFFFF',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '600',
  },
  signeAjout: {
    color: couleurs.texteSecondaire,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '600',
  },
  valeur: {
    flex: 1,
    alignItems: 'center',
  },
  nombre: {
    fontSize: 34,
    fontWeight: '700',
    color: couleurs.texte,
  },
  unite: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
});
