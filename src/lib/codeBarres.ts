/**
 * Décodage des codes-barres des boîtes de médicaments.
 *
 * Les boîtes françaises portent un Datamatrix au format GS1, qui encode
 * plusieurs informations identifiées par un préfixe à deux chiffres
 * (l'« application identifier », ou AI) :
 *
 *   01 → GTIN sur 14 chiffres, dont on tire le code CIP13
 *   17 → date de péremption, au format AAMMJJ
 *   10 → numéro de lot, longueur variable
 *   21 → numéro de série, longueur variable
 *
 * Les AI de longueur fixe s'enchaînent sans séparateur. Les AI de longueur
 * variable se terminent par un caractère GS (ASCII 29) ou par la fin de la
 * chaîne. C'est tout ce que ce module a besoin de comprendre.
 *
 * Les boîtes plus anciennes peuvent ne porter qu'un code-barres linéaire
 * EAN-13, qui contient le CIP13 et rien d'autre.
 */

/** Séparateur de groupe GS1, qui termine les champs de longueur variable. */
const GS = '\u001d';

/** Longueur des AI de taille fixe gérés ici. */
const LONGUEURS_FIXES: Record<string, number> = {
  '01': 14, // GTIN
  '17': 6, // date de péremption AAMMJJ
  '11': 6, // date de fabrication
  '15': 6, // date de durabilité minimale
};

/** AI de longueur variable gérés ici. */
const AI_VARIABLES = new Set(['10', '21', '240']);

export type CodeBarreDecode = {
  /** Code CIP13 de la présentation, ou null si absent du code-barres. */
  cip13: string | null;
  /** Date de péremption au format de stockage « AAAA-MM », ou null. */
  datePeremption: string | null;
  /** Numéro de lot, ou null. */
  lot: string | null;
};

/** Un CIP13 est une suite de 13 chiffres commençant par 34009 en France. */
function estCip13(valeur: string): boolean {
  return /^\d{13}$/.test(valeur);
}

/**
 * Extrait le CIP13 d'un GTIN à 14 chiffres.
 * Le GTIN d'un médicament français est le CIP13 précédé d'un zéro de bourrage.
 */
function gtinVersCip13(gtin: string): string | null {
  if (!/^\d{14}$/.test(gtin)) return null;
  const sansBourrage = gtin.replace(/^0+/, '');
  return sansBourrage.length === 13 ? sansBourrage : null;
}

/**
 * Convertit une date GS1 « AAMMJJ » vers le format de stockage « AAAA-MM ».
 *
 * Le jour est ignoré : l'application raisonne au mois, et GS1 autorise
 * justement « 00 » comme jour pour dire « fin du mois ».
 */
function dateGs1VersIso(brut: string): string | null {
  if (!/^\d{6}$/.test(brut)) return null;

  const mois = Number(brut.slice(2, 4));
  if (mois < 1 || mois > 12) return null;

  return `20${brut.slice(0, 2)}-${brut.slice(2, 4)}`;
}

/**
 * Décode le contenu d'un code-barres de boîte.
 *
 * Renvoie null si rien d'exploitable n'a pu être lu — à l'appelant de dire
 * à l'utilisateur que le code n'a pas été reconnu plutôt que d'inventer.
 */
export function decoderCodeBarre(donnees: string): CodeBarreDecode | null {
  const brut = donnees.trim();
  if (brut.length === 0) return null;

  // Cas simple : un EAN-13 nu, qui est directement le CIP13.
  if (estCip13(brut)) {
    return { cip13: brut, datePeremption: null, lot: null };
  }

  let cip13: string | null = null;
  let datePeremption: string | null = null;
  let lot: string | null = null;

  // Certains lecteurs préfixent le contenu par l'en-tête GS1 « ]d2 ».
  let reste = brut.replace(/^\]d2/, '').replace(/^\]C1/, '');
  let securite = 0;

  while (reste.length >= 2 && securite < 32) {
    securite += 1;

    // Les champs variables peuvent laisser un GS en tête du reste.
    if (reste.startsWith(GS)) {
      reste = reste.slice(1);
      continue;
    }

    const ai = reste.slice(0, 2);
    const longueurFixe = LONGUEURS_FIXES[ai];

    if (longueurFixe !== undefined) {
      const valeur = reste.slice(2, 2 + longueurFixe);
      if (valeur.length < longueurFixe) break;

      if (ai === '01') cip13 = gtinVersCip13(valeur) ?? cip13;
      if (ai === '17') datePeremption = dateGs1VersIso(valeur) ?? datePeremption;

      reste = reste.slice(2 + longueurFixe);
      continue;
    }

    if (AI_VARIABLES.has(ai)) {
      const apres = reste.slice(2);
      const finGs = apres.indexOf(GS);
      const valeur = finGs === -1 ? apres : apres.slice(0, finGs);

      if (ai === '10') lot = valeur.length > 0 ? valeur : null;

      reste = finGs === -1 ? '' : apres.slice(finGs + 1);
      continue;
    }

    // AI inconnu : impossible de deviner où commence le champ suivant,
    // on s'arrête avec ce qui a déjà été lu plutôt que de décoder au hasard.
    break;
  }

  if (cip13 === null && datePeremption === null) return null;

  return { cip13, datePeremption, lot };
}
