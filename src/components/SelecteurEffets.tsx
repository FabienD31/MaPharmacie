import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { couleurs, espacements, rayons } from '../lib/theme';

type Props = {
  /** Effets associés au médicament en cours de saisie. */
  valeurs: string[];
  onChange: (valeurs: string[]) => void;
  /** Effets déjà utilisés ailleurs, proposés en un geste. */
  suggestions: string[];
};

/** Compare deux effets sans tenir compte de la casse ni des espaces. */
function memeEffet(a: string, b: string): boolean {
  return (
    a.trim().toLocaleLowerCase('fr-FR') === b.trim().toLocaleLowerCase('fr-FR')
  );
}

/**
 * Saisie des effets d'un médicament : ce sur quoi il agit.
 *
 * Deux façons d'ajouter : toucher une suggestion issue des effets déjà
 * enregistrés, ou saisir un nouveau libellé. Les suggestions évitent que
 * « mal de tête » et « maux de tête » coexistent et cassent la recherche.
 */
export function SelecteurEffets({ valeurs, onChange, suggestions }: Props) {
  const [saisie, setSaisie] = useState('');

  function ajouter(effet: string) {
    const propre = effet.trim();
    if (propre.length === 0) return;
    if (valeurs.some((existant) => memeEffet(existant, propre))) return;
    onChange([...valeurs, propre]);
  }

  function retirer(effet: string) {
    onChange(valeurs.filter((existant) => existant !== effet));
  }

  // On ne propose pas ce qui est déjà sélectionné.
  const suggestionsRestantes = suggestions.filter(
    (suggestion) => !valeurs.some((valeur) => memeEffet(valeur, suggestion))
  );

  return (
    <View style={styles.conteneur}>
      <Text style={styles.libelle}>Agit sur</Text>
      <Text style={styles.aide}>
        Ce que tu as constaté ou lu sur la notice : mal de tête, fièvre,
        courbature…
      </Text>

      {valeurs.length > 0 && (
        <View style={styles.puces}>
          {valeurs.map((effet) => (
            <Pressable
              key={effet}
              onPress={() => retirer(effet)}
              accessibilityRole="button"
              accessibilityLabel={`Retirer ${effet}`}
              style={({ pressed }) => [
                styles.puce,
                styles.puceActive,
                pressed && styles.pucePressee,
              ]}
            >
              <Text style={styles.textePuceActive}>{effet} ×</Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.rangeeSaisie}>
        <TextInput
          style={styles.champ}
          value={saisie}
          onChangeText={setSaisie}
          placeholder="Ajouter un effet"
          placeholderTextColor={couleurs.texteSecondaire}
          autoCapitalize="none"
          returnKeyType="done"
          onSubmitEditing={() => {
            ajouter(saisie);
            setSaisie('');
          }}
        />

        <Pressable
          onPress={() => {
            ajouter(saisie);
            setSaisie('');
          }}
          disabled={saisie.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel="Ajouter cet effet"
          style={({ pressed }) => [
            styles.boutonAjout,
            saisie.trim().length === 0 && styles.boutonDesactive,
            pressed && styles.pucePressee,
          ]}
        >
          <Text style={styles.texteBoutonAjout}>Ajouter</Text>
        </Pressable>
      </View>

      {suggestionsRestantes.length > 0 && (
        <>
          <Text style={styles.sousTitre}>Déjà utilisés</Text>
          <View style={styles.puces}>
            {suggestionsRestantes.map((suggestion) => (
              <Pressable
                key={suggestion}
                onPress={() => ajouter(suggestion)}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.puce,
                  pressed && styles.pucePressee,
                ]}
              >
                <Text style={styles.textePuce}>+ {suggestion}</Text>
              </Pressable>
            ))}
          </View>
        </>
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
    marginBottom: espacements.xs,
  },
  aide: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
    marginBottom: espacements.s,
  },
  sousTitre: {
    marginTop: espacements.m,
    marginBottom: espacements.s,
    fontSize: 12,
    fontWeight: '600',
    color: couleurs.texteSecondaire,
  },
  puces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacements.s,
    marginBottom: espacements.s,
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
    fontSize: 13,
    fontWeight: '600',
    color: couleurs.primaire,
  },
  rangeeSaisie: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.s,
  },
  champ: {
    flex: 1,
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingHorizontal: espacements.m,
    paddingVertical: espacements.m,
    fontSize: 15,
    color: couleurs.texte,
  },
  boutonAjout: {
    backgroundColor: couleurs.primaire,
    borderRadius: rayons.m,
    paddingVertical: espacements.m,
    paddingHorizontal: espacements.l,
  },
  boutonDesactive: {
    opacity: 0.4,
  },
  texteBoutonAjout: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
