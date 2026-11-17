import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BadgePeremption } from '../../src/components/BadgePeremption';
import { obtenirMedicament, supprimerMedicament } from '../../src/db/medicaments';
import { SEUIL_ALERTE_JOURS, type Medicament } from '../../src/db/schema';
import { isoVersAffichage } from '../../src/lib/dates';
import { couleurs, espacements, rayons } from '../../src/lib/theme';

/** Une ligne « libellé / valeur » de la fiche. */
function Ligne({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <View style={styles.ligne}>
      <Text style={styles.libelle}>{libelle}</Text>
      <Text style={styles.valeur}>{valeur}</Text>
    </View>
  );
}

/** Fiche détaillée d'un médicament, avec modification et suppression. */
export default function FicheMedicament() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const idMedicament = Number(id);

  const [medicament, setMedicament] = useState<Medicament | null>(null);
  const [chargement, setChargement] = useState(true);

  // Rechargé au retour du formulaire pour afficher les modifications.
  useFocusEffect(
    useCallback(() => {
      let actif = true;

      obtenirMedicament(db, idMedicament).then((resultat) => {
        if (!actif) return;
        setMedicament(resultat);
        setChargement(false);
      });

      return () => {
        actif = false;
      };
    }, [db, idMedicament])
  );

  /** Demande confirmation avant une suppression définitive. */
  function confirmerSuppression() {
    if (!medicament) return;

    Alert.alert(
      'Supprimer ce médicament ?',
      `« ${medicament.nom} » sera définitivement retiré de ton inventaire. Cette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await supprimerMedicament(db, idMedicament);
            router.back();
          },
        },
      ]
    );
  }

  if (chargement) {
    return <View style={styles.ecran} />;
  }

  if (!medicament) {
    return (
      <View style={styles.ecranVide}>
        <Text style={styles.absent}>Ce médicament n&apos;existe plus.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.ecran} contentContainerStyle={styles.contenu}>
      <View style={styles.entete}>
        <Text style={styles.nom}>{medicament.nom}</Text>
        <BadgePeremption
          datePeremption={medicament.datePeremption}
          seuilJours={SEUIL_ALERTE_JOURS}
        />
      </View>

      <View style={styles.carte}>
        <Ligne
          libelle="Principe actif"
          valeur={medicament.principeActif ?? 'Non renseigné'}
        />
        <Ligne libelle="Dosage" valeur={medicament.dosage ?? 'Non renseigné'} />
        <Ligne libelle="Forme" valeur={medicament.forme ?? 'Non renseignée'} />
        <Ligne
          libelle="Quantité restante"
          valeur={
            medicament.quantiteRestante !== null
              ? String(medicament.quantiteRestante)
              : 'Non renseignée'
          }
        />
        <Ligne
          libelle="Date de péremption"
          valeur={isoVersAffichage(medicament.datePeremption)}
        />
        <Ligne
          libelle="Lieu de rangement"
          valeur={medicament.lieuRangement ?? 'Non renseigné'}
        />
      </View>

      {medicament.notes && (
        <View style={styles.carte}>
          <Text style={styles.libelle}>Notes</Text>
          <Text style={styles.notes}>{medicament.notes}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/formulaire?id=${medicament.id}`)}
          accessibilityRole="button"
          style={({ pressed }) => [styles.bouton, pressed && styles.presse]}
        >
          <Text style={styles.texteBouton}>Modifier</Text>
        </Pressable>

        <Pressable
          onPress={confirmerSuppression}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.boutonSupprimer,
            pressed && styles.presse,
          ]}
        >
          <Text style={styles.texteSupprimer}>Supprimer</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: couleurs.fond,
  },
  ecranVide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: couleurs.fond,
  },
  absent: {
    color: couleurs.texteSecondaire,
    fontSize: 15,
  },
  contenu: {
    padding: espacements.l,
    paddingBottom: espacements.xxl,
  },
  entete: {
    marginBottom: espacements.l,
    gap: espacements.s,
  },
  nom: {
    fontSize: 22,
    fontWeight: '700',
    color: couleurs.texte,
  },
  carte: {
    backgroundColor: couleurs.carte,
    borderColor: couleurs.bordure,
    borderWidth: 1,
    borderRadius: rayons.l,
    padding: espacements.l,
    marginBottom: espacements.m,
  },
  ligne: {
    paddingVertical: espacements.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: couleurs.bordure,
  },
  libelle: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
    marginBottom: 2,
  },
  valeur: {
    fontSize: 15,
    color: couleurs.texte,
  },
  notes: {
    fontSize: 15,
    lineHeight: 21,
    color: couleurs.texte,
  },
  actions: {
    gap: espacements.m,
    marginTop: espacements.s,
  },
  bouton: {
    backgroundColor: couleurs.primaire,
    borderRadius: rayons.l,
    paddingVertical: espacements.l,
    alignItems: 'center',
  },
  boutonSupprimer: {
    borderWidth: 1,
    borderColor: couleurs.perime,
    borderRadius: rayons.l,
    paddingVertical: espacements.l,
    alignItems: 'center',
  },
  presse: {
    opacity: 0.7,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  texteSupprimer: {
    color: couleurs.perime,
    fontSize: 15,
    fontWeight: '600',
  },
});
