import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avertissement } from '../src/components/Avertissement';
import { BarreRecherche } from '../src/components/BarreRecherche';
import { CarteMedicament } from '../src/components/CarteMedicament';
import { LigneFiltres } from '../src/components/LigneFiltres';
import { listerMedicaments, valeursDistinctes } from '../src/db/medicaments';
import { SEUIL_ALERTE_JOURS, type Medicament } from '../src/db/schema';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/** Délai avant de relancer la requête pendant la frappe, en millisecondes. */
const DELAI_RECHERCHE = 250;

/**
 * Écran d'accueil : la liste des médicaments, péremptions les plus proches
 * en premier, avec recherche texte et filtres par lieu et par forme.
 *
 * Le tri et le filtrage sont faits par SQLite (voir listerMedicaments) plutôt
 * qu'en JavaScript : la base reste la seule source de vérité.
 */
export default function Accueil() {
  const db = useSQLiteContext();

  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [total, setTotal] = useState(0);

  const [recherche, setRecherche] = useState('');
  const [rechercheDifferee, setRechercheDifferee] = useState('');
  const [lieu, setLieu] = useState<string | null>(null);
  const [forme, setForme] = useState<string | null>(null);

  const [lieuxDisponibles, setLieuxDisponibles] = useState<string[]>([]);
  const [formesDisponibles, setFormesDisponibles] = useState<string[]>([]);

  const filtresActifs =
    rechercheDifferee.trim().length > 0 || lieu !== null || forme !== null;

  // On attend une courte pause dans la frappe avant d'interroger la base,
  // pour éviter une requête par caractère saisi.
  useEffect(() => {
    const minuteur = setTimeout(
      () => setRechercheDifferee(recherche),
      DELAI_RECHERCHE
    );
    return () => clearTimeout(minuteur);
  }, [recherche]);

  // Rechargement au focus de l'écran et à chaque changement de critère :
  // au retour du formulaire ou d'une suppression, la liste reflète la base.
  useFocusEffect(
    useCallback(() => {
      let actif = true;

      async function charger() {
        const [resultats, nombreTotal, lieux, formes] = await Promise.all([
          listerMedicaments(db, {
            recherche: rechercheDifferee,
            lieuRangement: lieu,
            forme,
          }),
          listerMedicaments(db).then((tous) => tous.length),
          valeursDistinctes(db, 'lieu_rangement'),
          valeursDistinctes(db, 'forme'),
        ]);

        if (!actif) return;
        setMedicaments(resultats);
        setTotal(nombreTotal);
        setLieuxDisponibles(lieux);
        setFormesDisponibles(formes);
      }

      charger();

      return () => {
        actif = false;
      };
    }, [db, rechercheDifferee, lieu, forme])
  );

  /** Remet la liste à plat : ni recherche, ni filtre. */
  function reinitialiser() {
    setRecherche('');
    setRechercheDifferee('');
    setLieu(null);
    setForme(null);
  }

  // Un inventaire vide et une recherche sans résultat n'appellent pas le
  // même message : le premier invite à ajouter, le second à élargir.
  const inventaireVide = total === 0;

  return (
    <View style={styles.ecran}>
      <FlatList
        data={medicaments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.liste}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <Avertissement />

            {!inventaireVide && (
              <>
                <BarreRecherche valeur={recherche} onChange={setRecherche} />

                <LigneFiltres
                  libelle="Lieu de rangement"
                  options={lieuxDisponibles}
                  valeur={lieu}
                  onChange={setLieu}
                />

                <LigneFiltres
                  libelle="Forme"
                  options={formesDisponibles}
                  valeur={forme}
                  onChange={setForme}
                />

                <View style={styles.resume}>
                  <Text style={styles.compteur}>
                    {medicaments.length} sur {total}
                    {medicaments.length === 1 ? ' médicament' : ' médicaments'}
                  </Text>

                  {filtresActifs && (
                    <Pressable
                      onPress={reinitialiser}
                      accessibilityRole="button"
                      hitSlop={8}
                    >
                      <Text style={styles.reinitialiser}>Tout afficher</Text>
                    </Pressable>
                  )}
                </View>
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTitre}>
              {inventaireVide
                ? 'Aucun médicament enregistré'
                : 'Aucun résultat'}
            </Text>
            <Text style={styles.videTexte}>
              {inventaireVide
                ? 'Ajoute un premier médicament pour commencer ton inventaire.'
                : 'Aucun médicament ne correspond à ta recherche ou à tes filtres.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CarteMedicament
            medicament={item}
            seuilJours={SEUIL_ALERTE_JOURS}
            onPress={() => router.push(`/medicament/${item.id}`)}
          />
        )}
      />

      <Pressable
        onPress={() => router.push('/formulaire')}
        accessibilityRole="button"
        accessibilityLabel="Ajouter un médicament"
        style={({ pressed }) => [styles.bouton, pressed && styles.boutonPresse]}
      >
        <Text style={styles.texteBouton}>+ Ajouter un médicament</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: {
    flex: 1,
    backgroundColor: couleurs.fond,
  },
  liste: {
    padding: espacements.l,
    // Laisse la place au bouton flottant en bas de l'écran.
    paddingBottom: 96,
  },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: espacements.m,
  },
  compteur: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
  },
  reinitialiser: {
    fontSize: 12,
    fontWeight: '600',
    color: couleurs.primaire,
  },
  vide: {
    alignItems: 'center',
    paddingVertical: espacements.xxl,
    gap: espacements.s,
  },
  videTitre: {
    fontSize: 16,
    fontWeight: '600',
    color: couleurs.texte,
  },
  videTexte: {
    fontSize: 14,
    color: couleurs.texteSecondaire,
    textAlign: 'center',
    paddingHorizontal: espacements.xl,
  },
  bouton: {
    position: 'absolute',
    left: espacements.l,
    right: espacements.l,
    bottom: espacements.xl,
    backgroundColor: couleurs.primaire,
    borderRadius: rayons.l,
    paddingVertical: espacements.l,
    alignItems: 'center',
  },
  boutonPresse: {
    opacity: 0.8,
  },
  texteBouton: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
