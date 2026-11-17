import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avertissement } from '../src/components/Avertissement';
import { CarteMedicament } from '../src/components/CarteMedicament';
import { listerMedicaments } from '../src/db/medicaments';
import { SEUIL_ALERTE_JOURS, type Medicament } from '../src/db/schema';
import { couleurs, espacements, rayons } from '../src/lib/theme';

/**
 * Écran d'accueil : la liste des médicaments, péremptions les plus proches
 * en premier. Le tri est fait par SQLite (voir listerMedicaments).
 */
export default function Accueil() {
  const db = useSQLiteContext();
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);

  // Rechargement à chaque fois que l'écran reprend le focus : au retour du
  // formulaire ou d'une suppression, la liste reflète l'état réel de la base.
  useFocusEffect(
    useCallback(() => {
      let actif = true;

      listerMedicaments(db).then((resultat) => {
        if (actif) setMedicaments(resultat);
      });

      return () => {
        actif = false;
      };
    }, [db])
  );

  return (
    <View style={styles.ecran}>
      <FlatList
        data={medicaments}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.liste}
        ListHeaderComponent={<Avertissement />}
        ListEmptyComponent={
          <View style={styles.vide}>
            <Text style={styles.videTitre}>Aucun médicament enregistré</Text>
            <Text style={styles.videTexte}>
              Ajoute un premier médicament pour commencer ton inventaire.
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
