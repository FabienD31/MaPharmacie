/**
 * Manipulation des dates de péremption.
 *
 * Les boîtes de médicaments n'indiquent qu'un mois et une année : on s'aligne
 * dessus plutôt que de demander un jour qui n'existe pas sur l'emballage.
 *
 * Format de stockage : « AAAA-MM » (tri SQL direct par ordre alphabétique).
 * Format de saisie et d'affichage : « MM/AA ».
 *
 * Convention retenue : un médicament reste valable jusqu'au DERNIER jour du
 * mois imprimé. C'est la lecture habituelle d'une date de péremption, et c'est
 * aussi la plus prudente : on ne déclare rien périmé avant l'heure.
 *
 * Tous les calculs d'écart se font en UTC sur des dates sans heure, pour que le
 * nombre de jours restants ne dépende ni du fuseau ni de l'heure courante.
 */

/** État d'un médicament vis-à-vis de sa date de péremption. */
export type StatutPeremption = 'perime' | 'bientot' | 'valide' | 'inconnu';

const ISO = /^(\d{4})-(\d{2})$/;
const SAISIE = /^(\d{2})\/(\d{2})$/;
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/**
 * Convertit une saisie « MM/AA » vers le format de stockage « AAAA-MM ».
 * Renvoie null si la saisie est vide, mal formée ou si le mois n'existe pas.
 *
 * L'année sur deux chiffres est interprétée comme 20AA : une date de
 * péremption est toujours dans un passé proche ou dans le futur.
 */
export function saisieVersIso(saisie: string): string | null {
  const correspondance = SAISIE.exec(saisie.trim());
  if (!correspondance) return null;

  const mois = Number(correspondance[1]);
  if (mois < 1 || mois > 12) return null;

  return `20${correspondance[2]}-${correspondance[1]}`;
}

/** Convertit une date stockée vers l'affichage « MM/AA ». */
export function isoVersAffichage(iso: string | null): string {
  if (!iso) return 'Non renseignée';
  const correspondance = ISO.exec(iso);
  if (!correspondance) return iso;
  return `${correspondance[2]}/${correspondance[1].slice(2)}`;
}

/** Mois en cours au format de stockage, en heure locale. */
export function moisCourantIso(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}`;
}

/**
 * Horodatage UTC du dernier jour du mois stocké.
 *
 * `Date.UTC(annee, mois, 0)` désigne le jour 0 du mois suivant, c'est-à-dire
 * le dernier jour du mois voulu — années bissextiles comprises.
 */
function finDeMoisHorodatage(iso: string): number | null {
  const correspondance = ISO.exec(iso);
  if (!correspondance) return null;
  return Date.UTC(Number(correspondance[1]), Number(correspondance[2]), 0);
}

/** Horodatage UTC du jour courant, à minuit. */
function aujourdHuiHorodatage(): number {
  const maintenant = new Date();
  return Date.UTC(
    maintenant.getFullYear(),
    maintenant.getMonth(),
    maintenant.getDate()
  );
}

/**
 * Nombre de jours restants avant péremption, dernier jour du mois inclus.
 * Négatif si la date est passée, null si elle est inconnue ou illisible.
 */
export function joursRestants(iso: string | null): number | null {
  if (!iso) return null;
  const cible = finDeMoisHorodatage(iso);
  if (cible === null) return null;
  return Math.round((cible - aujourdHuiHorodatage()) / MS_PAR_JOUR);
}

/** Classe un médicament selon sa date de péremption et le seuil d'alerte. */
export function statutPeremption(
  iso: string | null,
  seuilJours: number
): StatutPeremption {
  const jours = joursRestants(iso);
  if (jours === null) return 'inconnu';
  if (jours < 0) return 'perime';
  if (jours <= seuilJours) return 'bientot';
  return 'valide';
}

/**
 * Libellé court décrivant l'échéance, destiné au badge de la liste.
 * Exemples : « Périmé depuis 12 j », « Dans 5 j », « Expire fin de mois ».
 */
export function libellePeremption(iso: string | null): string {
  const jours = joursRestants(iso);
  if (jours === null) return 'Date inconnue';
  if (jours < 0) {
    const depuis = Math.abs(jours);
    return depuis === 1 ? 'Périmé depuis 1 j' : `Périmé depuis ${depuis} j`;
  }
  if (jours === 0) return "Expire aujourd'hui";
  if (jours === 1) return 'Expire demain';
  return `Dans ${jours} j`;
}
