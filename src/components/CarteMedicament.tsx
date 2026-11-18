import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { statutPeremption } from '../lib/dates';
import { couleurs, espacements, rayons } from '../lib/theme';
import type { Medicament } from '../db/schema';
import { BadgePeremption } from './BadgePeremption';

type Props = {
  medicament: Medicament;
  seuilJours: number;
  onPress: () => void;
  /** Retrait d'une unité sans ouvrir la fiche. */
  onRetirerUne?: () => void;
  /** Vrai pendant l'écriture en base, pour éviter les appuis répétés. */
  occupe?: boolean;
};

/** Ligne de la liste principale : un médicament et son échéance. */
export function CarteMedicament({
  medicament,
  seuilJours,
  onPress,
  onRetirerUne,
  occupe = false,
}: Props) {
  const perime = statutPeremption(medicament.datePeremption, seuilJours) === 'perime';

  // Extraite une fois : à l'intérieur des fonctions de style, TypeScript perd
  // le rétrécissement de type opéré par le test de nullité.
  const quantite = medicament.quantiteRestante;

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
          </View>

          {details.length > 0 && (
            <Text style={styles.details} numberOfLines={1}>
              {details}
            </Text>
          )}
        </View>

        {/*
          Retrait d'une prise sans ouvrir la fiche : c'est le geste quotidien.
          La touche est hors de la zone qui ouvre la fiche, assez grande pour
          être visée sans attention, et porte la quantité restante — on voit
          donc ce qu'on décompte au moment où on le décompte.
        */}
        {quantite !== null && onRetirerUne && (
          <Pressable
            onPress={onRetirerUne}
            disabled={occupe || quantite <= 0}
            accessibilityRole="button"
            accessibilityLabel={`Retirer une unité de ${medicament.nom}, il en reste ${quantite}`}
            hitSlop={6}
            style={({ pressed }) => [
              styles.retrait,
              (occupe || quantite <= 0) && styles.retraitInactif,
              pressed && styles.retraitPresse,
            ]}
          >
            <Text style={styles.retraitNombre}>{quantite}</Text>
            <Text style={styles.retraitSigne}>−1</Text>
          </Pressable>
        )}

        {/* Sans retrait possible, la quantité reste affichée, en simple texte. */}
        {quantite !== null && !onRetirerUne && (
          <Text style={styles.quantite}>{quantite}×</Text>
        )}
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
  retrait: {
    width: 56,
    height: 56,
    borderRadius: rayons.m,
    borderWidth: 1,
    borderColor: couleurs.primaire,
    backgroundColor: couleurs.primaireClair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retraitInactif: {
    opacity: 0.35,
  },
  retraitPresse: {
    opacity: 0.6,
  },
  retraitNombre: {
    fontSize: 18,
    fontWeight: '700',
    color: couleurs.primaire,
    lineHeight: 21,
  },
  retraitSigne: {
    fontSize: 11,
    fontWeight: '600',
    color: couleurs.primaire,
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
