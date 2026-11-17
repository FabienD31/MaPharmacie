import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

type Props = {
  libelle: string;
  /** Valeurs réellement présentes en base. La ligne disparaît si elle est vide. */
  options: string[];
  valeur: string | null;
  onChange: (valeur: string | null) => void;
};

/**
 * Ligne de filtres défilable horizontalement.
 *
 * Les options proviennent des valeurs réellement enregistrées, pas des listes
 * de référence : on ne propose jamais un filtre qui ne donnerait aucun résultat.
 */
export function LigneFiltres({ libelle, options, valeur, onChange }: Props) {
  if (options.length === 0) return null;

  return (
    <View style={styles.conteneur}>
      <Text style={styles.libelle}>{libelle}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.puces}
        keyboardShouldPersistTaps="handled"
      >
        {options.map((option) => {
          const actif = valeur === option;
          return (
            <Pressable
              key={option}
              onPress={() => onChange(actif ? null : option)}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              style={({ pressed }) => [
                styles.puce,
                actif && styles.puceActive,
                pressed && styles.pucePressee,
              ]}
            >
              <Text style={[styles.texte, actif && styles.texteActif]}>
                {option}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    marginBottom: espacements.m,
  },
  libelle: {
    fontSize: 12,
    fontWeight: '600',
    color: couleurs.texteSecondaire,
    marginBottom: espacements.xs,
  },
  puces: {
    gap: espacements.s,
    paddingRight: espacements.l,
  },
  puce: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.carte,
    borderRadius: rayons.l,
    paddingVertical: 6,
    paddingHorizontal: espacements.m,
  },
  puceActive: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
  },
  pucePressee: {
    opacity: 0.6,
  },
  texte: {
    fontSize: 13,
    color: couleurs.texteSecondaire,
  },
  texteActif: {
    color: couleurs.primaire,
    fontWeight: '600',
  },
});
