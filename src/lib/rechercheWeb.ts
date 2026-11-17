import { Alert, Linking } from 'react-native';

/**
 * Ouverture d'une recherche web sur un médicament.
 *
 * ⚠️ SORTIE RÉSEAU — c'est le seul endroit du code où une information quitte
 * le téléphone sans passer par le scan ou les suggestions d'effets. Le nom du
 * médicament est transmis au moteur de recherche, qui voit donc une requête
 * liée à ta pharmacie. L'action est toujours déclenchée par un appui explicite.
 *
 * DuckDuckGo est retenu plutôt qu'un moteur qui relie la requête à un compte.
 */
const MOTEUR = 'https://duckduckgo.com/?q=';

/** Construit l'URL de recherche pour un médicament. */
export function urlRecherche(nom: string, principeActif: string | null): string {
  // Le principe actif précise la recherche quand plusieurs produits
  // portent un nom voisin.
  const termes = [nom, principeActif, 'notice'].filter(Boolean).join(' ');
  return `${MOTEUR}${encodeURIComponent(termes)}`;
}

/**
 * Ouvre la recherche dans le navigateur du téléphone.
 *
 * `avertissementVu` évite de répéter l'explication à chaque appui : la
 * première fois seulement, on dit clairement ce qui va sortir du téléphone.
 * `onAvertissementVu` permet d'enregistrer ce choix.
 */
export async function ouvrirRechercheWeb(
  nom: string,
  principeActif: string | null,
  avertissementVu: boolean,
  onAvertissementVu: () => void
): Promise<void> {
  const url = urlRecherche(nom, principeActif);

  if (avertissementVu) {
    await Linking.openURL(url);
    return;
  }

  Alert.alert(
    'Ouvrir une recherche web',
    `Le nom « ${nom} » va être envoyé à un moteur de recherche, hors de l'application. C'est la seule information qui sort : ta liste, tes quantités et tes notes restent sur le téléphone.`,
    [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Ouvrir',
        onPress: () => {
          onAvertissementVu();
          Linking.openURL(url).catch(() => {
            Alert.alert(
              'Ouverture impossible',
              "Le navigateur n'a pas pu être ouvert."
            );
          });
        },
      },
    ]
  );
}
