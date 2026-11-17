import type { SQLiteDatabase } from 'expo-sqlite';

import type {
  LigneMedicament,
  Medicament,
  SaisieMedicament,
} from './schema';

/** Critères de filtrage de la liste. Tous optionnels. */
export type FiltresListe = {
  /** Recherche texte sur le nom et le principe actif. */
  recherche?: string;
  lieuRangement?: string | null;
  forme?: string | null;
};

/** Convertit une ligne SQLite (snake_case) vers le modèle de l'app (camelCase). */
function versMedicament(ligne: LigneMedicament): Medicament {
  return {
    id: ligne.id,
    nom: ligne.nom,
    principeActif: ligne.principe_actif,
    dosage: ligne.dosage,
    forme: ligne.forme,
    quantiteRestante: ligne.quantite_restante,
    datePeremption: ligne.date_peremption,
    lieuRangement: ligne.lieu_rangement,
    notes: ligne.notes,
    creeLe: ligne.cree_le,
    modifieLe: ligne.modifie_le,
  };
}

/**
 * Liste les médicaments, les péremptions les plus proches en premier.
 *
 * `date_peremption IS NULL` en première clause de tri renvoie 0 ou 1 :
 * les médicaments sans date connue se retrouvent donc en fin de liste,
 * sans masquer ceux qui ont une échéance réelle.
 */
export async function listerMedicaments(
  db: SQLiteDatabase,
  filtres: FiltresListe = {}
): Promise<Medicament[]> {
  const conditions: string[] = [];
  const parametres: (string | number)[] = [];

  const recherche = filtres.recherche?.trim();
  if (recherche) {
    conditions.push('(nom LIKE ? OR principe_actif LIKE ?)');
    parametres.push(`%${recherche}%`, `%${recherche}%`);
  }

  if (filtres.lieuRangement) {
    conditions.push('lieu_rangement = ?');
    parametres.push(filtres.lieuRangement);
  }

  if (filtres.forme) {
    conditions.push('forme = ?');
    parametres.push(filtres.forme);
  }

  const clauseWhere =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const lignes = await db.getAllAsync<LigneMedicament>(
    `SELECT * FROM medicaments
     ${clauseWhere}
     ORDER BY date_peremption IS NULL, date_peremption ASC, nom COLLATE NOCASE ASC`,
    parametres
  );

  return lignes.map(versMedicament);
}

/** Récupère un médicament par son identifiant, ou null s'il n'existe plus. */
export async function obtenirMedicament(
  db: SQLiteDatabase,
  id: number
): Promise<Medicament | null> {
  const ligne = await db.getFirstAsync<LigneMedicament>(
    'SELECT * FROM medicaments WHERE id = ?',
    [id]
  );
  return ligne ? versMedicament(ligne) : null;
}

/** Insère un médicament et renvoie son identifiant. */
export async function creerMedicament(
  db: SQLiteDatabase,
  saisie: SaisieMedicament
): Promise<number> {
  const maintenant = new Date().toISOString();

  const resultat = await db.runAsync(
    `INSERT INTO medicaments
       (nom, principe_actif, dosage, forme, quantite_restante,
        date_peremption, lieu_rangement, notes, cree_le, modifie_le)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      saisie.nom,
      saisie.principeActif,
      saisie.dosage,
      saisie.forme,
      saisie.quantiteRestante,
      saisie.datePeremption,
      saisie.lieuRangement,
      saisie.notes,
      maintenant,
      maintenant,
    ]
  );

  return resultat.lastInsertRowId;
}

/** Met à jour un médicament existant. */
export async function modifierMedicament(
  db: SQLiteDatabase,
  id: number,
  saisie: SaisieMedicament
): Promise<void> {
  await db.runAsync(
    `UPDATE medicaments SET
       nom = ?, principe_actif = ?, dosage = ?, forme = ?,
       quantite_restante = ?, date_peremption = ?, lieu_rangement = ?,
       notes = ?, modifie_le = ?
     WHERE id = ?`,
    [
      saisie.nom,
      saisie.principeActif,
      saisie.dosage,
      saisie.forme,
      saisie.quantiteRestante,
      saisie.datePeremption,
      saisie.lieuRangement,
      saisie.notes,
      new Date().toISOString(),
      id,
    ]
  );
}

/** Supprime définitivement un médicament. */
export async function supprimerMedicament(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  await db.runAsync('DELETE FROM medicaments WHERE id = ?', [id]);
}

/**
 * Valeurs distinctes présentes en base pour une colonne donnée.
 * Sert à ne proposer dans les filtres que des critères réellement utilisés.
 */
export async function valeursDistinctes(
  db: SQLiteDatabase,
  colonne: 'lieu_rangement' | 'forme'
): Promise<string[]> {
  const lignes = await db.getAllAsync<{ valeur: string }>(
    `SELECT DISTINCT ${colonne} AS valeur
     FROM medicaments
     WHERE ${colonne} IS NOT NULL AND ${colonne} <> ''
     ORDER BY valeur COLLATE NOCASE ASC`
  );
  return lignes.map((ligne) => ligne.valeur);
}
