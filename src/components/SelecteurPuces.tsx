import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

type Props = {
  libelle: string;
  options: readonly string[];
  valeur: string | null;
  onChange: (valeur: string | null) => void;
  /** Ajoute une puce « Autre » qui révèle un champ libre. */
  autoriserAutre?: boolean;
};

/**
 * Sélecteur à puces : un seul choix à la fois.
 * Toucher la puce déjà sélectionnée la désélectionne.
 */
export function SelecteurPuces({
  libelle,
  options,
  valeur,
  onChange,
  autoriserAutre = false,
}: Props) {
  // La valeur est « autre » si elle est renseignée sans figurer dans la liste.
  const valeurHorsListe = valeur !== null && !options.includes(valeur);
  const [modeAutre, setModeAutre] = useState(valeurHorsListe);

  function choisir(option: string) {
    setModeAutre(false);
    onChange(valeur === option ? null : option);
  }

  return (
    <View style={styles.conteneur}>
      <Text style={styles.libelle}>{libelle}</Text>

      <View style={styles.puces}>
        {options.map((option) => {
          const actif = !modeAutre && valeur === option;
          return (
            <Pressable
              key={option}
              onPress={() => choisir(option)}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              style={({ pressed }) => [
                styles.puce,
                actif && styles.puceActive,
                pressed && styles.pucePressee,
              ]}
            >
              <Text style={[styles.textePuce, actif && styles.textePuceActive]}>
                {option}
              </Text>
            </Pressable>
          );
        })}

        {autoriserAutre && (
          <Pressable
            onPress={() => {
              setModeAutre(true);
              // On repart d'un champ vide si la valeur venait de la liste.
              if (!valeurHorsListe) onChange(null);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: modeAutre }}
            style={({ pressed }) => [
              styles.puce,
              modeAutre && styles.puceActive,
              pressed && styles.pucePressee,
            ]}
          >
            <Text
              style={[styles.textePuce, modeAutre && styles.textePuceActive]}
            >
              Autre…
            </Text>
          </Pressable>
        )}
      </View>

      {autoriserAutre && modeAutre && (
        <TextInput
          style={styles.champLibre}
          value={valeur ?? ''}
          onChangeText={(texte) => onChange(texte.length > 0 ? texte : null)}
          placeholder="Préciser"
          placeholderTextColor={couleurs.texteSecondaire}
          autoFocus
        />
      )}
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
    marginBottom: espacements.s,
  },
  puces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacements.s,
  },
  puce: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.carte,
    borderRadius: rayons.l,
    paddingVertical: espacements.s,
    paddingHorizontal: espacements.m,
  },
  puceActive: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
  },
  pucePressee: {
    opacity: 0.6,
  },
  textePuce: {
    fontSize: 13,
    color: couleurs.texteSecondaire,
  },
  textePuceActive: {
    color: couleurs.primaire,
    fontWeight: '600',
  },
  champLibre: {
    marginTop: espacements.s,
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingHorizontal: espacements.m,
    paddingVertical: espacements.m,
    fontSize: 15,
    color: couleurs.texte,
  },
});
