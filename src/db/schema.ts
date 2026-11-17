/**
 * Modèle de données et listes de référence.
 *
 * Les dates de péremption sont stockées en TEXT au format « AAAA-MM », comme
 * sur les boîtes, qui n'impriment qu'un mois et une année. Ce format se trie
 * correctement en SQL par ordre alphabétique, ce qui évite toute conversion au
 * moment du tri par péremption.
 */

/** Un médicament tel qu'il est stocké en base. */
export type Medicament = {
  id: number;
  nom: string;
  principeActif: string | null;
  dosage: string | null;
  forme: string | null;
  quantiteRestante: number | null;
  /** Format « AAAA-MM », ou null si la date est inconnue. */
  datePeremption: string | null;
  lieuRangement: string | null;
  notes: string | null;
  /**
   * Ce sur quoi le médicament agit, tel que l'utilisateur l'a noté
   * (« mal de tête », « courbature »). Jamais un conseil de prise.
   */
  effets: string[];
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
