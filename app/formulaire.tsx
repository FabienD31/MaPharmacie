import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ChampTexte } from '../src/components/ChampTexte';
import { SelecteurEffets } from '../src/components/SelecteurEffets';
import { SelecteurPuces } from '../src/components/SelecteurPuces';
import {
  creerMedicament,
  modifierMedicament,
  obtenirMedicament,
  tousLesEffets,
} from '../src/db/medicaments';
import { FORMES, LIEUX } from '../src/db/schema';
import { isoVersAffichage, saisieVersIso } from '../src/lib/dates';
import {
  choisirPhoto,
  prendrePhoto,
  supprimerPhoto,
  type ResultatPhoto,
} from '../src/lib/photos';
import { suggererEffets } from '../src/lib/suggestionsIA';
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
  // Les paramètres autres que `id` viennent du scan d'une boîte : ils
  // préremplissent les champs d'une nouvelle fiche, sans rien verrouiller.
  const params = useLocalSearchParams<{
    id?: string;
    nom?: string;
    principeActif?: string;
    dosage?: string;
    forme?: string;
    quantite?: string;
    datePeremption?: string;
  }>();
  const { id } = params;

  const idMedicament = id ? Number(id) : null;
  const modeEdition = idMedicament !== null;
  const prerempliParScan = !modeEdition && params.nom !== undefined;

  const [nom, setNom] = useState(params.nom ?? '');
  const [principeActif, setPrincipeActif] = useState(params.principeActif ?? '');
  const [dosage, setDosage] = useState(params.dosage ?? '');
  const [forme, setForme] = useState<string | null>(params.forme ?? null);
  const [quantite, setQuantite] = useState(params.quantite ?? '');
  const [datePeremption, setDatePeremption] = useState(
    params.datePeremption ? isoVersAffichage(params.datePeremption) : ''
  );
  const [lieu, setLieu] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [effets, setEffets] = useState<string[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [messagePhoto, setMessagePhoto] = useState<string | null>(null);

  /**
   * Photos conservées pendant cette session d'édition mais finalement
   * remplacées ou retirées. Elles ne sont effacées du disque qu'à
   * l'enregistrement : annuler le formulaire ne doit rien détruire.
   */
  const photosAbandonnees = useRef<string[]>([]);

  /** Effets déjà employés ailleurs, proposés comme suggestions. */
  const [suggestionsEffets, setSuggestionsEffets] = useState<string[]>([]);

  /** État de la suggestion d'effets par IA. */
  const [suggestionEnCours, setSuggestionEnCours] = useState(false);
  const [messageIA, setMessageIA] = useState<string | null>(null);

  const [erreurNom, setErreurNom] = useState<string | null>(null);
  const [erreurDate, setErreurDate] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  // Titre de l'en-tête selon le mode.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: modeEdition ? 'Modifier' : 'Nouveau médicament',
    });
  }, [navigation, modeEdition]);

  // Les suggestions viennent de l'ensemble des effets déjà enregistrés.
  useEffect(() => {
    let actif = true;
    tousLesEffets(db).then((liste) => {
      if (actif) setSuggestionsEffets(liste);
    });
    return () => {
      actif = false;
    };
  }, [db]);

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
      setEffets(medicament.effets);
      setPhotoUri(medicament.photoUri);
    });

    return () => {
      actif = false;
    };
  }, [db, idMedicament]);

  /**
   * Traite le retour du sélecteur de photo.
   * L'ancienne photo n'est pas effacée tout de suite : si l'utilisateur
   * annule le formulaire, elle doit être encore là.
   */
  function appliquerPhoto(resultat: ResultatPhoto) {
    if (resultat.statut === 'annule') return;

    if (resultat.statut === 'refus') {
      setMessagePhoto(
        "L'accès à l'appareil photo a été refusé. Tu peux l'autoriser dans les réglages du téléphone."
      );
      return;
    }

    if (resultat.statut === 'erreur') {
      setMessagePhoto(resultat.message);
      return;
    }

    if (photoUri) photosAbandonnees.current.push(photoUri);
    setPhotoUri(resultat.uri);
    setMessagePhoto(null);
  }

  /** Retire la photo de la fiche, sans l'effacer avant enregistrement. */
  function retirerPhoto() {
    if (photoUri) photosAbandonnees.current.push(photoUri);
    setPhotoUri(null);
    setMessagePhoto(null);
  }

  /**
   * Demande à l'IA sur quoi agit ce médicament.
   *
   * Les effets proposés viennent s'ajouter aux puces, et le résumé est écrit
   * dans les notes, signalé comme une suggestion. Rien n'est enregistré ici :
   * tout reste modifiable, et c'est l'enregistrement du formulaire qui décide.
   */
  async function demanderSuggestions() {
    const nomPropre = nom.trim();
    if (nomPropre.length === 0 || suggestionEnCours) return;

    setSuggestionEnCours(true);
    setMessageIA(null);

    const resultat = await suggererEffets(
      nomPropre,
      ouNull(principeActif),
      ouNull(dosage)
    );

    setSuggestionEnCours(false);

    if (resultat.statut === 'sans_cle') {
      setMessageIA(
        "Aucune clé d'API enregistrée. Ajoute-la dans Réglages pour activer les suggestions."
      );
      return;
    }

    if (resultat.statut === 'erreur') {
      setMessageIA(resultat.message);
      return;
    }

    const { effets: proposes, resume } = resultat.suggestions;

    if (proposes.length === 0 && resume.length === 0) {
      setMessageIA("L'IA n'a rien proposé pour ce médicament.");
      return;
    }

    // Fusion sans doublon, en ignorant la casse.
    setEffets((actuels) => {
      const connus = new Set(
        actuels.map((effet) => effet.trim().toLocaleLowerCase('fr-FR'))
      );
      const ajouts = proposes.filter(
        (effet) => !connus.has(effet.trim().toLocaleLowerCase('fr-FR'))
      );
      return [...actuels, ...ajouts];
    });

    // Le résumé va dans les notes, explicitement marqué comme une suggestion
    // pour qu'on ne le confonde pas avec une information vérifiée.
    if (resume.length > 0) {
      const ligne = `Suggestion IA : ${resume}`;
      setNotes((actuelles) =>
        actuelles.includes(ligne)
          ? actuelles
          : actuelles.trim().length > 0
            ? `${actuelles.trim()}\n\n${ligne}`
            : ligne
      );
    }

    setMessageIA('Proposition ajoutée. Vérifie-la avant d’enregistrer.');
  }

  // Après un scan, la proposition est demandée d'office : c'est le moment où
  // elle est utile, et le nom vient d'être rempli par la base publique.
  const suggestionDemandee = useRef(false);
  useEffect(() => {
    if (!prerempliParScan || suggestionDemandee.current) return;
    if (nom.trim().length === 0) return;
    suggestionDemandee.current = true;
    demanderSuggestions();
    // Une seule fois, au retour du scan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prerempliParScan, nom]);

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
      dateInvalide ? 'Date invalide. Format attendu : MM/AA.' : null
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
      effets,
      photoUri,
    };

    setEnregistrement(true);
    try {
      if (modeEdition) {
        await modifierMedicament(db, idMedicament, saisie);
      } else {
        await creerMedicament(db, saisie);
      }

      // Le formulaire est validé : les photos remplacées peuvent partir.
      for (const abandonnee of photosAbandonnees.current) {
        supprimerPhoto(abandonnee);
      }
      photosAbandonnees.current = [];

      router.back();
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <View style={styles.ecran}>
      {/*
        `automaticallyAdjustKeyboardInsets` laisse le système insérer la
        hauteur du clavier sous le contenu et faire défiler jusqu'au champ
        actif. C'est plus fiable qu'un KeyboardAvoidingView, qui décalait tout
        l'écran d'un bloc et pouvait laisser le champ sous le clavier.
      */}
      <ScrollView
        contentContainerStyle={[styles.contenu, styles.centre]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        {prerempliParScan && (
          <View style={styles.bandeauScan}>
            <Text style={styles.texteBandeauScan}>
              Champs préremplis depuis la base publique des médicaments.
              Vérifie-les et corrige si besoin.
            </Text>
          </View>
        )}

        <View style={styles.blocPhoto}>
          <Text style={styles.libellePhoto}>Photo</Text>

          {photoUri ? (
            <Image
              source={{ uri: photoUri }}
              style={styles.apercuPhoto}
              resizeMode="cover"
              accessibilityLabel="Photo du médicament"
            />
          ) : (
            <View style={styles.photoVide}>
              <Text style={styles.textePhotoVide}>Aucune photo</Text>
            </View>
          )}

          <View style={styles.actionsPhoto}>
            <Pressable
              onPress={async () => appliquerPhoto(await prendrePhoto())}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boutonPhoto,
                pressed && styles.boutonPresse,
              ]}
            >
              <Text style={styles.texteBoutonPhoto}>Prendre une photo</Text>
            </Pressable>

            <Pressable
              onPress={async () => appliquerPhoto(await choisirPhoto())}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.boutonPhoto,
                pressed && styles.boutonPresse,
              ]}
            >
              <Text style={styles.texteBoutonPhoto}>Choisir</Text>
            </Pressable>
          </View>

          {photoUri && (
            <Pressable
              onPress={retirerPhoto}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.lienRetirerPhoto}
            >
              <Text style={styles.texteRetirerPhoto}>Retirer la photo</Text>
            </Pressable>
          )}

          {messagePhoto && (
            <Text style={styles.messagePhoto}>{messagePhoto}</Text>
          )}
        </View>

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
          aide="Format MM/AA, comme sur la boîte"
          value={datePeremption}
          onChangeText={setDatePeremption}
          erreur={erreurDate}
          placeholder="12/27"
          keyboardType="numbers-and-punctuation"
          maxLength={5}
        />

        <SelecteurEffets
          valeurs={effets}
          onChange={setEffets}
          suggestions={suggestionsEffets}
        />

        <Pressable
          onPress={demanderSuggestions}
          disabled={suggestionEnCours || nom.trim().length === 0}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.boutonIA,
            (suggestionEnCours || nom.trim().length === 0) &&
              styles.boutonDesactive,
            pressed && styles.boutonPresse,
          ]}
        >
          {suggestionEnCours ? (
            <ActivityIndicator color={couleurs.primaire} />
          ) : (
            <Text style={styles.texteBoutonIA}>
              Proposer ce que ça soigne (IA)
            </Text>
          )}
        </Pressable>

        {messageIA && <Text style={styles.messageIA}>{messageIA}</Text>}

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
    </View>
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
  contenu: {
    padding: espacements.l,
    paddingBottom: espacements.xxl,
  },
  blocPhoto: {
    marginBottom: espacements.l,
  },
  libellePhoto: {
    fontSize: 14,
    fontWeight: '600',
    color: couleurs.texte,
    marginBottom: espacements.s,
  },
  apercuPhoto: {
    width: '100%',
    height: 180,
    borderRadius: rayons.m,
    backgroundColor: couleurs.bordure,
  },
  photoVide: {
    width: '100%',
    height: 110,
    borderRadius: rayons.m,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: couleurs.bordure,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textePhotoVide: {
    fontSize: 13,
    color: couleurs.texteSecondaire,
  },
  actionsPhoto: {
    flexDirection: 'row',
    gap: espacements.s,
    marginTop: espacements.s,
  },
  boutonPhoto: {
    flex: 1,
    borderColor: couleurs.primaire,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingVertical: espacements.m,
    alignItems: 'center',
  },
  texteBoutonPhoto: {
    color: couleurs.primaire,
    fontSize: 14,
    fontWeight: '600',
  },
  lienRetirerPhoto: {
    marginTop: espacements.s,
    alignSelf: 'flex-start',
  },
  texteRetirerPhoto: {
    fontSize: 13,
    fontWeight: '600',
    color: couleurs.perime,
  },
  messagePhoto: {
    marginTop: espacements.s,
    fontSize: 12,
    lineHeight: 17,
    color: couleurs.texteSecondaire,
  },
  boutonIA: {
    borderColor: couleurs.primaire,
    borderWidth: 1,
    borderRadius: rayons.m,
    paddingVertical: espacements.m,
    alignItems: 'center',
    marginBottom: espacements.s,
  },
  boutonDesactive: {
    opacity: 0.4,
  },
  texteBoutonIA: {
    color: couleurs.primaire,
    fontSize: 14,
    fontWeight: '600',
  },
  messageIA: {
    fontSize: 12,
    lineHeight: 17,
    color: couleurs.texteSecondaire,
    marginBottom: espacements.l,
  },
  bandeauScan: {
    backgroundColor: couleurs.primaireClair,
    borderColor: couleurs.primaire,
    borderWidth: 1,
    borderRadius: rayons.m,
    padding: espacements.m,
    marginBottom: espacements.l,
  },
  texteBandeauScan: {
    fontSize: 13,
    lineHeight: 18,
    color: couleurs.primaire,
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
