import type { SQLiteDatabase } from 'expo-sqlite';
import { Alert } from 'react-native';

import { ajusterQuantite, supprimerMedicament } from '../db/medicaments';
import type { Medicament } from '../db/schema';
import { supprimerPhoto } from './photos';

/**
 * Retrait d'unités consommées.
 *
 * Le geste le plus fréquent de l'application : on prend un comprimé, on le
 * décompte. Il est déclenché depuis la liste comme depuis la fiche, d'où cette
 * logique commune — les deux écrans doivent se comporter à l'identique,
 * popup de fin de boîte comprise.
 */

type Suites = {
  /** Appelé avec la nouvelle quantité, le médicament étant conservé. */
  onQuantite: (nouvelle: number) => void;
  /** Appelé après une suppression confirmée. */
  onSupprime: () => void;
};

/**
 * Propose de retirer le médicament de l'inventaire une fois la boîte vide.
 *
 * On demande plutôt que de supprimer d'office : une boîte vide se garde
 * parfois, le temps de racheter ou pour ne pas perdre les notes associées.
 */
function proposerSuppression(
  db: SQLiteDatabase,
  medicament: Medicament,
  suites: Suites
) {
  Alert.alert(
    'Boîte vide',
    `Il ne reste plus rien de « ${medicament.nom} ». Le retirer de ta pharmacie ?`,
    [
      {
        text: 'Garder',
        style: 'cancel',
        onPress: () => suites.onQuantite(0),
      },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          supprimerPhoto(medicament.photoUri);
          await supprimerMedicament(db, medicament.id);
          suites.onSupprime();
        },
      },
    ]
  );
}

/**
 * Retire `nombre` unités (une par défaut) et gère la fin de boîte.
 * Ne fait rien si le médicament n'a pas de quantité renseignée.
 */
export async function retirerUnites(
  db: SQLiteDatabase,
  medicament: Medicament,
  suites: Suites,
  nombre = 1
): Promise<void> {
  if (medicament.quantiteRestante === null) return;

  const restante = await ajusterQuantite(db, medicament.id, -nombre);
  if (restante === null) return;

  if (restante === 0) {
    proposerSuppression(db, medicament, suites);
    return;
  }

  suites.onQuantite(restante);
}

/** Ajoute des unités, par exemple après un rachat. */
export async function ajouterUnites(
  db: SQLiteDatabase,
  medicament: Medicament,
  onQuantite: (nouvelle: number) => void,
  nombre = 1
): Promise<void> {
  if (medicament.quantiteRestante === null) return;

  const restante = await ajusterQuantite(db, medicament.id, nombre);
  if (restante !== null) onQuantite(restante);
}
