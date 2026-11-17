import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

type Props = TextInputProps & {
  libelle: string;
  /** Message affiché sous le champ quand la saisie est invalide. */
  erreur?: string | null;
  /** Indication discrète sous le libellé (format attendu, par exemple). */
  aide?: string;
};

/** Champ de saisie avec libellé, aide et message d'erreur. */
export function ChampTexte({ libelle, erreur, aide, style, ...props }: Props) {
  return (
    <View style={styles.conteneur}>
      <Text style={styles.libelle}>{libelle}</Text>
      {aide && <Text style={styles.aide}>{aide}</Text>}
      <TextInput
        style={[styles.champ, erreur ? styles.champEnErreur : null, style]}
        placeholderTextColor={couleurs.texteSecondaire}
        {...props}
      />
      {erreur && <Text style={styles.erreur}>{erreur}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: {
    marginBottom: espacements.l,
  },
  libelle: {
    fontSize: 14,
    fontWeight: '600',
    color: couleurs.texte,
    marginBottom: espacements.xs,
  },
  aide: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
    marginBottom: espacements.xs,
  },
  champ: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingHorizontal: espacements.m,
    paddingVertical: espacements.m,
    fontSize: 15,
    color: couleurs.texte,
  },
  champEnErreur: {
    borderColor: couleurs.perime,
  },
  erreur: {
    marginTop: espacements.xs,
    fontSize: 12,
    color: couleurs.perime,
  },
});
