/**
 * Modèle de données et listes de référence.
 *
 * Les dates sont stockées en TEXT au format ISO court « AAAA-MM-JJ ».
 * Ce format se trie correctement en SQL par ordre alphabétique, ce qui évite
 * toute conversion au moment du tri par péremption.
 */

/** Un médicament tel qu'il est stocké en base. */
export type Medicament = {
  id: number;
  nom: string;
  principeActif: string | null;
  dosage: string | null;
  forme: string | null;
  quantiteRestante: number | null;
  /** Format « AAAA-MM-JJ », ou null si la date est inconnue. */
  datePeremption: string | null;
  lieuRangement: string | null;
  notes: string | null;
  creeLe: string;
  modifieLe: string;
};

/** Données d'un médicament avant insertion ou mise à jour (sans les métadonnées). */
export type SaisieMedicament = Omit<Medicament, 'id' | 'creeLe' | 'modifieLe'>;

/**
 * Ligne brute renvoyée par SQLite.
 * Les colonnes utilisent le snake_case, on convertit vers le camelCase
 * dans la couche d'accès aux données.
 */
export type LigneMedicament = {
  id: number;
  nom: string;
  principe_actif: string | null;
  dosage: string | null;
  forme: string | null;
  quantite_restante: number | null;
  date_peremption: string | null;
  lieu_rangement: string | null;
  notes: string | null;
  cree_le: string;
  modifie_le: string;
};

/** Formes galéniques proposées dans le formulaire. */
export const FORMES = [
  'Comprimé',
  'Gélule',
  'Sirop',
  'Pommade',
  'Crème',
  'Collyre',
  'Spray',
  'Suppositoire',
  'Sachet',
  'Ampoule',
  'Patch',
] as const;

/** Lieux de rangement proposés dans le formulaire. */
export const LIEUX = [
  'Pharmacie',
  'Salle de bain',
  'Cuisine',
  'Chambre',
  'Trousse',
  'Voiture',
  'Réfrigérateur',
] as const;

/**
 * Seuil par défaut, en jours, à partir duquel un médicament est considéré
 * comme « bientôt périmé ». Deviendra configurable avec les notifications.
 */
export const SEUIL_ALERTE_JOURS = 30;
