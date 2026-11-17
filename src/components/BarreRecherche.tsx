import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

type Props = {
  valeur: string;
  onChange: (valeur: string) => void;
};

/** Champ de recherche sur le nom et le principe actif, avec bouton d'effacement. */
export function BarreRecherche({ valeur, onChange }: Props) {
  return (
    <View style={styles.conteneur}>
      <TextInput
        style={styles.champ}
        value={valeur}
        onChangeText={onChange}
        placeholder="Rechercher un nom ou un principe actif"
        placeholderTextColor={couleurs.texteSecondaire}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        accessibilityLabel="Rechercher un médicament"
      />

      {valeur.length > 0 && (
        <Pressable
          onPress={() => onChange('')}
          accessibilityRole="button"
          accessibilityLabel="Effacer la recherche"
          hitSlop={8}
          style={styles.effacer}
        >
          <Text style={styles.croix}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingHorizontal: espacements.m,
    marginBottom: espacements.m,
  },
  champ: {
    flex: 1,
    paddingVertical: espacements.m,
    fontSize: 15,
    color: couleurs.texte,
  },
  effacer: {
    paddingLeft: espacements.s,
  },
  croix: {
    fontSize: 22,
    lineHeight: 24,
    color: couleurs.texteSecondaire,
  },
});
