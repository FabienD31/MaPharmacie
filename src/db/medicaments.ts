import type { SQLiteDatabase } from 'expo-sqlite';

import type { LigneMedicament, Medicament, SaisieMedicament } from './schema';

/** Critères de filtrage de la liste. Tous optionnels. */
export type FiltresListe = {
  /** Recherche texte sur le nom et le principe actif. */
  recherche?: string;
  lieuRangement?: string | null;
  forme?: string | null;
  /** Ne garder que les médicaments portant cet effet. */
  effet?: string | null;
};

/**
 * Convertit une ligne SQLite (snake_case) vers le modèle de l'app (camelCase).
 * Les effets sont rattachés séparément, voir `attacherEffets`.
 */
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
    effets: [],
    creeLe: ligne.cree_le,
    modifieLe: ligne.modifie_le,
  };
}

/**
 * Rattache leurs effets à une liste de médicaments.
 *
 * Une seule requête pour tout le lot plutôt qu'une par médicament : la table
 * des effets reste petite, et on évite autant d'allers-retours que de lignes.
 */
async function attacherEffets(
  db: SQLiteDatabase,
  medicaments: Medicament[]
): Promise<Medicament[]> {
  if (medicaments.length === 0) return medicaments;

  const lignes = await db.getAllAsync<{ medicament_id: number; effet: string }>(
    'SELECT medicament_id, effet FROM effets ORDER BY effet COLLATE NOCASE ASC'
  );

  const parMedicament = new Map<number, string[]>();
  for (const ligne of lignes) {
    const existants = parMedicament.get(ligne.medicament_id);
    if (existants) existants.push(ligne.effet);
    else parMedicament.set(ligne.medicament_id, [ligne.effet]);
  }

  return medicaments.map((medicament) => ({
    ...medicament,
    effets: parMedicament.get(medicament.id) ?? [],
  }));
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

  if (filtres.effet) {
    conditions.push('id IN (SELECT medicament_id FROM effets WHERE effet = ?)');
    parametres.push(filtres.effet);
  }

  const clauseWhere =
    conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const lignes = await db.getAllAsync<LigneMedicament>(
    `SELECT * FROM medicaments
     ${clauseWhere}
     ORDER BY date_peremption IS NULL, date_peremption ASC, nom COLLATE NOCASE ASC`,
    parametres
  );

  return attacherEffets(db, lignes.map(versMedicament));
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
  if (!ligne) return null;

  const [avecEffets] = await attacherEffets(db, [versMedicament(ligne)]);
  return avecEffets;
}

/** Remplace l'ensemble des effets d'un médicament. */
async function remplacerEffets(
  db: SQLiteDatabase,
  idMedicament: number,
  effets: string[]
): Promise<void> {
  await db.runAsync('DELETE FROM effets WHERE medicament_id = ?', [
    idMedicament,
  ]);

  // Doublons écartés sans tenir compte de la casse : « Fièvre » et « fièvre »
  // ne doivent pas devenir deux entrées distinctes.
  const vus = new Set<string>();

  for (const effet of effets) {
    const propre = effet.trim();
    if (propre.length === 0) continue;

    const cle = propre.toLocaleLowerCase('fr-FR');
    if (vus.has(cle)) continue;
    vus.add(cle);

    await db.runAsync(
      'INSERT OR IGNORE INTO effets (medicament_id, effet) VALUES (?, ?)',
      [idMedicament, propre]
    );
  }
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

  await remplacerEffets(db, resultat.lastInsertRowId, saisie.effets);

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

  await remplacerEffets(db, id, saisie.effets);
}

/** Supprime définitivement un médicament et ses effets. */
export async function supprimerMedicament(
  db: SQLiteDatabase,
  id: number
): Promise<void> {
  // La cascade s'en chargerait, mais la suppression explicite garantit le
  // nettoyage même si `PRAGMA foreign_keys` n'a pas été posé.
  await db.runAsync('DELETE FROM effets WHERE medicament_id = ?', [id]);
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

/** Tous les effets déjà saisis, pour l'autocomplétion et la recherche. */
export async function tousLesEffets(db: SQLiteDatabase): Promise<string[]> {
  const lignes = await db.getAllAsync<{ effet: string }>(
    'SELECT DISTINCT effet FROM effets ORDER BY effet COLLATE NOCASE ASC'
  );
  return lignes.map((ligne) => ligne.effet);
}

/**
 * Médicaments dont un effet correspond à la recherche.
 *
 * Recherche volontairement permissive (sous-chaîne) : saisir « tête » doit
 * retrouver « mal de tête ».
 */
export async function chercherParEffet(
  db: SQLiteDatabase,
  symptome: string
): Promise<Medicament[]> {
  const propre = symptome.trim();
  if (propre.length === 0) return [];

  const lignes = await db.getAllAsync<LigneMedicament>(
    `SELECT * FROM medicaments
     WHERE id IN (
       SELECT medicament_id FROM effets WHERE effet LIKE ?
     )
     ORDER BY date_peremption IS NULL, date_peremption ASC, nom COLLATE NOCASE ASC`,
    [`%${propre}%`]
  );

  return attacherEffets(db, lignes.map(versMedicament));
}
