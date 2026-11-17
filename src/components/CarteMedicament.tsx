import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { statutPeremption } from '../lib/dates';
import { couleurs, espacements, rayons } from '../lib/theme';
import type { Medicament } from '../db/schema';
import { BadgePeremption } from './BadgePeremption';

type Props = {
  medicament: Medicament;
  seuilJours: number;
  onPress: () => void;
};

/** Ligne de la liste principale : un médicament et son échéance. */
export function CarteMedicament({ medicament, seuilJours, onPress }: Props) {
  const perime = statutPeremption(medicament.datePeremption, seuilJours) === 'perime';

  // Sous-titre composé des informations réellement renseignées.
  const details = [medicament.principeActif, medicament.dosage, medicament.forme]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Fiche de ${medicament.nom}`}
      style={({ pressed }) => [
        styles.carte,
        perime && styles.cartePerimee,
        pressed && styles.cartePressee,
      ]}
    >
      <View style={styles.haut}>
        {medicament.photoUri && (
          <Image
            source={{ uri: medicament.photoUri }}
            style={styles.vignette}
            resizeMode="cover"
          />
        )}

        <View style={styles.textes}>
          <View style={styles.entete}>
            <Text style={styles.nom} numberOfLines={1}>
              {medicament.nom}
            </Text>
            {medicament.quantiteRestante !== null && (
              <Text style={styles.quantite}>{medicament.quantiteRestante}×</Text>
            )}
          </View>

          {details.length > 0 && (
            <Text style={styles.details} numberOfLines={1}>
              {details}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.pied}>
        <BadgePeremption
          datePeremption={medicament.datePeremption}
          seuilJours={seuilJours}
        />
        {medicament.lieuRangement && (
          <Text style={styles.lieu} numberOfLines={1}>
            {medicament.lieuRangement}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.l,
    padding: espacements.l,
    marginBottom: espacements.m,
  },
  // Les médicaments périmés restent visibles, mais signalés par un liseré rouge.
  cartePerimee: {
    borderLeftWidth: 4,
    borderLeftColor: couleurs.perime,
  },
  cartePressee: {
    opacity: 0.6,
  },
  haut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.m,
  },
  vignette: {
    width: 48,
    height: 48,
    borderRadius: rayons.s,
    backgroundColor: couleurs.bordure,
  },
  textes: {
    flex: 1,
  },
  entete: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacements.s,
  },
  nom: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '600',
    color: couleurs.texte,
  },
  quantite: {
    fontSize: 14,
    fontWeight: '600',
    color: couleurs.primaire,
  },
  details: {
    marginTop: 2,
    fontSize: 13,
    color: couleurs.texteSecondaire,
  },
  pied: {
    marginTop: espacements.m,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacements.s,
  },
  lieu: {
    flexShrink: 1,
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
});
