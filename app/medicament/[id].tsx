import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BadgePeremption } from '../../src/components/BadgePeremption';
import { obtenirMedicament, supprimerMedicament } from '../../src/db/medicaments';
import type { Medicament } from '../../src/db/schema';
import { usePreferences } from '../../src/lib/ContextePreferences';
import { isoVersAffichage } from '../../src/lib/dates';
import { supprimerPhoto } from '../../src/lib/photos';
import { ouvrirRechercheWeb } from '../../src/lib/rechercheWeb';
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
  const { preferences, enregistrer } = usePreferences();
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

  /**
   * Ouvre une recherche web sur le médicament.
   * Seule fonctionnalité de cet écran qui sort une information du téléphone.
   */
  function ouvrirWeb() {
    if (!medicament) return;

    ouvrirRechercheWeb(
      medicament.nom,
      medicament.principeActif,
      preferences.avertissementWebVu,
      () => {
        enregistrer({ ...preferences, avertissementWebVu: true }).catch(() => {
          // Mémoriser le choix est un confort, pas une condition.
        });
      }
    );
  }

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
            // La photo part avec la fiche : sans ça, le fichier resterait
            // sur le téléphone sans que rien ne le référence.
            supprimerPhoto(medicament.photoUri);
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
    <ScrollView
      style={styles.ecran}
      contentContainerStyle={[styles.contenu, styles.centre]}
    >
      <View style={styles.entete}>
        {/* Le nom est un lien : il ouvre une recherche web sur le médicament. */}
        <Pressable
          onPress={ouvrirWeb}
          accessibilityRole="link"
          accessibilityLabel={`Rechercher ${medicament.nom} sur internet`}
          style={({ pressed }) => pressed && styles.presse}
        >
          <Text style={styles.nom}>{medicament.nom}</Text>
          <Text style={styles.indiceLien}>Toucher pour chercher sur le web ↗</Text>
        </Pressable>

        <BadgePeremption
          datePeremption={medicament.datePeremption}
          seuilJours={preferences.seuilJours}
        />
      </View>

      {medicament.photoUri && (
        <Image
          source={{ uri: medicament.photoUri }}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel={`Photo de ${medicament.nom}`}
        />
      )}

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

      {medicament.effets.length > 0 && (
        <View style={styles.carte}>
          <Text style={styles.libelle}>Agit sur</Text>
          <View style={styles.effets}>
            {medicament.effets.map((effet) => (
              <View key={effet} style={styles.puceEffet}>
                <Text style={styles.texteEffet}>{effet}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

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
  // Sur tablette, le contenu reste centré et borné : une ligne de texte
  // large de 10 pouces est illisible.
  centre: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
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
    color: couleurs.primaire,
    textDecorationLine: 'underline',
  },
  indiceLien: {
    marginTop: 2,
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
  effets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacements.s,
    marginTop: espacements.s,
  },
  puceEffet: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
    borderWidth: 1,
    borderRadius: rayons.l,
    paddingVertical: 6,
    paddingHorizontal: espacements.m,
  },
  texteEffet: {
    fontSize: 13,
    fontWeight: '600',
    color: couleurs.primaire,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: rayons.l,
    marginBottom: espacements.m,
    backgroundColor: couleurs.bordure,
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
