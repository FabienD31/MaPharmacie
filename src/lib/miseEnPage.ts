import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Adaptation de la mise en page aux grands écrans.
 *
 * Le seuil est exprimé en points indépendants de la densité, pas en pouces :
 * c'est ce que mesure React Native, et c'est ce qui compte pour la mise en
 * page. 600 points correspond à la largeur d'une tablette 7 pouces en mode
 * portrait, et c'est aussi le seuil retenu par Android pour distinguer une
 * tablette d'un téléphone.
 */
const SEUIL_TABLETTE = 600;

/** Au-delà, les lignes de texte deviennent trop longues pour être lisibles. */
const LARGEUR_MAX_CONTENU = 760;

export type MiseEnPage = {
  /** L'écran est-il au moins aussi large qu'une tablette 7 pouces ? */
  estTablette: boolean;
  /** Nombre de colonnes pour la liste des médicaments. */
  colonnes: number;
  /** Largeur maximale du contenu, pour ne pas étirer le texte. */
  largeurMax: number;
};

/**
 * Marge basse à réserver, en plus d'un espacement donné.
 *
 * Android dessine désormais les applications sous les barres système
 * (edge-to-edge) : sans cette marge, un bouton fixé en bas de l'écran passe
 * sous les touches de navigation et devient inatteignable. Sur iPhone, la même
 * valeur couvre la barre d'accueil.
 *
 * L'en-tête de navigation gère déjà le haut de l'écran, seul le bas est à
 * traiter ici.
 */
export function useMargeBasse(espacementDeBase = 0): number {
  const { bottom } = useSafeAreaInsets();
  return espacementDeBase + bottom;
}

/** Mesure l'écran et en déduit la mise en page. Réagit à la rotation. */
export function useMiseEnPage(): MiseEnPage {
  const { width } = useWindowDimensions();

  const estTablette = width >= SEUIL_TABLETTE;

  // Deux colonnes dès la tablette, trois sur les écrans vraiment larges
  // (tablette 10 pouces en paysage).
  const colonnes = width >= 1000 ? 3 : estTablette ? 2 : 1;

  return {
    estTablette,
    colonnes,
    largeurMax: estTablette ? LARGEUR_MAX_CONTENU : width,
  };
}
