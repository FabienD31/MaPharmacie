import type { SQLiteDatabase } from 'expo-sqlite';

/** Réglages de l'application, stockés dans la table `parametres`. */
export type Preferences = {
  /** Les notifications locales de péremption sont-elles activées ? */
  notificationsActives: boolean;
  /** Nombre de jours avant péremption déclenchant l'alerte. */
  seuilJours: number;
  /** Heure locale d'envoi de la notification, de 0 à 23. */
  heureRappel: number;
  /**
   * L'avertissement sur la sortie réseau de la recherche web a-t-il déjà été
   * affiché ? Évite de le répéter à chaque appui sur le nom d'un médicament.
   */
  avertissementWebVu: boolean;
};

export const PREFERENCES_PAR_DEFAUT: Preferences = {
  notificationsActives: false,
  seuilJours: 30,
  heureRappel: 9,
  avertissementWebVu: false,
};

/** Bornes acceptées pour le seuil d'alerte, en jours. */
export const SEUIL_MIN = 1;
export const SEUIL_MAX = 365;

/**
 * Lit les réglages.
 * Toute valeur absente ou illisible retombe sur la valeur par défaut :
 * l'application démarre même si la table vient d'être créée.
 */
export async function lirePreferences(
  db: SQLiteDatabase
): Promise<Preferences> {
  const lignes = await db.getAllAsync<{ cle: string; valeur: string }>(
    'SELECT cle, valeur FROM parametres'
  );

  const stockees = new Map(lignes.map((ligne) => [ligne.cle, ligne.valeur]));

  const seuilBrut = Number.parseInt(stockees.get('seuilJours') ?? '', 10);
  const heureBrute = Number.parseInt(stockees.get('heureRappel') ?? '', 10);
  const notifications = stockees.get('notificationsActives');
  const avertissement = stockees.get('avertissementWebVu');

  return {
    notificationsActives:
      notifications === undefined
        ? PREFERENCES_PAR_DEFAUT.notificationsActives
        : notifications === '1',
    avertissementWebVu:
      avertissement === undefined
        ? PREFERENCES_PAR_DEFAUT.avertissementWebVu
        : avertissement === '1',
    seuilJours:
      Number.isFinite(seuilBrut) && seuilBrut >= SEUIL_MIN && seuilBrut <= SEUIL_MAX
        ? seuilBrut
        : PREFERENCES_PAR_DEFAUT.seuilJours,
    heureRappel:
      Number.isFinite(heureBrute) && heureBrute >= 0 && heureBrute <= 23
        ? heureBrute
        : PREFERENCES_PAR_DEFAUT.heureRappel,
  };
}

/** Enregistre les réglages (remplace les valeurs existantes). */
export async function ecrirePreferences(
  db: SQLiteDatabase,
  preferences: Preferences
): Promise<void> {
  const entrees: [string, string][] = [
    ['notificationsActives', preferences.notificationsActives ? '1' : '0'],
    ['seuilJours', String(preferences.seuilJours)],
    ['heureRappel', String(preferences.heureRappel)],
    ['avertissementWebVu', preferences.avertissementWebVu ? '1' : '0'],
  ];

  for (const [cle, valeur] of entrees) {
    await db.runAsync(
      'INSERT INTO parametres (cle, valeur) VALUES (?, ?) ' +
        'ON CONFLICT(cle) DO UPDATE SET valeur = excluded.valeur',
      [cle, valeur]
    );
  }
}
