/**
 * Recherche d'un médicament par son code CIP13.
 *
 * ⚠️ SORTIE RÉSEAU — ce module interroge un service distant. Ce qui sort du
 * téléphone : le code CIP13 lu sur la boîte, rien d'autre. Pas ton inventaire,
 * pas tes quantités, pas tes notes, pas d'identifiant d'appareil.
 *
 * Le service utilisé n'est pas celui de l'ANSM : c'est une API tierce qui
 * republie la base de données publique des médicaments. Elle peut donc
 * disparaître ou changer de format sans préavis. Tout l'appel est isolé ici
 * pour qu'un remplacement ne touche qu'un seul fichier, et l'application reste
 * pleinement utilisable en saisie manuelle si l'API ne répond pas.
 */

/** Base de l'API. Un seul endroit à changer si le service change. */
const BASE_API = 'https://medicaments-api.giygas.dev/v1';

/** Au-delà, on rend la main plutôt que de bloquer l'utilisateur. */
const DELAI_MAX_MS = 10000;

/** Champs d'un médicament tels que l'API les renvoie, limités à nos besoins. */
type ReponseApi = {
  elementPharmaceutique?: string;
  formePharmaceutique?: string;
  composition?: {
    denominationSubstance?: string;
    dosage?: string;
    natureComposant?: string;
  }[];
  presentation?: {
    cip13?: number;
    libelle?: string;
  }[];
};

/** Informations exploitables pour préremplir le formulaire. */
export type FicheDistante = {
  nom: string;
  principeActif: string | null;
  dosage: string | null;
  forme: string | null;
  quantite: number | null;
};

export type ResultatRecherche =
  | { statut: 'trouve'; fiche: FicheDistante }
  | { statut: 'inconnu' }
  | { statut: 'erreur'; message: string };

/**
 * Nettoie le nom renvoyé par la base.
 * L'API donne « CODOLIPRANE 500 mg/30 mg, comprimé » : on ne garde que la
 * partie avant la virgule, le dosage et la forme ayant leurs propres champs.
 */
function nettoyerNom(libelle: string): string {
  const avantVirgule = libelle.split(',')[0].trim();
  return avantVirgule.length > 0 ? avantVirgule : libelle.trim();
}

/** Met en forme la première lettre en capitale, le reste en minuscules. */
function capitaliser(texte: string): string {
  const propre = texte.trim().toLocaleLowerCase('fr-FR');
  return propre.charAt(0).toLocaleUpperCase('fr-FR') + propre.slice(1);
}

/**
 * Déduit le nombre d'unités du libellé de présentation.
 * Exemple : « plaquette(s) … de 16 comprimé(s) » donne 16.
 */
function extraireQuantite(libelle: string | undefined): number | null {
  if (!libelle) return null;
  const correspondance = /\bde\s+(\d+)\s/.exec(libelle);
  if (!correspondance) return null;
  const nombre = Number.parseInt(correspondance[1], 10);
  return Number.isFinite(nombre) ? nombre : null;
}

/** Transforme la réponse de l'API en champs du formulaire. */
function versFiche(reponse: ReponseApi, cip13: string): FicheDistante | null {
  const libelle = reponse.elementPharmaceutique;
  if (!libelle) return null;

  // Les substances actives, par opposition aux fractions thérapeutiques.
  const substances = (reponse.composition ?? []).filter(
    (composant) => composant.natureComposant === 'SA'
  );

  const principeActif =
    substances.length > 0
      ? substances
          .map((composant) => capitaliser(composant.denominationSubstance ?? ''))
          .filter((nom) => nom.length > 0)
          .join(' + ')
      : null;

  const dosage =
    substances.length > 0
      ? substances
          .map((composant) => composant.dosage ?? '')
          .filter((valeur) => valeur.length > 0)
          .join(' / ')
      : null;

  // On cherche la présentation correspondant exactement au code scanné :
  // un même médicament existe en plusieurs conditionnements.
  const presentation = (reponse.presentation ?? []).find(
    (item) => String(item.cip13) === cip13
  );

  return {
    nom: nettoyerNom(libelle),
    principeActif: principeActif && principeActif.length > 0 ? principeActif : null,
    dosage: dosage && dosage.length > 0 ? dosage : null,
    forme: reponse.formePharmaceutique
      ? capitaliser(reponse.formePharmaceutique)
      : null,
    quantite: extraireQuantite(presentation?.libelle),
  };
}

/**
 * Interroge l'API pour un code CIP13.
 * Ne lève jamais : toute panne se traduit par un statut que l'écran affiche.
 */
export async function chercherParCip13(
  cip13: string
): Promise<ResultatRecherche> {
  const abandon = new AbortController();
  const minuteur = setTimeout(() => abandon.abort(), DELAI_MAX_MS);

  try {
    const reponse = await fetch(
      `${BASE_API}/medicaments?cip=${encodeURIComponent(cip13)}`,
      { signal: abandon.signal, headers: { Accept: 'application/json' } }
    );

    if (reponse.status === 404) return { statut: 'inconnu' };

    if (!reponse.ok) {
      return {
        statut: 'erreur',
        message: `Le service a répondu ${reponse.status}.`,
      };
    }

    const donnees = (await reponse.json()) as ReponseApi | ReponseApi[];
    // Selon les cas, l'API renvoie un objet seul ou une liste.
    const premier = Array.isArray(donnees) ? donnees[0] : donnees;

    if (!premier) return { statut: 'inconnu' };

    const fiche = versFiche(premier, cip13);
    return fiche ? { statut: 'trouve', fiche } : { statut: 'inconnu' };
  } catch (erreur) {
    const interrompu = erreur instanceof Error && erreur.name === 'AbortError';
    return {
      statut: 'erreur',
      message: interrompu
        ? 'Le service met trop de temps à répondre.'
        : "Impossible de joindre le service. Vérifie ta connexion.",
    };
  } finally {
    clearTimeout(minuteur);
  }
}
