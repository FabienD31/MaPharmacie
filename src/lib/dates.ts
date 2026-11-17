/**
 * Manipulation des dates de péremption.
 *
 * Format de stockage : « AAAA-MM-JJ » (tri SQL direct).
 * Format de saisie et d'affichage : « JJ/MM/AAAA ».
 *
 * Tous les calculs d'écart se font en UTC sur des dates sans heure, pour que
 * le nombre de jours restants ne dépende ni du fuseau ni de l'heure courante.
 */

/** État d'un médicament vis-à-vis de sa date de péremption. */
export type StatutPeremption = 'perime' | 'bientot' | 'valide' | 'inconnu';

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const SAISIE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Vérifie que le triplet correspond à une date réelle (rejette le 31/02). */
function estDateReelle(annee: number, mois: number, jour: number): boolean {
  if (mois < 1 || mois > 12 || jour < 1 || jour > 31) return false;
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  return (
    date.getUTCFullYear() === annee &&
    date.getUTCMonth() === mois - 1 &&
    date.getUTCDate() === jour
  );
}

/**
 * Convertit une saisie « JJ/MM/AAAA » vers le format de stockage.
 * Renvoie null si la saisie est vide, mal formée ou inexistante au calendrier.
 */
export function saisieVersIso(saisie: string): string | null {
  const correspondance = SAISIE.exec(saisie.trim());
  if (!correspondance) return null;

  const jour = Number(correspondance[1]);
  const mois = Number(correspondance[2]);
  const annee = Number(correspondance[3]);

  if (!estDateReelle(annee, mois, jour)) return null;

  return `${correspondance[3]}-${correspondance[2]}-${correspondance[1]}`;
}

/** Convertit une date stockée vers l'affichage « JJ/MM/AAAA ». */
export function isoVersAffichage(iso: string | null): string {
  if (!iso) return 'Non renseignée';
  const correspondance = ISO.exec(iso);
  if (!correspondance) return iso;
  return `${correspondance[3]}/${correspondance[2]}/${correspondance[1]}`;
}

/** Date du jour au format de stockage, en heure locale. */
export function aujourdHuiIso(): string {
  const maintenant = new Date();
  const mois = String(maintenant.getMonth() + 1).padStart(2, '0');
  const jour = String(maintenant.getDate()).padStart(2, '0');
  return `${maintenant.getFullYear()}-${mois}-${jour}`;
}

/** Convertit « AAAA-MM-JJ » en horodatage UTC à minuit. */
function isoVersHorodatage(iso: string): number | null {
  const correspondance = ISO.exec(iso);
  if (!correspondance) return null;
  return Date.UTC(
    Number(correspondance[1]),
    Number(correspondance[2]) - 1,
    Number(correspondance[3])
  );
}

/**
 * Nombre de jours restants avant péremption.
 * Négatif si la date est passée, null si elle est inconnue ou illisible.
 */
export function joursRestants(iso: string | null): number | null {
  if (!iso) return null;
  const cible = isoVersHorodatage(iso);
  const reference = isoVersHorodatage(aujourdHuiIso());
  if (cible === null || reference === null) return null;
  return Math.round((cible - reference) / MS_PAR_JOUR);
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
 * Exemples : « Périmé depuis 12 j », « Dans 5 j », « Expire aujourd'hui ».
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
