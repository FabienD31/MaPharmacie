import { StyleSheet, Text, View } from 'react-native';

import { libellePeremption, statutPeremption } from '../lib/dates';
import { couleurs, espacements, rayons } from '../lib/theme';

type Props = {
  /** Date de péremption au format « AAAA-MM-JJ », ou null. */
  datePeremption: string | null;
  seuilJours: number;
};

/** Couleur associée à chaque état de péremption. */
const COULEURS_STATUT = {
  perime: couleurs.perime,
  bientot: couleurs.bientotPerime,
  valide: couleurs.valide,
  inconnu: couleurs.texteSecondaire,
} as const;

/**
 * Pastille colorée indiquant l'échéance d'un médicament.
 * Le texte reprend toujours l'information, la couleur seule ne suffit pas
 * à distinguer les états (lisibilité en cas de daltonisme).
 */
export function BadgePeremption({ datePeremption, seuilJours }: Props) {
  const statut = statutPeremption(datePeremption, seuilJours);
  const couleur = COULEURS_STATUT[statut];

  return (
    <View style={[styles.badge, { borderColor: couleur }]}>
      <View style={[styles.pastille, { backgroundColor: couleur }]} />
      <Text style={[styles.texte, { color: couleur }]} numberOfLines={1}>
        {libellePeremption(datePeremption)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: rayons.s,
    paddingVertical: 3,
    paddingHorizontal: espacements.s,
    gap: espacements.xs,
  },
  pastille: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  texte: {
    fontSize: 12,
    fontWeight: '600',
  },
});
