import type { SQLiteDatabase } from 'expo-sqlite';

/** Nom du fichier SQLite créé dans le stockage privé de l'application. */
export const NOM_BASE = 'mapharmacie.db';

/**
 * Version attendue du schéma.
 * À incrémenter à chaque nouvelle migration ajoutée ci-dessous.
 */
const VERSION_SCHEMA = 3;

/**
 * Applique les migrations manquantes au démarrage.
 *
 * On s'appuie sur `PRAGMA user_version`, un entier stocké dans le fichier
 * SQLite lui-même : il indique jusqu'où les migrations ont déjà été appliquées.
 * Chaque bloc ci-dessous ne s'exécute donc qu'une seule fois par appareil.
 */
export async function migrerBase(db: SQLiteDatabase): Promise<void> {
  const resultat = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  let version = resultat?.user_version ?? 0;

  if (version >= VERSION_SCHEMA) {
    return;
  }

  // Migration 1 : création de la table des médicaments.
  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS medicaments (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        nom               TEXT    NOT NULL,
        principe_actif    TEXT,
        dosage            TEXT,
        forme             TEXT,
        quantite_restante INTEGER,
        date_peremption   TEXT,
        lieu_rangement    TEXT,
        notes             TEXT,
        cree_le           TEXT    NOT NULL,
        modifie_le        TEXT    NOT NULL
      );

      -- Le tri par défaut de l'application se fait sur cette colonne.
      CREATE INDEX IF NOT EXISTS idx_medicaments_peremption
        ON medicaments (date_peremption);
    `);
    version = 1;
  }

  // Migration 2 : les dates de péremption passent de « AAAA-MM-JJ » à
  // « AAAA-MM ». Les boîtes n'impriment qu'un mois et une année ; on tronque
  // les dates déjà saisies plutôt que de demander une ressaisie.
  if (version === 1) {
    await db.execAsync(`
      UPDATE medicaments
      SET date_peremption = substr(date_peremption, 1, 7)
      WHERE date_peremption IS NOT NULL AND length(date_peremption) = 10;
    `);
    version = 2;
  }

  // Migration 3 : table clé/valeur pour les réglages de l'application.
  // Une table plutôt qu'un stockage séparé : tout reste dans le même fichier,
  // donc dans la même sauvegarde et le même effacement si l'app est désinstallée.
  if (version === 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS parametres (
        cle    TEXT PRIMARY KEY NOT NULL,
        valeur TEXT NOT NULL
      );
    `);
    version = 3;
  }

  await db.execAsync(`PRAGMA user_version = ${version}`);
}
