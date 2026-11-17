import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BarreRecherche } from '../src/components/BarreRecherche';
import { CarteMedicament } from '../src/components/CarteMedicament';
import { chercherParEffet, tousLesEffets } from '../src/db/medicaments';
import type { Medicament } from '../src/db/schema';
import { usePreferences } from '../src/lib/ContextePreferences';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/** Délai avant de relancer la requête pendant la frappe, en millisecondes. */
const DELAI_RECHERCHE = 250;

/**
 * Recherche dans l'inventaire à partir d'un symptôme.
 *
 * ⚠️ Cet écran ne recommande rien et ne décide rien. Il ne fait que retrouver
 * les médicaments auxquels l'utilisateur a lui-même associé un effet. Le
 * résultat ne dit pas qu'un médicament convient à la situation : c'est
 * précisément le rôle de la notice et du pharmacien, rappelé en haut de page.
 */
export default function RechercheSymptomes() {
  const db = useSQLiteContext();
  const { preferences } = usePreferences();

  const [saisie, setSaisie] = useState('');
  const [recherche, setRecherche] = useState('');
  const [resultats, setResultats] = useState<Medicament[]>([]);
  const [effetsConnus, setEffetsConnus] = useState<string[]>([]);

  // Les effets déjà enregistrés servent de raccourcis de recherche.
  useEffect(() => {
    let actif = true;
    tousLesEffets(db).then((liste) => {
      if (actif) setEffetsConnus(liste);
    });
    return () => {
      actif = false;
    };
  }, [db]);

  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie), DELAI_RECHERCHE);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  useEffect(() => {
    let actif = true;

    if (recherche.trim().length === 0) {
      setResultats([]);
      return;
    }

    chercherParEffet(db, recherche).then((trouves) => {
      if (actif) setResultats(trouves);
    });

    return () => {
      actif = false;
    };
  }, [db, recherche]);

  const rechercheEnCours = recherche.trim().length > 0;

  return (
    <View style={styles.ecran}>
      <FlatList
        data={resultats}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.liste}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.avertissement}>
              <Text style={styles.texteAvertissement}>
                Cette recherche parcourt uniquement ce que tu as noté toi-même.
                Elle n&apos;indique pas qu&apos;un médicament convient à ta
                situation. En cas de doute, lis la notice ou demande à un
                pharmacien.
              </Text>
            </View>

            <BarreRecherche valeur={saisie} onChange={setSaisie} />

            {effetsConnus.length > 0 && (
              <>
                <Text style={styles.sousTitre}>Effets enregistrés</Text>
                <View style={styles.puces}>
                  {effetsConnus.map((effet) => {
                    const actif = saisie === effet;
                    return (
                      <Pressable
                        key={effet}
                        onPress={() => setSaisie(actif ? '' : effet)}
                        accessibilityRole="button"
                        accessibilityState={{ selected: actif }}
                        style={({ pressed }) => [
                          styles.puce,
                          actif && styles.puceActive,
                          pressed && styles.pucePressee,
                        ]}
                      >
                        <Text
                          style={[
                            styles.textePuce,
                            actif && styles.textePuceActif,
                          ]}
                        >
                          {effet}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}

            {rechercheEnCours && (
              <Text style={styles.compteur}>
                {resultats.length}
                {resultats.length === 1 ? ' médicament' : ' médicaments'} dans ta
                pharmacie
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTitre}>
              {rechercheEnCours
                ? 'Aucun médicament noté pour ce symptôme'
                : 'Saisis un symptôme'}
            </Text>
            <Text style={styles.videTexte}>
              {rechercheEnCours
                ? "Ça ne veut pas dire que tu n'as rien : seulement que tu n'as pas noté d'effet correspondant."
                : 'Par exemple « mal de tête », ou touche un effet déjà enregistré.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <CarteMedicament
            medicament={item}
            seuilJours={preferences.seuilJours}
            onPress={() => router.push(`/medicament/${item.id}`)}
          />
        )}
      />
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
    paddingBottom: espacements.xxl,
  },
  avertissement: {
    backgroundColor: couleurs.avertissementFond,
    borderColor: couleurs.avertissementBordure,
    borderWidth: 1,
    borderRadius: rayons.m,
    padding: espacements.m,
    marginBottom: espacements.l,
  },
  texteAvertissement: {
    color: couleurs.texte,
    fontSize: 13,
    lineHeight: 18,
  },
  sousTitre: {
    fontSize: 12,
    fontWeight: '600',
    color: couleurs.texteSecondaire,
    marginBottom: espacements.s,
  },
  puces: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: espacements.s,
    marginBottom: espacements.m,
  },
  puce: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    backgroundColor: couleurs.carte,
    borderRadius: rayons.l,
    paddingVertical: 6,
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
  textePuceActif: {
    color: couleurs.primaire,
    fontWeight: '600',
  },
  compteur: {
    fontSize: 12,
    color: couleurs.texteSecondaire,
    marginBottom: espacements.m,
  },
  vide: {
    alignItems: 'center',
    paddingVertical: espacements.xl,
    gap: espacements.s,
  },
  videTitre: {
    fontSize: 16,
    fontWeight: '600',
    color: couleurs.texte,
    textAlign: 'center',
  },
  videTexte: {
    fontSize: 14,
    color: couleurs.texteSecondaire,
    textAlign: 'center',
    paddingHorizontal: espacements.l,
  },
});
