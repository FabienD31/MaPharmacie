import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChampTexte } from '../src/components/ChampTexte';
import { SelecteurPuces } from '../src/components/SelecteurPuces';
import {
  creerMedicament,
  modifierMedicament,
  obtenirMedicament,
} from '../src/db/medicaments';
import { FORMES, LIEUX } from '../src/db/schema';
import { isoVersAffichage, saisieVersIso } from '../src/lib/dates';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/** Transforme une saisie vide en null, pour ne pas stocker de chaînes vides. */
function ouNull(valeur: string): string | null {
  const propre = valeur.trim();
  return propre.length > 0 ? propre : null;
}

/**
 * Formulaire d'ajout et de modification.
 *
 * Un même écran sert aux deux cas : avec un paramètre `id`, il charge le
 * médicament existant et le met à jour ; sans `id`, il crée une nouvelle fiche.
 */
export default function Formulaire() {
  const db = useSQLiteContext();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const idMedicament = id ? Number(id) : null;
  const modeEdition = idMedicament !== null;

  const [nom, setNom] = useState('');
  const [principeActif, setPrincipeActif] = useState('');
  const [dosage, setDosage] = useState('');
  const [forme, setForme] = useState<string | null>(null);
  const [quantite, setQuantite] = useState('');
  const [datePeremption, setDatePeremption] = useState('');
  const [lieu, setLieu] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [erreurDate, setErreurDate] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  // Titre de l'en-tête selon le mode.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: modeEdition ? 'Modifier' : 'Nouveau médicament',
    });
  }, [navigation, modeEdition]);

  // En mode édition, on pré-remplit les champs avec la fiche existante.
  useEffect(() => {
    if (idMedicament === null) return;

    let actif = true;
    obtenirMedicament(db, idMedicament).then((medicament) => {
      if (!actif || !medicament) return;
      setNom(medicament.nom);
      setPrincipeActif(medicament.principeActif ?? '');
      setDosage(medicament.dosage ?? '');
      setForme(medicament.forme);
      setQuantite(
        medicament.quantiteRestante !== null
          ? String(medicament.quantiteRestante)
          : ''
      );
      setDatePeremption(
        medicament.datePeremption ? isoVersAffichage(medicament.datePeremption) : ''
      );
      setLieu(medicament.lieuRangement);
      setNotes(medicament.notes ?? '');
    });

    return () => {
      actif = false;
    };
  }, [db, idMedicament]);

  async function enregistrer() {
    // Validation : seul le nom est obligatoire, la date doit être lisible
    // si elle est renseignée.
    const nomPropre = nom.trim();
    const datePropre = datePeremption.trim();
    const dateIso = datePropre.length > 0 ? saisieVersIso(datePropre) : null;

    const nomInvalide = nomPropre.length === 0;
    const dateInvalide = datePropre.length > 0 && dateIso === null;

    setErreurNom(nomInvalide ? 'Le nom est obligatoire.' : null);
    setErreurDate(
      dateInvalide ? 'Date invalide. Format attendu : JJ/MM/AAAA.' : null
    );

    if (nomInvalide || dateInvalide) return;

    // La quantité reste facultative ; une saisie non numérique est ignorée.
    const quantiteNombre = Number.parseInt(quantite.trim(), 10);

    const saisie = {
      nom: nomPropre,
      principeActif: ouNull(principeActif),
      dosage: ouNull(dosage),
      forme,
      quantiteRestante: Number.isFinite(quantiteNombre) ? quantiteNombre : null,
      datePeremption: dateIso,
      lieuRangement: lieu,
      notes: ouNull(notes),
    };

    setEnregistrement(true);
    try {
      if (modeEdition) {
        await modifierMedicament(db, idMedicament, saisie);
      } else {
        await creerMedicament(db, saisie);
      }
      router.back();
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.ecran}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenu}
        keyboardShouldPersistTaps="handled"
      >
        <ChampTexte
          libelle="Nom *"
          value={nom}
          onChangeText={setNom}
          erreur={erreurNom}
          placeholder="Doliprane"
          autoCapitalize="sentences"
        />

        <ChampTexte
          libelle="Principe actif"
          value={principeActif}
          onChangeText={setPrincipeActif}
          placeholder="Paracétamol"
          autoCapitalize="sentences"
        />

        <ChampTexte
          libelle="Dosage"
          value={dosage}
          onChangeText={setDosage}
          placeholder="500 mg"
        />

        <SelecteurPuces
          libelle="Forme"
          options={FORMES}
          valeur={forme}
          onChange={setForme}
          autoriserAutre
        />

        <ChampTexte
          libelle="Quantité restante"
          value={quantite}
          onChangeText={setQuantite}
          placeholder="12"
          keyboardType="number-pad"
        />

        <ChampTexte
          libelle="Date de péremption"
          aide="Format JJ/MM/AAAA"
          value={datePeremption}
          onChangeText={setDatePeremption}
          erreur={erreurDate}
          placeholder="31/12/2027"
          keyboardType="numbers-and-punctuation"
        />

        <SelecteurPuces
          libelle="Lieu de rangement"
          options={LIEUX}
          valeur={lieu}
          onChange={setLieu}
          autoriserAutre
        />

        <ChampTexte
          libelle="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Boîte entamée, ordonnance du 12/03…"
          multiline
          numberOfLines={4}
          style={styles.champNotes}
        />

        <View style={styles.actions}>
          <Pressable
            onPress={enregistrer}
            disabled={enregistrement}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.bouton,
              (pressed || enregistrement) && styles.boutonPresse,
            ]}
          >
            <Text style={styles.texteBouton}>
              {modeEdition ? 'Enregistrer les modifications' : 'Ajouter'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.boutonSecondaire,
              pressed && styles.boutonPresse,
            ]}
          >
            <Text style={styles.texteBoutonSecondaire}>Annuler</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: couleurs.fond,
  },
  contenu: {
    padding: espacements.l,
    paddingBottom: espacements.xxl,
  },
  champNotes: {
    minHeight: 96,
    textAlignVertical: 'top',
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
  boutonPresse: {
    opacity: 0.7,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  boutonSecondaire: {
    borderRadius: rayons.l,
    paddingVertical: espacements.m,
    alignItems: 'center',
  },
  texteBoutonSecondaire: {
    color: couleurs.texteSecondaire,
    fontSize: 14,
  },
});
